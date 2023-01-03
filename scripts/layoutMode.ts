// Menu: [l]ayout mode
// Description: Use yabai to switch the layout mode
// Author: David Losert
import "@johnlindquist/kit";
import { yabai, YabaiWindow } from '../lib/yabai';
const mode = await arg('Which Layoutmode you want to select?', [
  {
    name: '[w]ork',
    value: 'work'
  },
  {
    name: '[d]emo',
    value: 'demo'
  }
]);

const findWindow = (allWindows: YabaiWindow[], query) => {
  return allWindows.find(window => {
    let appMatch = query.app ? false : true;
    let titleMatch = query.title ? false : true;

    if(query.app && query.app === window.app) appMatch = true;
    if(query.title && query.title === window.title) titleMatch = true;
    
    return appMatch && titleMatch;
  });
}

const allWindows = await yabai.queryAllWindows(); 

const slack = findWindow(allWindows, { app: 'Slack '});
const chrome = findWindow(allWindows, { app: 'Google Chrome'});
const code = findWindow(allWindows, { app: 'Code'});
const iTerm = findWindow(allWindows, { app: 'iTerm2'});
const outlook = findWindow(allWindows, { app: 'Microsoft Outlook'});
const teams = findWindow(allWindows, { app: 'Microsoft Teams'});
const signal = findWindow(allWindows, { app: 'Signal'});


if(mode === 'work') {
  await $`yabai -m window ${slack.id} --space 1`;
  await $`yabai -m window ${chrome.id} --space 1`;
  await $`yabai -m window ${code.id} --space 1`;

  // Move the terminal to the laptop screen
  await $`yabai -m window ${iTerm.id} --display 2`;

  await $`yabai -m window ${outlook.id} --space 2`;
  await $`yabai -m window ${teams.id} --space 2`;
  await $`yabai -m window ${signal.id} --space 2`;
}

if(mode === 'demo') {
  await $`yabai -m window ${chrome.id} --space 1`;
  await $`yabai -m window ${code.id} --space 1`;

  // Move the terminal to the laptop screen
  await $`yabai -m window ${slack.id} --display 2`;
  await $`yabai -m window ${outlook.id} --space 2`;

  await $`yabai -m window ${teams.id} --space 2`;
  await $`yabai -m window ${signal.id} --space 2`;
  await $`yabai -m window ${iTerm.id} --space 1`;
}
