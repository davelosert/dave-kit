import { yabai, YabaiWindow, YabaiSpace } from './yabai'
import { createYabaiStateManager } from './yabaiStateManager';

type Context = {
  spaces: YabaiSpace[],
}

type AppQuery = {
  app: string,
  title?: string | ((title: string) => boolean),
  open?: () => void,
}

type SpacePlan = {
  spaceIndex: number,
  layout: 'bsp' | 'float' | 'stack',
  windows: AppQuery[],
  sizes?: number[],
};

type HydratedSpacePlan = SpacePlan & {
  windows: Array<YabaiWindow | null>,
  space: YabaiSpace,
}

type LayoutPlan = {
  spaces: Array<SpacePlan>,
  nonePlannedWindows?: (windows: YabaiWindow[], context: Context) => Promise<void>
}


function getSpaceByIndex(spaces: YabaiSpace[], spaceIndex: number) {
  if(spaceIndex > 0) {
    return spaces[spaceIndex - 1];
  }

  // Negative space indexes can be taken as they are
  return spaces.at(spaceIndex);
}

async function applyLayout(layout: LayoutPlan) {
  const yabaiStateManager = createYabaiStateManager();
  const remainingWindows = await yabaiStateManager.refreshAllWindows();
  const spaces = await yabaiStateManager.refreshAllSpaces();

  const hydratedSpaces: Array<HydratedSpacePlan> = layout.spaces.map(spacePlan => {
    const windows = spacePlan.windows.map(query => findWindowAndMarkManaged(query));
    return { 
      ...spacePlan, 
      windows, 
      space: getSpaceByIndex(spaces, spacePlan.spaceIndex)
    };
  });

  if(layout.nonePlannedWindows) {
    log(`[Yabai Display Management] Applying nonePlannedWindows`);
    await layout.nonePlannedWindows(remainingWindows, { spaces });
  }

  for(const spacePlan of hydratedSpaces) {
    log(`[Yabai Display Management] Applying SpacePlan for space ${spacePlan.spaceIndex}`);
    await yabai.ensureSpaceLayout(spacePlan.space, spacePlan.layout);
    await putWindowsVerticallyOnSpace(spacePlan.windows, spacePlan.space);

    if(spacePlan.sizes) {
      await applySizeRatioToWindows(spacePlan.windows, spacePlan.sizes);
    } else if (spacePlan.layout === 'bsp') {
      await yabai.balanceSpace(spacePlan.space);
    }
  }

  function findWindowAndMarkManaged (query: AppQuery): YabaiWindow | null {
    const windowIndex = remainingWindows.findIndex(window => {
      return windowMatchesQuery(window, query);
    });
    
    if(windowIndex === -1) return null;

    return remainingWindows.splice(windowIndex, 1)[0];
  }

  async function putWindowsVerticallyOnSpace(windows: YabaiWindow[], space: YabaiSpace) {
    const existingWindows = windows.filter(window => Boolean(window));
    if(existingWindows.length === 0) return;

    const isFirstWindowOnSpace = space.windows.includes(existingWindows[0].id);

    if(!isFirstWindowOnSpace) {
      await yabai.moveWindowToSpaceIfExists(windows[0], space);
      // Overwrite the space information to get the most recent information
      await yabaiStateManager.refreshSpace(space);
    }

    // Nothing more to do if there is only that one window
    if(windows.length === 1) return;

    const isFirstWindow = space['first-window'] === existingWindows[0].id;
    if(!isFirstWindow) {
      await yabai.swapWindows(existingWindows[0].id, space['first-window']);
    }

    let splitToggled = false;
    // First ensure all windows are splite vertically
    for(let window of existingWindows) {
      // Refresh the window information as, after a previous toggle, the split-type might be wrong
      if(splitToggled) {
        log(`Window before: ${JSON.stringify(window, null, 2)}`)
        await yabaiStateManager.refreshWindow(window);
        log(`Window after: ${JSON.stringify(window, null, 2)}`)
      }

      if(window['split-type'] === 'horizontal') {
        await yabai.toggleSplit(window); 
        splitToggled = true;
      }
    }

    if(splitToggled) {
      log(`[Yabai Display Management] Refreshing space ${space.index} after toggling split.`);
      // Refresh so we have the actual current positions and sizes
      await yabaiStateManager.refreshSpace(space);
    }

    // Sort the windows by their x position
    const sortedWindows = [...existingWindows].sort((a, b) => a.frame.x - b.frame.x);
    
    // Don't continue if the windows are on the same space and in the correct order already
    const stop = sortedWindows.every((window, index) => window.id === existingWindows[index].id && window.space === space.index);
    if(stop) return;

    for(let i = 1; i < existingWindows.length; i++) {
      const previousWindow = existingWindows[i-1];
      const currentWindow = existingWindows[i];
      log(`[Yabai Display Management] Moving window ${existingWindows[i].app}.`)
      await yabai.setInsert(previousWindow, 'east');
      await yabai.warpWindow(previousWindow, currentWindow);
    }
  }

  async function applySizeRatioToWindows(windows: YabaiWindow[], ratios: number[]) {
    if(windows.length !== ratios.length) {
      throw new Error('The number of windows and ratios must match');
    }
    
    const totalRatio = ratios.reduce((acc, ratio) => acc + ratio, 0);
    if(totalRatio !== 1) {
      throw new Error('The ratios must add up to 1');
    }

    const totalWidth = windows.reduce((sum, nextWindow) => sum + nextWindow.frame.w, 0);

    // Start from right to left, as yabai has an issue when resizing windows:
    // https://github.com/koekeishiya/yabai/issues/1207
    const reversedWindows = [...windows].reverse();
    ratios.reverse();
    
    for(let [index, window] of reversedWindows.entries()) {
      if(index === windows.length - 1) {
        // The last window should take up the rest of the space
        break;
      }

      const previousWidth = window.frame.w;
      // Refresh the window to always have the actual current width (previous options might have changed it)
      await yabaiStateManager.refreshWindow(window);

      const ratio = ratios[index];
      // This is indeed right, as resizing left needs a negative number to grow the window
      const targetWidth = window.frame.w - (totalWidth * ratio);
      log(`[Yabai Display Management] Resizing window ${window.app} (previous width: ${previousWidth}px,current width ${window.frame.w}px) to targetWidth ${targetWidth}px.`);
      await yabai.resizeWindow(window, `left:${targetWidth}:0`);
    }
  }
}

