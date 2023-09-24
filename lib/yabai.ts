type YabaiDirection = 'north' | 'east' | 'south' | 'west';
type YabaiLayout = 'bsp' | 'float' | 'stack';


type YabaiWindow = {
  id: number;
  pid: number;
  app: string;
  title: string;
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  role: string;
  subrole: string;
  display: number;
  space: number;
  level: number;
  opacity: number;
  'split-type': string;
  'split-child': string;
  'stack-index': number;
  'can-move': boolean;
  'can-resize': boolean;
  'has-focus': boolean;
  'has-shadow': boolean;
  'has-border': boolean;
  'has-parent-zoom': boolean;
  'has-fullscreen-zoom': boolean;
  'is-native-fullscreen': boolean;
  'is-visible': boolean;
  'is-minimized': boolean;
  'is-hidden': boolean;
  'is-floating': boolean;
  'is-sticky': boolean;
  'is-topmost': boolean;
  'is-grabbed': boolean;
};

type YabaiSpace = {
  id: number;
  uuid: string;
  index: number;
  label: string;
  type: string;
  display: number;
  windows: number[];
  'first-window': number;
  'last-window': number;
  'has-focus': boolean;
  'is-visible': boolean;
  'is-native-fullscreen': boolean;
};

type YabaiDisplay = {
  index: number;
}

const debug = true;
function logCommand(command: string) {
  if(debug) {
    log(command);
  }
}

async function balanceSpace(spaceIndex: YabaiSpace | number) {
  if(typeof spaceIndex !== 'number') {
    spaceIndex = spaceIndex.index;
  }
  
  try {
    logCommand(`yabai -m space ${spaceIndex} --balance`);
    await $`yabai -m space ${spaceIndex} --balance`;
  } catch (e) {
    console.warn(`Could not balance space ${spaceIndex} due to error:`, e);
  }
}

async function queryAllWindows(): Promise<YabaiWindow[]> {
  const allWindowsRaw = await $`yabai -m query --windows`;
  const allWindows = JSON.parse(allWindowsRaw.stdout);
  return allWindows;
}

async function queryWindow(window: YabaiWindow): Promise<YabaiWindow> {
  logCommand(`yabai -m query --windows --window ${window.id}`);
  const windowRaw = await $`yabai -m query --windows --window ${window.id}`;
  window = JSON.parse(windowRaw.stdout);
  return window;
}

async function queryWindowById(id: number): Promise<YabaiWindow> {
  logCommand(`yabai -m query --windows --window ${id}`);
  const windowRaw = await $`yabai -m query --windows --window ${id}`;
  const window = JSON.parse(windowRaw.stdout);
  return window;
}

async function queryAllWindowsOnSpace(spaceIndex: number): Promise<YabaiWindow[]> {
  const allWindowsRaw = await $`yabai -m query --windows --space ${spaceIndex}`;
  const allWindows = JSON.parse(allWindowsRaw.stdout);
  return allWindows;
}

async function queryAllSpaces(): Promise<YabaiSpace[]> {
  const allSpacesRaw = await $`yabai -m query --spaces`;
  const allSpaces = JSON.parse(allSpacesRaw.stdout);
  return allSpaces;
}

async function querySpace(spaceIndex: number): Promise<YabaiSpace> {
  const spaceRaw = await $`yabai -m query --spaces --space ${spaceIndex}`;
  const space = JSON.parse(spaceRaw.stdout);
  return space;
}

async function queryAllDisplays(): Promise<YabaiDisplay[]> {
  const allDisplaysRaw = await $`yabai -m query --displays`;
  const allDisplays = JSON.parse(allDisplaysRaw.stdout);
  return allDisplays;
};

async function queryCurrentSpace(): Promise<YabaiSpace> {
  const allSpaces = await queryAllSpaces();
  return allSpaces.find(({ 'has-focus': hasFocus }) => hasFocus);
}

async function findApp(appName: string, allWindows?: YabaiWindow[]): Promise<YabaiWindow> {
  const searchWindows = allWindows ?? await queryAllWindows();
  return searchWindows.find(({ app }) => (app === appName));
}

async function findFocusedWindow(allWindows?: YabaiWindow[]): Promise<YabaiWindow> {
  const searchWindows = allWindows ?? await queryAllWindows();
  return searchWindows.find(({ 'has-focus': hasFocus }) => hasFocus);
}

