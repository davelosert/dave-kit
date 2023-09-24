import { YabaiSpace, YabaiWindow, yabai } from './yabai';


function createYabaiStateManager() {
  const cachedWindows: Array<YabaiWindow> = [];
  const cachedSpaces: Array<YabaiSpace> = [];
  
  const updateWindow = (updatedWindow: YabaiWindow) => {
    const cachedWindow = cachedWindows.find(w => w.id === updatedWindow.id);

    if(!cachedWindow) {
      cachedWindows.push(updatedWindow);
      return;
    }

    Object.assign(cachedWindow, updatedWindow);
  }
  
  const updateSpace = (updatedSpace: YabaiSpace) => {
    const cachedSpace = cachedSpaces.find(s => s.id === updatedSpace.id);

    if(!cachedSpace) {
      cachedSpaces.push(updatedSpace);
      return;
    }

    Object.assign(cachedSpace, updatedSpace);
  }

  return {
    refreshAllWindows: async () => {
      const allWindows = await yabai.queryAllWindows();
      allWindows.forEach(updateWindow);
      // Remove windows that are no longer present
      cachedWindows.filter(w => !allWindows.includes(w)).forEach(w => {
        const index = cachedWindows.indexOf(w);
        cachedWindows.splice(index, 1);
      });
      return cachedWindows;
    },
    refreshAllSpaces: async () => {
      const allSpaces = await yabai.queryAllSpaces();
      allSpaces.forEach(updateSpace);
      // Remove spaces that are no longer present
      cachedSpaces.filter(s => !allSpaces.includes(s)).forEach(s => {
        const index = cachedSpaces.indexOf(s);
        cachedSpaces.splice(index, 1);
      });
      return cachedSpaces;
    },
    refreshWindow: async (currentWindow: YabaiWindow): Promise<YabaiWindow> => {
      const updatedWindow = await yabai.queryWindow(currentWindow);
      updateWindow(updatedWindow);
      return updatedWindow;
    },
    refreshSpace: async (currentSpace: YabaiSpace): Promise<YabaiSpace> => {
      const updatedSpace = await yabai.querySpace(currentSpace.index);
      updateSpace(updatedSpace);
      return updatedSpace;
    },
  }
}

export {
  createYabaiStateManager,
}
