// Menu: [w]indow positions
// Description: Use yabai to switch the layout mode
// Author: David Losert
import "@johnlindquist/kit";
import { yabai } from '../lib/yabai';
import { applyLayout, AppQuery } from '../lib/yabaiArrangements';

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

const apps: Record<string, AppQuery> = {
    code: { app: 'Code' },
    chrome: { app: 'Google Chrome' },
    slack: { app: 'Slack' },
    outlook: { app: 'Microsoft Outlook' },
    teams: { app: 'Microsoft Teams' },
    signal: { app: 'Signal' },
    discord: { app: 'Discord' },
    spotify: { app: 'Spotify' },
    todoist: { app: 'Todoist' },
}

if(mode === 'work') {
  await applyLayout(
      { 
        spaces: [
          { spaceIndex: 1, layout: 'bsp', windows: [apps.code, apps.chrome, apps.slack]},
          { spaceIndex: 2, layout: 'bsp', windows: [apps.outlook, apps.teams, apps.signal, apps.discord]},
          { spaceIndex: -2, layout: 'bsp', windows: [apps.spotify] },
          { spaceIndex: -1, layout: 'float', windows: [apps.todoist] },
        ],
        nonePlannedWindows: async (windows, context) => {
          for(const window of windows) {
            await yabai.moveWindowToSpaceIfExists(window, context.spaces[2]);
          }
        },
      },
  )
}

if(mode === 'code') {
  await applyLayout(
      { 
        spaces: [
          { spaceIndex: 1, layout: 'bsp', windows: [apps.chrome, apps.code, apps.slack], sizes: [0.25, 0.5, 0.25]},
          { spaceIndex: 2, layout: 'bsp', windows: [apps.outlook, apps.teams, apps.signal, apps.discord]},
          { spaceIndex: -2, layout: 'bsp', windows: [apps.spotify] },
          { spaceIndex: -1, layout: 'float', windows: [apps.todoist] },
        ],
        nonePlannedWindows: async (windows, context) => {
          for(const window of windows) {
            await yabai.moveWindowToSpaceIfExists(window, context.spaces[2]);
          }
        },
      },
  )
}
