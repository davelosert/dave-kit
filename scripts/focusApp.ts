// Menu: Yabai Focus App
// Description: Use yabai to search and focus a app given
// Author: David Losert
import "@johnlindquist/kit";
import { yabai } from "../lib/yabai";

const appName = await arg();
const allWindows = await yabai.getAllWindows();

const foundWindows = allWindows.filter(({ app }) => (app === appName));

const focusedWindowIndex = foundWindows
  .sort((a, b) => a.id - b.id)
  .findIndex(window => window['has-focus']);

const nextIndex = (focusedWindowIndex + 1) % foundWindows.length;

await $`yabai -m window ${foundWindows[nextIndex].id} --focus`;
