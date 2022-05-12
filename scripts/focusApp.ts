// Menu: [f]ocus app
// Description: Use yabai to search and focus a running app
// Author: David Losert
// Shortcut: shift option f
import "@johnlindquist/kit";

const allWindowsRaw = await $`yabai -m query --windows`;
const allWindows = JSON.parse(allWindowsRaw.stdout);

const selectedWindow = await arg('Select Window to open', allWindows.map(({ id, app, title }) => ({
  name: `${app} - ${title}`,
  value: id,
})));

await $`yabai -m window --focus ${selectedWindow}`;
