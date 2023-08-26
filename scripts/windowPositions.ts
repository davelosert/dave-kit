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

const findWindowAndMarkManaged = (query): YabaiWindow | null => {
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
  
  // First ensure all windows are splite vertically
  for(const window of existingWindows) {
    if(window['split-type'] !== 'vertical') {
      await yabai.toggleSplit(window); 
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
    await yabai.setInsert(previousWindow, 'east');
    await yabai.warpWindow(previousWindow, currentWindow);
  }
}

const spaces = await yabai.queryAllSpaces();
const  slack = findWindowAndMarkManaged({ app: 'Slack'}),
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
  await putWindowsVerticallyOnSpace([spotify], spaces.at(-2));
  // MOVE TODOIST TO LAST SPACE
  await putWindowsVerticallyOnSpace([todoist], spaces.at(-1));

  // Ensure all spaces are evenly balanced in the end
  await yabai.balanceSpace(spaces[0]);
  await yabai.balanceSpace(spaces[1]);
}
