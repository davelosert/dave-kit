// Menu: [t]ranslate
// Description: Translate selected text into with Google Translate.
// Author: Brandon Pittman
import "@johnlindquist/kit";

const text = await arg('What do you want to translate?');

const origin = "https://translate.google.com";
const sl = "en";
const tl = "de";
const op = "translate";

const url = encodeURI(`${origin}/?sl=${sl}&tl=${tl}&text=${text}&op=${op}`);

exec(`open "${url}"`);
