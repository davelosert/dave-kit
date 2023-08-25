type YabaiWindow = {
  id: number;
  app: string;
  title: string;
  'has-focus': boolean;
}

type YabaiSpace = {
  index: number;
  label: string;
  type: 'bsp' | 'float' | 'stack';
  windows: number[];
  'first-window': number;
  'last-window': number;
  'has-focus': boolean;
  'is-visible': boolean;
  'is-fullscreen': boolean;
}

type YabaiDisplay = {
  index: number;
}

async function queryAllWindows(): Promise<YabaiWindow[]> {
  const allWindowsRaw = await $`yabai -m query --windows`;
  const allWindows = JSON.parse(allWindowsRaw.stdout);
  return allWindows;
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

async function moveWindowToSpaceIfExists(window: YabaiWindow, spaceIndex: number) {
  try {
    await $`yabai -m window ${window.id} --space ${spaceIndex}`;
  } catch (e) {
    console.warn(`Could not move window ${window.id} to space ${spaceIndex} due to error:`, e);
  }
}

async function moveWindowToDisplayIfExists(window: YabaiWindow, displayIndex: number) {
  try {
    await $`yabai -m window ${window.id} --display ${displayIndex}`;
  } catch (e) {
    console.warn(`Could not move window ${window} to display ${displayIndex} due to error:`, e);
  }
}

const yabai = {
  queryAllWindows,
  queryAllWindowsOnSpace,
  queryAllSpaces,
  queryAllDisplays,
  queryCurrentSpace,
  findApp,
  findFocusedWindow,
  moveWindowToSpaceIfExists,
  moveWindowToDisplayIfExists
};

export {
  yabai
};

export type {
  YabaiWindow
};
