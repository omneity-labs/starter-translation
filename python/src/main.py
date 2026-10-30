import sys
from client import Sawalni

source, target, *words = sys.argv[1:]
result = (
    Sawalni()
    .request(
        "POST",
        "language/translate",
        json={
            "model": "tarjamli-mini-v4",
            "source": source,
            "target": target,
            "text": " ".join(words),
        },
    )
    .json()["data"]
)
if result.get("complete") is False:
    raise RuntimeError("Translation was incomplete; shorten the input")
print(result["translated"])
