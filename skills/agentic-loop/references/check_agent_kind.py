"""Confirm the provisioned Foundry agent is a hosted agent.

Reference implementation for the `agentic-loop` skill's hosted-agent guarantee
(see references/hosted-agent-guarantee.md). Copy into ./scripts/ of the
generated repo and run it after `azd provision` / `azd deploy`.

The agent is read back from the Foundry project rather than trusted from the
deploy step's own return value, because the failure this guards against is a
deploy path that reports success for the wrong artifact type.

Verdicts:
    PASS    kind == "hosted" -- the required Foundry hosted agent.
    REPAIR  anything else (or nothing found) -- re-author from the hosted-agent
            manifest and re-provision, then run this check again.

Usage:
    python check_agent_kind.py --agent-name my-agent
    python check_agent_kind.py --from-file observed.json   # offline

Environment:
    AZURE_AI_PROJECT_ENDPOINT  Foundry project endpoint (or --endpoint)
    AGENT_NAME                 agent name (or --agent-name)

Exit codes are informational: 0 on PASS, 2 on REPAIR. The loop should act on
the verdict (repair and retry) rather than treat a non-zero exit as the end of
the run.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

REQUIRED_KIND = "hosted"

REFERENCE = (
    "skills/agentic-loop/references/foundry-hosted-agent.md#required-artifact-type"
)

KIND_MEANING = {
    "hosted": "Foundry hosted agent (your image, your agent loop, run by Foundry)",
    "prompt": "declarative/prompt agent (instructions + model + tools only)",
    "container_app": "agent backed by an external Container App",
    "workflow": "workflow/orchestration agent",
}


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--agent-name",
        default=os.environ.get("AGENT_NAME"),
        help="Name of the provisioned agent (default: $AGENT_NAME).",
    )
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("AZURE_AI_PROJECT_ENDPOINT"),
        help="Foundry project endpoint (default: $AZURE_AI_PROJECT_ENDPOINT).",
    )
    parser.add_argument(
        "--from-file",
        help=(
            "Read the agent record from a JSON file instead of calling Azure. "
            "Accepts a single object or a list of objects with 'name' and 'kind'."
        ),
    )
    return parser.parse_args(argv)


def _load_from_file(path: str, agent_name: str | None) -> dict | None:
    with open(path, encoding="utf-8") as handle:
        payload = json.load(handle)
    agents = payload if isinstance(payload, list) else [payload]
    if agent_name:
        for agent in agents:
            if agent.get("name") == agent_name:
                return agent
        return None
    return agents[0] if agents else None


def _load_from_project(endpoint: str, agent_name: str | None) -> dict | None:
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential

    client = AIProjectClient(endpoint=endpoint, credential=DefaultAzureCredential())
    for agent in client.agents.list():
        record = {"name": getattr(agent, "name", None), "kind": getattr(agent, "kind", None)}
        if agent_name is None or record["name"] == agent_name:
            return record
    return None


def _report_repair(agent_name: str | None, endpoint: str | None, observed: str | None) -> None:
    described = KIND_MEANING.get(observed or "", "unknown artifact type")
    print("Provisioned agent artifact is not a Foundry hosted agent.")
    print(f"  agent:     {agent_name or '(unnamed)'} (project {endpoint or 'unknown'})")
    if observed is None:
        print("  observed:  no agent found -- the deploy did not create it")
    else:
        print(f"  observed:  kind={observed} -- {described}")
    print(f"  required:  kind={REQUIRED_KIND} (Foundry hosted agent, Responses API)")
    print(f"  reference: {REFERENCE}")
    print(
        "  action:    re-author the agent from the hosted-agent manifest "
        "(azd ai agent init -m <hosted manifest>), remove the wrong artifact, "
        "re-run azd provision/deploy, then re-run this check"
    )
    print("VERDICT: REPAIR")


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    if args.from_file:
        agent = _load_from_file(args.from_file, args.agent_name)
    else:
        if not args.endpoint:
            print(
                "No project endpoint: set AZURE_AI_PROJECT_ENDPOINT or pass --endpoint.",
                file=sys.stderr,
            )
            return 2
        agent = _load_from_project(args.endpoint, args.agent_name)

    observed = agent.get("kind") if agent else None
    name = (agent or {}).get("name") or args.agent_name

    if observed == REQUIRED_KIND:
        print(f"Agent '{name}' is a Foundry hosted agent (kind={observed}).")
        print("VERDICT: PASS")
        return 0

    _report_repair(name, args.endpoint, observed)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
