// Menu: [d]isplay mode
// Description: Use yabai to switch the display mode, used when switching from a monitor to your laptop and vice versa
// Author: David Losert
import "@johnlindquist/kit";

const mode = await arg('Which Displaymode you want to select?', [
  {
    name: '[l]aptop',
    value: 'laptop'
  },
  {
    name: '[s]tack',
    value: 'stack'
  },
  {
    name: '[m]onitor',
    value: 'monitor'
  }
]);

// Make all windows full screen size on laptop display
if(mode === 'laptop') {
  await $`yabai -m config layout stack`;

  const allWindowsRaw = await $`yabai -m query --windows`;
  const allWindows = JSON.parse(allWindowsRaw.stdout);
  
  await Promise.all(allWindows.map((window) => {
    return $`yabai -m window ${window.id} --grid 1:1:0:0:0:0`;
  }));
}

if(mode === 'monitor') {
  await $`yabai -m config layout bsp`;
}
