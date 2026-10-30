# Tarjamli translation

Editable source in **[python/src](python/src)** and **[typescript/src](typescript/src)**. Pick either language. No generated bundle is needed.

## Setup

Create an API key at https://api.sawalni.com. Enable the models used below and add credits. Requests consume credits.

```sh
cp .env.example .env
# Edit .env and set SAWALNI_API_KEY.
```

### Python 3.11+

```sh
cd python
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
set -a; . ../.env; set +a
python src/main.py eng_Latn ary_Arab Hello
```

### TypeScript / Node.js 24+

```sh
cd typescript
npm ci
npm run check
npm start -- eng_Latn ary_Arab Hello
```

## Extend it

Edit `src/main` for the entry point and `src/client` for API transport. The key stays in the backend process. Requests have a 120-second timeout. HTTP errors stop the flow. These are local developer starters. Add authentication, rate limits, persistence and deployment settings before exposing a service publicly.

API reference: https://api.sawalni.com/docs

Language examples: `eng_Latn` English, `ary_Arab` Moroccan Arabic, `shi_Latn` Tachelhit (Latin), `zgh_Tfng` Standard Moroccan Amazigh (Tifinagh). Incomplete translations fail visibly.

Run `python tests/smoke.py` from the repository root with Python dependencies installed and Node.js 24 on PATH. It checks both languages against a local HTTP fixture. It does not call the paid API.
