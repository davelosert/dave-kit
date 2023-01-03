// Menu: Set Recording Size
// Description: Use yabai to set a good size for all windows on the current space to start a video recording or screen sharing
// Author: David Losert
import "@johnlindquist/kit";
import { yabai } from '../lib/yabai';

// First make sure all windows are in floating mode
await $`yabai -m space --layout float`;

const allWindows = await yabai.queryAllWindows();

// 2560×1440
for(const window of allWindows) {
  await $`yabai -m window ${window.id} --grid 4:4:1:0:2:4`
  await $`yabai -m window ${window.id} --resize abs:2560:1440`
}
