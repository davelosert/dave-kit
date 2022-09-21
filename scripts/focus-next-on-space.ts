// Menu: Focus next on space
// Description: Use yabai to focus the next window on the current space
// Author: David Losert
// Shortcut: shift option n
import "@johnlindquist/kit";

const allWindowsRaw = await $`yabai -m query --windows --space`;
const allWindows: any[] = JSON.parse(allWindowsRaw.stdout);

const relevantWindows = allWindows
  .filter(window => !['Microsoft Teams Notification', 'Rewatch'].includes(window.title));

const focusedWindowIndex = relevantWindows
  .sort((a, b) => a.id - b.id)
  .findIndex(window => window['has-focus']);

const nextIndex = (focusedWindowIndex + 1) % relevantWindows.length;

await $`yabai -m window ${relevantWindows[nextIndex].id} --focus`;
