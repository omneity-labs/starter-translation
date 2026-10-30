import { Sawalni } from "./client.ts";
const [source, target, ...words] = process.argv.slice(2);
if (!source || !target || !words.length)
  throw new Error("Usage: npm start -- eng_Latn ary_Arab Hello");
const { data } = await new Sawalni().json("language/translate", {
  model: "tarjamli-mini-v4",
  source,
  target,
  text: words.join(" "),
});
if (data.complete === false)
  throw new Error("Translation was incomplete; shorten the input");
console.log(data.translated);
