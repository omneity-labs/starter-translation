import json, os, subprocess, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class Examples(unittest.TestCase):
    def test_saved_requests_match_examples(self):
        cases = json.loads((ROOT/'examples/cases.json').read_text())
        rows = {r['id']: r for r in json.loads((ROOT/'fixtures/reviewed-examples.json').read_text())}
        self.assertEqual({c['id'] for c in cases}, set(rows))
        for case in cases:
            self.assertEqual(case['request'], rows[case['id']]['request'])
    def test_saved_mode_is_offline(self):
        env = dict(os.environ); env.pop('SAWALNI_API_KEY', None)
        run = subprocess.run([sys.executable, str(ROOT/'python/run.py'), '--saved', 'tamazight-water'], env=env, check=True, capture_output=True, text=True)
        self.assertEqual(json.loads(run.stdout)['response']['data']['translated'], 'ⴰⵎⴰⵏ')