async function moveWindowToSpace(window: YabaiWindow, spaceIndex: number) {
  try {
    await $`yabai -m window ${window.id} --space ${spaceIndex}`;
  } catch (e) {
    console.warn(`Could not move window ${window.id} to space ${spaceIndex} due to error:`, e);
  }

}


async function moveWindowToSpaceIfExists(window: YabaiWindow, space: YabaiSpace) {
  if(space.windows.includes(window.id)) {
    logCommand(`Window [${window.app} - ${window.title}] already exists on space ${space.index}`)
    return;
  }

  try {
    logCommand(`Moving Window [${window.app} - ${window.title}] to space ${space.index}`)
    await $`yabai -m window ${window.id} --space ${space.index}`;
  } catch (e) {
    console.warn(`Could not move window ${window.id} to space ${space.index} due to error:`, e);
  }
}

async function setInsert(window: YabaiWindow, direction: YabaiDirection) {
  try {
    logCommand(`yabai -m window ${window.app} --insert ${direction}`)
    await $`yabai -m window ${window.id} --insert ${direction}`;
  } catch (e) {
    console.warn(`Could not insert window ${window.id} to direction ${direction} due to error:`, e);
  }
}

async function warpWindow(sourceWindow: YabaiWindow, targetWindow: YabaiWindow) {
  try {
    logCommand(`yabai -m window ${targetWindow.app} --warp ${sourceWindow.app}`);
    await $`yabai -m window ${targetWindow.id} --warp ${sourceWindow.id}`;
  } catch (e) {
    console.warn(`Could not warp window ${sourceWindow.id} to window ${targetWindow.id} due to error:`, e);
  }
}

async function moveWindowToDisplayIfExists(window: YabaiWindow, displayIndex: number) {
  try {
    logCommand(`yabai -m window ${window.app} --display ${displayIndex}`);
    await $`yabai -m window ${window.id} --display ${displayIndex}`;
  } catch (e) {
    console.warn(`Could not move window ${window} to display ${displayIndex} due to error:`, e);
  }
}

async function swapWindows(windowIndexA: number, windowIndexB: number) {
  try {
    logCommand(`yabai -m window ${windowIndexA} --swap ${windowIndexB}`);
    await $`yabai -m window ${windowIndexA} --swap ${windowIndexB}`;
  } catch (e) {
    console.warn(`Could not swap windows ${windowIndexA} and ${windowIndexB} due to error:`, e);
  }
}

async function toggleSplit(window: YabaiWindow) {
  try {
    logCommand(`yabai -m window ${window.app} with split ${window['split-type']} --toggle split`);
    await $`yabai -m window ${window.id} --toggle split`;
  } catch (e) {
    console.warn(`Could not toggle split for window ${window.id} due to error:`, e);
  }
}

async function ensureSpaceLayout(space: YabaiSpace, layout: 'bsp' | 'float' | 'stack') {
  if(space.type === layout) {
    logCommand(`Space ${space.index} already has layout ${layout}`);
    return;
  }

  try {
    logCommand(`yabai -m space ${space.index} --layout ${layout}`);
    await $`yabai -m space ${space.index} --layout ${layout}`;
  } catch (e) {
    console.warn(`Could not set layout ${layout} on space ${space.index} due to error:`, e);
  }
}

async function resizeWindow(window: YabaiWindow, resizeValue: string) {
  try {
    logCommand(`yabai -m window ${window.id} --resize ${resizeValue}`);
    await $`yabai -m window ${window.id} --resize ${resizeValue}`;
  } catch (e) {
    console.warn(`Could not resize window ${window.id} to direction ${resizeValue} due to error:`, e);
  }
}

const yabai = {
  balanceSpace,
  ensureSpaceLayout,
  queryAllWindows,
  queryWindow,
  queryWindowById,
  queryAllWindowsOnSpace,
  queryAllSpaces,
  queryAllDisplays,
  queryCurrentSpace,
  querySpace,
  findApp,
  findFocusedWindow,
  moveWindowToSpace,
  moveWindowToSpaceIfExists,
  moveWindowToDisplayIfExists,
  resizeWindow,
  setInsert,
  swapWindows,
  toggleSplit,
  warpWindow
};

export {
  yabai
};

export type {
  YabaiWindow,
  YabaiSpace
};
