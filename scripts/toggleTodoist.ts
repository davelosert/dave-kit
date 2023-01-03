// Menu: [T]oggle Todoist
// Description: Get an overview of all open windows
// Author: David Losert
// Shortcut: shift option t

import "@johnlindquist/kit"
import { yabai } from '../lib/yabai';

const allWindows = await yabai.queryAllWindows();
const todoistWindow = await yabai.findApp('Todoist', allWindows);
const focusedWindow = await yabai.findFocusedWindow(allWindows);

const allDisplays = await yabai.queryAllDisplays();
const allSpaces = await yabai.queryAllSpaces();

const data = await db({ previousWindowId: undefined });


// If Todoist is the currently focused window, move it away and restore focus to the previous window
if(focusedWindow.id === todoistWindow.id) {
  // Get space with maximum index
  const lastSpaceIndex = allSpaces.reduce((max, space) => Math.max(max, space.index), 0);

  await $`yabai -m window ${todoistWindow.id} --space ${lastSpaceIndex}`
  // await $`yabai -m window ${todoistWindow.id} --grid 1:1:1:1:1:1`
  await $`yabai -m window ${data.previousWindowId} --focus`;
} else {
  data.previousWindowId = focusedWindow.id;
  await data.write();
  const targetGrid = allDisplays.length > 1 ? '3:3:1:0:1:4' : '1:1:1:1:1:1';
  
  const focusedSpace = allSpaces.find(space => space['has-focus']);
  
  await $`yabai -m window ${todoistWindow.id} --space ${focusedSpace.index}`
  await $`yabai -m window ${todoistWindow.id} --focus`;
  await $`yabai -m window ${todoistWindow.id} --grid ${targetGrid}`
}
