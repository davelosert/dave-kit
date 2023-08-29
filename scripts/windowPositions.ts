// Menu: [w]indow positions
// Description: Use yabai to switch the layout mode
// Author: David Losert
import "@johnlindquist/kit";
import { yabai, YabaiWindow, YabaiSpace } from '../lib/yabai';


const mode = await arg('Select Window Definition Scheme', [
  {
    name: '[w]ork',
    value: 'work'
  },
  {
    name: '[c]ode',
    value: 'code'
  },
  {
    name: '[d]emo',
    value: 'demo'
  }
]);

const remainingWindows = await yabai.queryAllWindows();

function findWindowAndMarkManaged (query): YabaiWindow | null {
  const windowIndex = remainingWindows.findIndex(window => {
    let appMatch = query.app ? false : true;
    let titleMatch = query.title ? false : true;

    if(query.app && query.app === window.app) appMatch = true;
    if(query.title && query.title === window.title) titleMatch = true;
    
    return appMatch && titleMatch;
  });
  
  if(windowIndex === -1) return null;

  return remainingWindows.splice(windowIndex, 1)[0];
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

  for(let [index, window] of windows.entries()) {
    if(index === windows.length - 1) {
      // The last window should take up the rest of the space
      break;
    }

    if(index !== 0) {
      // Refetch the current window to get the most recent width after altering the first window
      window = await yabai.queryWindow(window);
    }

    const ratio = ratios.shift();
    const targetWidth = (totalWidth * ratio) - window.frame.w;
    await yabai.resizeWindow(window, `right:${targetWidth}:0`);
  }

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
    await wait(1000);
    await yabai.warpWindow(previousWindow, currentWindow);
  }
}

const spaces = await yabai.queryAllSpaces();
const slack = findWindowAndMarkManaged({ app: 'Slack'}),
  chrome = findWindowAndMarkManaged({ app: 'Google Chrome'}),
  code = findWindowAndMarkManaged({ app: 'Code'}),
  outlook = findWindowAndMarkManaged({ app: 'Microsoft Outlook'}),
  teams = findWindowAndMarkManaged({ app: 'Microsoft Teams'}),
  signal = findWindowAndMarkManaged({ app: 'Signal'}),
  discord = findWindowAndMarkManaged({ app: 'Discord'}),
  spotify = findWindowAndMarkManaged({ app: 'Spotify'}),
  todoist = findWindowAndMarkManaged({ app: 'Todoist'});


if(mode === 'work') {
  // First move all not explicitly mentioned windows to space 3
  for(const window of remainingWindows) {
    await yabai.moveWindowToSpaceIfExists(window, spaces[2]);
  }

  // SPACE 1
  await yabai.ensureSpaceLayout(spaces[0], 'bsp')
  await putWindowsVerticallyOnSpace([code, chrome, slack], spaces[0]);

  // SPACE 2
  await yabai.ensureSpaceLayout(spaces[1], 'bsp')
  await putWindowsVerticallyOnSpace([outlook, teams, signal, discord], spaces[1]);
  
  // MOVE SPOTIOFY TO SECOND LAST SPACE
  await putWindowsVerticallyOnSpace([spotify], spaces.at(-2));
  // MOVE TODOIST TO LAST SPACE
  await putWindowsVerticallyOnSpace([todoist], spaces.at(-1));

  // Ensure all spaces are evenly balanced in the end
  await yabai.balanceSpace(spaces[0]);
  await yabai.balanceSpace(spaces[1]);
}

if(mode === 'code') {
  // First move all not explicitly mentioned windows to space 3
  for(const window of remainingWindows) {
    await yabai.moveWindowToSpaceIfExists(window, spaces[2]);
  }

  // SPACE 1
  await yabai.ensureSpaceLayout(spaces[0], 'bsp')
  await putWindowsVerticallyOnSpace([chrome, code, slack], spaces[0]);

  // SPACE 2
  await yabai.ensureSpaceLayout(spaces[1], 'bsp')
  await putWindowsVerticallyOnSpace([outlook, teams, signal, discord], spaces[1]);
  
  // MOVE SPOTIOFY TO SECOND LAST SPACE
  await yabai.ensureSpaceLayout(spaces.at(-2), 'bsp')
  await putWindowsVerticallyOnSpace([spotify], spaces.at(-2));
  // MOVE TODOIST TO LAST SPACE
  await putWindowsVerticallyOnSpace([todoist], spaces.at(-1));

  // Ensure all spaces are evenly balanced in the end
  await applySizeRatioToWindows([chrome, code, slack], [0.2, 0.6, 0.2]);
  await yabai.balanceSpace(spaces[1]);
}
