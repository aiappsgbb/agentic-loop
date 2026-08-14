import ast
import asyncio
import importlib.metadata
import inspect
import pathlib
import unittest

from copilot import CopilotClient
from copilot.session import CopilotSession


REFERENCE = pathlib.Path(__file__).parents[1] / "references" / "copilot-sdk-with-toolbox.py"


class ReferenceAgentCompatibilityTests(unittest.TestCase):
    def test_pinned_sdk_contract(self):
        self.assertEqual(importlib.metadata.version("github-copilot-sdk"), "1.0.9")

        create_session = inspect.signature(CopilotClient.create_session)
        for parameter in list(create_session.parameters.values())[1:]:
            self.assertEqual(parameter.kind, inspect.Parameter.KEYWORD_ONLY)

        send_and_wait = inspect.signature(CopilotSession.send_and_wait)
        self.assertEqual(send_and_wait.parameters["prompt"].annotation, "str")
        self.assertEqual(send_and_wait.return_annotation, "SessionEvent | None")

    def test_reference_agent_compiles(self):
        compile(REFERENCE.read_text(), str(REFERENCE), "exec")

    def test_reference_session_path_executes_with_keyword_config_and_string_prompt(self):
        tree = ast.parse(REFERENCE.read_text())
        function = next(
            node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "_send_prompt"
        )
        module = ast.Module(
            body=[ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0), function],
            type_ignores=[],
        )
        namespace = {}
        exec(compile(ast.fix_missing_locations(module), str(REFERENCE), "exec"), namespace)

        class FakeSession:
            def __init__(self):
                self.prompt = None
                self.handler = None

            async def __aenter__(self):
                return self

            async def __aexit__(self, *_):
                return False

            def on(self, handler):
                self.handler = handler

            async def send_and_wait(self, prompt):
                self.prompt = prompt
                return "response"

        class FakeClient:
            def __init__(self):
                self.config = None
                self.session = FakeSession()

            async def create_session(self, **config):
                self.config = config
                return self.session

        client = FakeClient()
        callback = lambda event: event
        result = asyncio.run(
            namespace["_send_prompt"](client, {"model": "gpt-5.4-mini"}, "hello", callback)
        )

        self.assertEqual(client.config, {"model": "gpt-5.4-mini"})
        self.assertEqual(client.session.prompt, "hello")
        self.assertIs(client.session.handler, callback)
        self.assertEqual(result, "response")


if __name__ == "__main__":
    unittest.main()
