import { yabai, YabaiWindow, YabaiSpace } from './yabai'

type Context = {
  spaces: YabaiSpace[],
}

type AppQuery = {
  app: string,
  title?: string | ((title: string) => boolean),
  open?: () => Promise<void>,
}

type SpacePlan = {
  spaceIndex: number,
  layout: 'bsp' | 'float' | 'stack',
  windows: AppQuery[],
  sizes?: number[],
};

type HydratedSpacePlan = SpacePlan & {
  windows: YabaiWindow[],
  space: YabaiSpace,
}

type LayoutPlan = {
  spaces: Array<SpacePlan>,
  unmanagedWindows?: (windows: YabaiWindow[], context: Context) => Promise<void>
}


function getSpaceByIndex(spaces: YabaiSpace[], spaceIndex: number) {
  if(spaceIndex > 0) {
    return spaces[spaceIndex - 1];
  }
  
  // Negative space indexes can be taken as they are
  return spaces.at(spaceIndex);
}

async function applyLayout(layout: LayoutPlan) {
  const remainingWindows = await yabai.queryAllWindows();
  const spaces = await yabai.queryAllSpaces();

  const hydratedSpaces: Array<HydratedSpacePlan> = layout.spaces.map(spacePlan => {
    const windows = spacePlan.windows.map(query => findWindowAndMarkManaged(query));
    return { 
      ...spacePlan, 
      windows, 
      space: getSpaceByIndex(spaces, spacePlan.spaceIndex)
    };
  });

  if(layout.unmanagedWindows) {
    await layout.unmanagedWindows(remainingWindows, { spaces });
  }

  for(const spacePlan of hydratedSpaces) {
    await yabai.ensureSpaceLayout(spacePlan.space, spacePlan.layout);
    await putWindowsVerticallyOnSpace(spacePlan.windows, spacePlan.space);

    if(spacePlan.sizes) {
      await applySizeRatioToWindows(spacePlan.windows, spacePlan.sizes);
    } else {
      await yabai.balanceSpace(spacePlan.space);
    }
  }

  function findWindowAndMarkManaged (query: AppQuery): YabaiWindow | null {
    const windowIndex = remainingWindows.findIndex(window => {
      let appMatch = false;
      let titleMatch = query.title ? false : true;

      if(query.app === window.app) appMatch = true;
      if(query.title && query.title === window.title) titleMatch = true;
      
      return appMatch && titleMatch;
    });
    
    if(windowIndex === -1) return null;

    return remainingWindows.splice(windowIndex, 1)[0];
  }

  async function putWindowsVerticallyOnSpace(windows: YabaiWindow[], space: YabaiSpace) {
    const existingWindows = windows.filter(window => Boolean(window));
    const isFirstWindowOnSpace = space.windows.includes(existingWindows[0].id);
    
    if(!isFirstWindowOnSpace) {
      await yabai.moveWindowToSpaceIfExists(windows[0], space);
      // Overwrite the space information to get the most recent information
      space = await yabai.querySpace(space.index);
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
        window = await yabai.queryWindow(window);
      }

      if(window['split-type'] !== 'vertical') {
        console.log(`Splitting ${window.app} vertically`);
        await yabai.toggleSplit(window); 
        splitToggled = true;
      }
    }
    
    // Sort the windows by their x position
    const sortedWindows = existingWindows.sort((a, b) => a.frame.x - b.frame.x);
    
    // Only continue if the windows are not in the correct order already
    const cont = sortedWindows.some((window, index) => window.id !== existingWindows[index].id);
    if(!cont) return;

    for(let i = 1; i < existingWindows.length; i++) {
      const previousWindow = existingWindows[i-1];
      const currentWindow = existingWindows[i];
      console.log(`Moving ${currentWindow.app} to the right of ${previousWindow.app}`);
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
    windows.reverse();
    ratios.reverse();
    
    for(let [index, window] of windows.entries()) {
      if(index === windows.length - 1) {
        // The last window should take up the rest of the space
        break;
      }

      if(index !== 0) {
        // Refetch the current window to get the most recent width after altering the first window
        window = await yabai.queryWindow(window);
      }

      const ratio = ratios[index];
      // This is indeed right, as resizing left needs a negative number to grow the window
      const targetWidth = window.frame.w - (totalWidth * ratio);
      console.log(`Resizing ${window.app} with width ${window.frame.w} by ${targetWidth}`);
      await yabai.resizeWindow(window, `left:${targetWidth}:0`);
    }
  }
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
