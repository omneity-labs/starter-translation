import argparse
import json
from pathlib import Path
from tarjamli import Tarjamli
LANGUAGES = Tarjamli.languages()
client = Tarjamli()

parser = argparse.ArgumentParser(description="Run an actual Tarjamli example. Each request can incur API charges.")
parser.add_argument("case", nargs="?", help="Example ID; omit to list")
parser.add_argument("--saved", action="store_true", help="Print a captured response without an API call")
parser.add_argument("--text", help="Your input text")
parser.add_argument("--source", help="Source language/script code")
parser.add_argument("--target", help="Target language/script code")
parser.add_argument("--instructions", default="", help="Translation context, tone or address form")
parser.add_argument("--languages", action="store_true", help="List supported language codes")
args = parser.parse_args()
if args.languages:
    print(json.dumps(LANGUAGES, ensure_ascii=False, indent=2))
    raise SystemExit(0)
if args.text is not None:
    if args.case or args.saved:
        parser.error("Use either custom input or an example ID, not both")
    if not args.source or not args.target:
        parser.error("--text requires --source and --target")
    print(client.translate(args.text, source=args.source, target=args.target, instructions=args.instructions).text)
    raise SystemExit(0)
if args.source or args.target or args.instructions:
    parser.error("--source, --target and --instructions require --text")
cases = json.loads((Path(__file__).resolve().parents[1] / "examples/cases.json").read_text())
if not args.case:
    for case in cases:
        print(case["id"], "·", case["group"])
else:
    case = next((c for c in cases if c["id"] == args.case), None)
    if case is None:
        parser.error("Unknown case. Run without an ID to list examples.")
    if args.saved:
        rows = json.loads((Path(__file__).resolve().parents[1] / "fixtures/reviewed-examples.json").read_text())
        row = next(r for r in rows if r["id"] == args.case)
        print(json.dumps({"source": "saved API response", "captured_at": row.get("captured_at"), "request": row["request"], "response": row["response"]}, ensure_ascii=False, indent=2))
        raise SystemExit(0)
    payload = case["request"]
    result = client.translate(payload["text"], source=payload["source"], target=payload["target"], instructions=payload.get("instructions", "")).raw
    print(json.dumps({"request": payload, "response": result}, ensure_ascii=False, indent=2))