/**
 * Create a window-opener function which accepts an options object with the following parameters:
 * 1. intervalTime: Specify the interval in which to check for new windows in ms 
*  2. timeout: Specify the timeout after which to stop checking for new windows in ms and emit an error
* 
 * The function returns an object the following functions:
 * 1. add(window: WindowQuery) => void - Adds a window to be opened to the queue
 * 2. onWindowOpened(callback: (window: WindowQuery) => void) => void - Registers a callback to be called when a window is opened
 * 3. onAllWindowsOpened(callback: () => void) => void - Registers a callback to be called when all windows from the queue were opened
 * 4. onError(callback: (error: Error) => void) => void - Registers a callback to be called when an error occured
 *
 * The intervall should only be running while there are windows in the queue. 
 */
type WindowOpenerOptions = {
  intervalTime?: number,
  timeoutTime?: number,
  yabaiStateManager: ReturnType<typeof createYabaiStateManager>,
}

function createWindowOpener({
  intervalTime = 1000,
  timeoutTime = 10000,
  yabaiStateManager,
}) {
  const windowQueue: AppQuery[] = [];
  const windowOpenedCallbacks: Array<(window: AppQuery) => void> = [];
  const allWindowsOpenedCallbacks: Array<() => void> = [];
  const erroredCallbacks: Array<(error: Error) => void> = [];
  let interval: NodeJS.Timeout | null = null;
  let timeout: NodeJS.Timeout | null = null;

  function add(window: AppQuery) {
    if(!interval) {
      start();
    }

    window.open();
    windowQueue.push(window);
  }

  function onWindowOpened(callback: (window: AppQuery) => void) {
    windowOpenedCallbacks.push(callback);
  }

  function onAllWindowsOpened(callback: () => void) {
    allWindowsOpenedCallbacks.push(callback);
  }

  function onError(callback: (error: Error) => void) {
    erroredCallbacks.push(callback);
  }

  function start() {
    if(interval) return;
    interval = setInterval(checkForNewWindows, intervalTime);
    timeout = setTimeout(stop, timeoutTime);

    async function checkForNewWindows() {
      const newWindows = await yabaiStateManager.refreshAllWindows();
      const newWindowsInQueue = newWindows.filter(window => {
        return windowQueue.some(windowQuery => windowMatchesQuery(window, windowQuery));
      });
      for(const window of newWindowsInQueue) {
        const windowIndex = windowQueue.findIndex(windowInQueue => windowInQueue.app === window.app);
        const windowQuery = windowQueue.splice(windowIndex, 1)[0];
        windowOpenedCallbacks.forEach(callback => callback(windowQuery));
      }

      if(windowQueue.length === 0) {
        allWindowsOpenedCallbacks.forEach(callback => callback());
        stop();
      }
    }
  }

  function stop() {
    if(interval) clearInterval(interval);
    if(timeout) clearTimeout(timeout);
    interval = null;
    timeout = null;
  }

  return {
    add,
    onWindowOpened,
    allWindowsOpenedCallbacks,
    onAllWindowsOpened,
    onError
  }
}

function windowMatchesQuery(window: YabaiWindow, query: AppQuery) {
  console.log(`Checking Window "${window.app}: ${window.title}"`)
  // App is required to match
  if(query.app !== window.app) {
    return false;
  }

  // if there is no title to query for, we can return true alread
  if(!query.title) {
    return true;
  }
  
  if(typeof query.title === 'function') {
    return query.title(window.title);
  }

  return query.title === window.title;
}

export {
  applyLayout,
}

export type {
  LayoutPlan,
  SpacePlan,
  AppQuery,
  Context
}
