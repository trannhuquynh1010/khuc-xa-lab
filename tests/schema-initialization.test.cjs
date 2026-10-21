/* eslint-disable @typescript-eslint/no-require-imports -- Compile server modules without a live database. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

test("lens questions sync after table creation on a fresh DB and still refresh on a ready DB", async () => {
  const root = path.resolve(__dirname, "..");
  const originalLoad = Module._load;
  const originalTs = require.extensions[".ts"];
  const originalUrl = process.env.DATABASE_URL;
  let sql;
  try {
    process.env.DATABASE_URL = "postgresql://test.invalid/test";
    Module._load = function(request, parent, main) {
      if (request === "server-only") return {};
      if (request === "@neondatabase/serverless") return { neon: () => sql };
      if (request === "next/cache") return { unstable_cache: fn => fn, revalidateTag() {} };
      if (request.startsWith("@/")) request = path.join(root, request.slice(2));
      return originalLoad.call(this, request, parent, main);
    };
    require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, filename);

    for (const ready of [false, true]) {
      let created = ready;
      let seeded = 0;
      let creates = 0;
      sql = async (strings, ...values) => {
        const query = strings.join("?");
        if (query.includes("AS present")) return [{ present: ready }];
        if (query.includes("AS ready")) {
          assert.ok(created, "readiness must not reference missing tables");
          return [{ ready }];
        }
        if (query.includes("CREATE TABLE IF NOT EXISTS")) creates++;
        if (query.includes("CREATE TABLE IF NOT EXISTS prism_live_questions")) created = true;
        if (query.includes("INSERT INTO prism_live_questions") && values.some(v => typeof v === "string" && /^lens-live-\d+$/.test(v))) {
          assert.ok(created, "lens seeding must follow table creation");
          seeded++;
        }
        return [];
      };
      delete require.cache[require.resolve("../lib/db.ts")];
      await require("../lib/db.ts").ensureSchema();
      assert.equal(seeded, 10, "both paths must sync the complete lens bank");
      assert.equal(creates > 0, !ready, "ready databases should skip migrations");
    }
  } finally {
    Module._load = originalLoad;
    if (originalTs) require.extensions[".ts"] = originalTs;
    else delete require.extensions[".ts"];
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    delete require.cache[require.resolve("../lib/db.ts")];
  }
});
