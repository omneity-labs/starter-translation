import test from "node:test";
import assert from "node:assert/strict";
import { translate, makeRequest } from "../typescript/tarjamli.js";
const fixture = (change: Record<string, unknown> = {}) => ({data:{translated:"Bonjour",complete:true,source:"eng_Latn",target:"fra_Latn",model:"tarjamli-mini-v4",...change}});
test("request carries instructions, UTF-8 text and authorization only in headers", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url,"https://api.sawalni.com/v1/language/translate");
      const headers = init?.headers as Record<string,string>;
      assert.equal(headers.Authorization,"Bearer test-only");
      const payload = JSON.parse(init?.body as string);
      assert.equal(payload.text,"واش؟"); assert.equal(payload.instructions,"Use vous.");
      assert.ok(!(init?.body as string).includes("test-only"));
      return new Response(JSON.stringify(fixture()), {status:200});
    };
    assert.equal((await translate("واش؟","eng_Latn","fra_Latn","Use vous.","test-only")).data.complete,true);
  } finally { globalThis.fetch = original; }
});
test("reject incomplete or mismatched translations and do not retry HTTP failures", async () => {
  const original = globalThis.fetch;
  try {
    for (const change of [{complete:false},{target:"deu_Latn"},{model:"other"},{translated:""}]) {
      globalThis.fetch = async () => new Response(JSON.stringify(fixture(change)), {status:200});
      await assert.rejects(translate("hello","eng_Latn","fra_Latn","","test-only"));
    }
    let count = 0;
    globalThis.fetch = async () => { count++; return new Response("busy",{status:429}); };
    await assert.rejects(translate("hello","eng_Latn","fra_Latn","","test-only"),/HTTP 429/);
    assert.equal(count,1);
  } finally { globalThis.fetch = original; }
});
test("enforce byte bounds and explicit supported codes", () => {
  assert.throws(()=>makeRequest("x","auto","fra_Latn"));
  assert.throws(()=>makeRequest("é".repeat(131073),"eng_Latn","fra_Latn"));
  assert.throws(()=>makeRequest("x","eng_Latn","fra_Latn","é".repeat(16385)));
});
