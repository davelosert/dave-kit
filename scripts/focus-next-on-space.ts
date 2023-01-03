// Menu: Focus next on space
// Description: Use yabai to focus the next window on the current space
// Author: David Losert
// Shortcut: shift option n
import "@johnlindquist/kit";
import { yabai } from '../lib/yabai';

const allWindows = await yabai.getAllWindows();

const relevantWindows = allWindows
  // Microsoft Teams notifications and Rewatch are invisible, no sense in cycling through them
  .filter(window => !['Microsoft Teams Notification', 'Rewatch'].includes(window.title))
  // OBS is just for streaming, and I don't want to cycle through it while streaming, so it is ignored as well.
  .filter(window => !['OBS Studio'].includes(window.app));

const focusedWindowIndex = relevantWindows
  .sort((a, b) => a.id - b.id)
  .findIndex(window => window['has-focus']);

const nextIndex = (focusedWindowIndex + 1) % relevantWindows.length;

await $`yabai -m window ${relevantWindows[nextIndex].id} --focus`;
