import io, json, sys, unittest, urllib.error
from pathlib import Path
from unittest.mock import patch

from tarjamli.client import translate, make_request, TranslationError

def body(**change):
    data = dict(translated="Pouvez-vous m'envoyer le document ?", complete=True, source="eng_Latn", target="fra_Latn", model="tarjamli-mini-v4")
    data.update(change)
    return io.BytesIO(json.dumps(dict(data=data)).encode())

class ClientTests(unittest.TestCase):
    def test_wire_request_and_auth(self):
        with patch("urllib.request.urlopen", return_value=body()) as call:
            result = translate("واش؟", "eng_Latn", "fra_Latn", "Use vous.", api_key="test-only")
        request = call.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.sawalni.com/v1/language/translate")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-only")
        payload = json.loads(request.data)
        self.assertEqual(payload["text"], "واش؟")
        self.assertEqual(payload["instructions"], "Use vous.")
        self.assertNotIn("test-only", request.data.decode())
        self.assertTrue(result["data"]["complete"])
    def test_incomplete_and_identity_mismatch(self):
        for changes in [dict(complete=False),dict(target="deu_Latn"),dict(model="other"),dict(translated="")]:
            with self.subTest(changes=changes), patch("urllib.request.urlopen", return_value=body(**changes)):
                with self.assertRaises(TranslationError): translate("hello", "eng_Latn", "fra_Latn", api_key="test-only")
    def test_utf8_limit_and_explicit_language(self):
        for args in [("x", "auto", "fra_Latn"),("é"*131073,"eng_Latn","fra_Latn")]:
            with self.assertRaises(ValueError): make_request(*args)
        with self.assertRaises(ValueError): make_request("x","eng_Latn","fra_Latn","é"*16385)
    def test_no_silent_retry_or_secret_in_error(self):
        error = urllib.error.HTTPError("https://api.sawalni.com",429,"busy",{},None)
        with patch("urllib.request.urlopen", side_effect=error) as call:
            with self.assertRaisesRegex(TranslationError,"HTTP 429") as caught:
                translate("hello","eng_Latn","fra_Latn",api_key="test-only")
        self.assertEqual(call.call_count,1)
        self.assertNotIn("test-only",str(caught.exception))

if __name__ == "__main__": unittest.main()
