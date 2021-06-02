import { emptyDir } from "https://deno.land/std@0.95.0/fs/mod.ts";
import { Language, minify } from "https://deno.land/x/minifier/mod.ts";

// clear docs folder or create it if it doesnt exist
emptyDir("./docs");

// TODO it may be possible to directly minify uint8array (which is returned by the run)... minify also has a cli so we could propably do all this in .sh
// minify html and css into docs
const html = await Deno.readTextFile("./src/index.html");
await minifyAndMoveFile("./docs/index.html", "HTML", html);
const css = await Deno.readTextFile("./src/styles.css");
await minifyAndMoveFile("./docs/styles.css", "CSS", css);
// create bundle, minify it and mv it into docs
const js = new TextDecoder().decode(await Deno.run({
    cmd: ["deno", "bundle", "./src/main.js"],
    stdout: "piped"
}).output());
await minifyAndMoveFile("./docs/main.js", "JS", js);

function minifyAndMoveFile(target, language, source) {
    return Deno.writeTextFile(target, minify(Language[language], source));
}