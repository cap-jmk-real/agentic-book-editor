import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

const emojiPattern = /\p{Extended_Pictographic}/u;

async function walk(dir, files = []) {
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) await walk(path, files);
    else if (/\.(tsx?|css)$/.test(name.name)) files.push(path);
  }
  return files;
}

describe("no emoji in src", () => {
  it("grep src", async () => {
    const root = new URL("../src/", import.meta.url).pathname;
    const files = await walk(root);
    for (const file of files) {
      const text = await readFile(file, "utf8");
      assert.equal(emojiPattern.test(text), false, `emoji found in ${file}`);
    }
  });
});
