// Menu: [s]pace control
// Description: Get an overview of all open windows
// Author: David Losert
// Shortcut: shift option s

import "@johnlindquist/kit"

const allWindowsRaw = await $`yabai -m query --windows`;
const allWindows = JSON.parse(allWindowsRaw.stdout);

const windowList = allWindows
  .map(window => {
    return {
      name: `${window.app} - ${window.title}`,
      value: window.id
    }
  }).sort((a, b) => a.name.localeCompare(b.name));

const w = await widget(`
  <div>
    <h1>Which window to focus?</h1>
    <ol>
      ${windowList.map(window => `<li>${window.name}</li>`).join('')}
    </ol>
    <input autofocus type="text" class="bg-transparent focus:border-none active:border-none"/>
  </div>
  `,
{
  center: true,
  width: 800,
  height: 800,
});

w.onInput((event) => {
  const selection = event.value;
  const foundWindow = windowList[Number(selection) - 1];
  console.log(`Selection: ${selection}`);
  if(foundWindow) {
    $`yabai -m window ${foundWindow.value} --focus`;
    w.close();
  }
});
