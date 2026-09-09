import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { zip } from "zip-a-folder";

const requireCli = createRequire(resolve("node_modules/@mintlify/cli/bin/init.js"));
const decompress: (input: string | Buffer, output: string) => Promise<unknown> =
  requireCli("adm-zip").default;

describe("Mintlify archive security", (): void => {
  it.each(["regular", "file symlink", "directory symlink"])(
    "preserves archive contents and confines writes with %s destinations",
    async (destination): Promise<void> => {
      expect.assertions(destination === "regular" ? 3 : 2);
      const root = mkdtempSync(join(tmpdir(), "xquik-archive-"));
      try {
        const source = join(root, "source");
        const output = join(root, "output");
        const outside = join(root, "outside");
        for (const directory of [source, output, outside]) mkdirSync(directory);
        mkdirSync(join(source, "nested"));
        writeFileSync(join(source, "nested", "payload.txt"), "archive payload");
        writeFileSync(join(source, ".metadata"), "hidden content");
        writeFileSync(join(outside, "payload.txt"), "outside sentinel");
        const archive = join(root, "archive.zip");
        await zip(source, archive);
        if (destination === "directory symlink") symlinkSync(outside, join(output, "nested"));
        if (destination === "file symlink") {
          mkdirSync(join(output, "nested"));
          symlinkSync(join(outside, "payload.txt"), join(output, "nested", "payload.txt"));
        }
        if (destination === "regular") {
          await decompress(archive, output);
          expect(readFileSync(join(output, "nested", "payload.txt"), "utf8")).toBe(
            "archive payload",
          );
          expect(readFileSync(join(output, ".metadata"), "utf8")).toBe("hidden content");
        } else {
          await expect(decompress(archive, output)).rejects.toThrow(/Refusing/u);
        }
        expect(readFileSync(join(outside, "payload.txt"), "utf8")).toBe("outside sentinel");
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
});

it.each(["../outside.txt", "nested/../../outside.txt"])(
  "rejects archive traversal through %s",
  async (entry): Promise<void> => {
    expect.assertions(2);
    const root = mkdtempSync(join(tmpdir(), "xquik-archive-traversal-"));
    try {
      writeFileSync(join(root, "outside.txt"), "outside sentinel");
      const archive = Buffer.from(zipSync({ [entry]: strToU8("archive payload") }));
      await expect(decompress(archive, join(root, "output"))).rejects.toThrow();
      expect(readFileSync(join(root, "outside.txt"), "utf8")).toBe("outside sentinel");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
