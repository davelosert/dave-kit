// Menu: [f]ind files or folders
// Description: Search and open files or folders.
// Author: David Losert
// Shortcut: shift option f

import "@johnlindquist/kit";

const Fuse = await npm("fuse.js");
const { getSVGStringFromFileType, getIconForFile, getIconForFolder } = await npm("@wesbos/code-icons");

const data = await db({ quickAccessPaths: [] });
const quickAccessPaths: string[] = data.quickAccessPaths;
 
let flags = {
  open: {
    name: "Open",
    shortcut: "cmd+o",
  },
  finder: {
    name: "Reveal in Finder",
    shortcut: "cmd+f",
  },
  terminal: {
    name: "Reveal in Terminal",
    shortcut: "cmd+t",
  },
  add: {
    name: "Add to Quick Access",
    shortcut: "cmd+a",
  },
}

function filterQuickAccessPaths (input: string) {
  if(!input || input.length === 0) return quickAccessPaths;

  const fuse = new Fuse(quickAccessPaths, { distance: 1000 });
  return fuse.search(input).map(result => result.item);
}

async function generateHtmlFor(path: string): Promise<string> {
  const pathArray = path.split("/");
  const fileName = pathArray.at(-1)
  const previousFolders = pathArray.slice(0, -1);

  const isFolder = await isDir(path);
  const iconSvg = isFolder ? getIconForFolder(fileName) : getIconForFile(fileName);

  return `
        <div>
          <div style="position:absolute; width:40px; height:40px; margin-top: 5px;">${getSVGStringFromFileType(iconSvg).svg}</div>
          <div style="margin-left: 50px">
            <span style="color: #999; font-size: 12px;">${previousFolders.join('/')}/</span>
            </br>
            <span>${fileName}<span>
          <div>
        </div>
       `
};

async function searchFiles(input: string): Promise<string[]> {
    const foundFiles = await fileSearch(`${input}`);
    // only return 10 results - currently not interested in more
    return foundFiles.slice(0, 10);
}

const selectedPath = await arg({
  flags,
  choices: async (input) => {
    const quickAccessPaths = filterQuickAccessPaths(input);
    const foundPaths = input?.length < 3 ? [] : await searchFiles(input);

    const allPaths: string[] = [
      ...quickAccessPaths,
      ...foundPaths
    ]
    
    const finalPaths = [];
    for await(const path of allPaths) {
      const html = await generateHtmlFor(path);
      finalPaths.push({
        value: path,
        html
      });
    }

    return finalPaths;
  },
});

if(flag?.finder) {
  $`open -R ${selectedPath}`;
} else if(flag?.terminal) {
  term(`cd ${selectedPath}`);
} else if(flag?.add){
  data.quickAccessPaths.push(selectedPath);
  await data.write();
} else {
  $`open ${selectedPath}`;
}
