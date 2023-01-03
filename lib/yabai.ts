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

async function findApp(appName: string, allWindows?: YabaiWindow[]): Promise<YabaiWindow> {
  const searchWindows = allWindows ?? await queryAllWindows();
  return searchWindows.find(({ app }) => (app === appName));
}

async function findFocusedWindow(allWindows?: YabaiWindow[]): Promise<YabaiWindow> {
  const searchWindows = allWindows ?? await queryAllWindows();
  return searchWindows.find(({ 'has-focus': hasFocus }) => hasFocus);
}

const yabai = {
  queryAllWindows,
  queryAllSpaces,
  queryAllDisplays,
  findApp,
  findFocusedWindow,
};

export {
  yabai
};

export type {
  YabaiWindow
};
