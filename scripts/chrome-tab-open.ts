import "@johnlindquist/kit"
    
// Menu: [c] Open Chrome Tab
// Description: List all Chrome tabs. Then switch to that tab or copy with CMD + c
// Author: John Lindquist
// Twitter: @johnlindquist
let currentTabs  = [];

try {
  currentTabs = await getTabs()
} catch (e) {
  console.warn(`Warning: Couldn't load tabs due to error:`, e)
}

let bookmarks = await readFile(
  home(
    "Library/Application Support/Google/Chrome/Profile 1/Bookmarks"
  )
)

const parsedBookmarks = JSON.parse(bookmarks.toString())
const initialItems = parsedBookmarks.roots.bookmark_bar.children

const buildFolderItems = (prefixes, items): any[] => {
  let newItems = [];
  for(const bookmarkItem of items) {
    if(bookmarkItem.type === 'folder') {
      newItems = [...newItems, ...buildFolderItems([...prefixes, bookmarkItem.name], bookmarkItem.children)];
    } else {
      newItems.push({
        name: bookmarkItem.name,
        value: bookmarkItem.url,
        description: `${bookmarkItem.url}`,
      });
    }
  }
  
  return newItems;
}

let bookmarkChoices = buildFolderItems([], initialItems);

// let currentOpenChoices = currentTabs.map(
//   ({ url, title }) => {
//     return ({
//       name: url,
//       value: url,
//       description: title,
//       preview: url
//     });
//   }
// )

const bookmarksAndOpen = [
  ...bookmarkChoices,
  // ...currentOpenChoices,
]
const choices = _.uniqBy(bookmarksAndOpen, "name")

const flags = {
  open: {
    name: "Open",
    shortcut: "cmd+o",
  },
  copy: {
    name: "Copy",
    shortcut: "cmd+c",
  },
};

let url = await arg(
  { 
    placeholder: 'Select Chrome tab:',
    flags
  }, 
  choices
  )

if (flag?.copy) {
  copy(url)
} else {
  focusTab(url)
}
