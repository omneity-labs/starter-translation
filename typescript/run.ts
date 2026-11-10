import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { translate, LANGUAGES, type TranslationRequest } from "./tarjamli.js";
const cases: {id:string; group:string; request:TranslationRequest}[] = JSON.parse(readFileSync(new URL("../examples/cases.json", import.meta.url), "utf8"));
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    saved: { type: "boolean" }, languages: { type: "boolean" },
    text: { type: "string" }, source: { type: "string" }, target: { type: "string" },
    instructions: { type: "string" },
  },
});
if (values.languages) { console.log(JSON.stringify(LANGUAGES, null, 2)); process.exit(0); }
if (values.text !== undefined) {
  if (positionals.length || values.saved) throw new Error("Use either custom input or an example ID, not both");
  if (!values.source || !values.target) throw new Error("--text requires --source and --target");
  const result = await translate(values.text, values.source, values.target, values.instructions);
  console.log(result.data.translated);
  process.exit(0);
}
if (values.source || values.target || values.instructions) throw new Error("--source, --target and --instructions require --text");
if (positionals.length > 1) throw new Error("Supply one example ID");
const saved = values.saved;
const id = positionals[0];
if (!id) { for (const c of cases) console.log(`${c.id} · ${c.group}`); }
else {
  const c = cases.find(c => c.id === id);
  if (!c) throw new Error("Unknown case. Run without an ID to list examples.");
  if (saved) {
    const rows: {id:string; captured_at?:string; request:TranslationRequest; response:unknown}[] = JSON.parse(readFileSync(new URL("../fixtures/reviewed-examples.json", import.meta.url), "utf8"));
    const row = rows.find(r => r.id === id);
    if (!row) throw new Error("Saved response missing for this example.");
    console.log(JSON.stringify({source:"saved API response", captured_at:row.captured_at, request:row.request, response:row.response}, null, 2));
    process.exit(0);
  }
  const p = c.request;
  console.log(JSON.stringify({ request: p, response: await translate(p.text, p.source, p.target, p.instructions) }, null, 2));
}
