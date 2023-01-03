type YabaiWindow = {
  id: number;
  app: string;
  title: string;
  'has-focus': boolean;
}

async function getAllWindows(): Promise<YabaiWindow[]> {
  const allWindowsRaw = await $`yabai -m query --windows`;
  const allWindows = JSON.parse(allWindowsRaw.stdout);
  return allWindows;
}

const yabai = {
  getAllWindows,
};

export {
  yabai
};

export type {
  YabaiWindow
};
