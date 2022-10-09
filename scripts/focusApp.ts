// Menu: Yabai Focus App
// Description: Use yabai to search and focus a app given
// Author: David Losert
import "@johnlindquist/kit";

const appName = await arg();
console.log(`App name: ${appName}`);

const allWindowsRaw = await $`yabai -m query --windows`;
const allWindows = JSON.parse(allWindowsRaw.stdout);

const foundWindows = allWindows.filter(({ app }) => (app === appName));

const focusedWindowIndex = foundWindows
  .sort((a, b) => a.id - b.id)
  .findIndex(window => window['has-focus']);

const nextIndex = (focusedWindowIndex + 1) % foundWindows.length;

await $`yabai -m window ${foundWindows[nextIndex].id} --focus`;
