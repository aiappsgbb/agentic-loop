"""Check the caller's RBAC before step 1 of an agentic-loop playbook run.

Reference implementation for the `agentic-loop` skill's RBAC pre-flight
(see references/rbac-preflight.md). Copy into ./scripts/ of the generated repo
and run it *before* any provisioning -- an `azd` preprovision hook is a good
home for it.

The failure this guards against is an RBAC gap that surfaces mid-provisioning,
after partial resources exist, one scope at a time. So this check reports
*every* missing assignment at once, as principal -> scope -> role, with a
ready-to-run remediation block to hand to a subscription owner.

Required assignments come from the deployer-prerequisites table in
references/rbac-contract.md. Effective assignments are read with the Azure CLI
(`az role assignment list --include-inherited --include-groups`), so inherited
and group-derived grants count. A requirement is satisfied by an
equivalent-or-broader role (Owner satisfies Contributor), which is why a
fully-permissioned run reports nothing.

Verdicts:
    PASS     every required assignment is satisfied. Prints one summary line
             (nothing at all with --quiet).
    BLOCKED  at least one is missing. Prints the full list. Do not start step 1.
    ERROR    the check could not be evaluated -- resolve it, don't skip it.

Usage:
    python check_rbac_preflight.py --subscription <sub-id>
    python check_rbac_preflight.py --subscription <sub-id> --resource-group rg-app
    python check_rbac_preflight.py --from-file observed.json --subscription <sub-id>

Environment (each has a matching flag):
    AZURE_SUBSCRIPTION_ID  target subscription (required)
    AZURE_RESOURCE_GROUP   pre-existing resource group, if the run targets one
    AZURE_AI_ACCOUNT_ID    existing Foundry AI account resource id, if brownfield
    AZURE_AI_PROJECT_ID    existing Foundry project resource id, if brownfield

Exit codes: 0 on PASS, 2 on BLOCKED, 1 on ERROR.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

REFERENCE = (
    "skills/agentic-loop/references/rbac-contract.md#deployer-prerequisites-pre-flight"
)

# Scope kinds, in the order they are reported.
SUBSCRIPTION = "subscription"
RESOURCE_GROUP = "resource_group"
AI_ACCOUNT = "ai_account"
AI_PROJECT = "ai_project"

# Required roles per scope kind -- the deployer prerequisites table.
REQUIREMENTS: list[tuple[str, str, str]] = [
    (
        SUBSCRIPTION,
        "Contributor",
        "Create the resource group and every resource in the reference architecture",
    ),
    (
        SUBSCRIPTION,
        "Role Based Access Control Administrator",
        "Microsoft.Authorization/roleAssignments/write - the Bicep creates every row "
        "of the runtime matrix",
    ),
    (
        RESOURCE_GROUP,
        "Contributor",
        "Deploy into a pre-created resource group when the caller has no "
        "subscription-level rights",
    ),
    (
        RESOURCE_GROUP,
        "Role Based Access Control Administrator",
        "Write the resource-group-scoped rows of the runtime matrix",
    ),
    (
        AI_ACCOUNT,
        "Azure AI Account Owner",
        "Create the project, model deployments, and connections",
    ),
    (
        AI_PROJECT,
        "Azure AI Project Manager",
        "Create/publish hosted agents, skills, and toolboxes on the project",
    ),
]

# A requirement is satisfied by an equivalent-or-broader role.
#
# Note the asymmetry: Owner/Contributor are *not* listed against the Foundry
# roles. Those roles carry `dataActions`, which Owner's `*` actions do not
# cover, so a subscription Owner still cannot create agents or skills on a
# project. Treating them as equivalent would produce exactly the false pass
# this check exists to prevent -- the Foundry-project failure that surfaced
# separately from the subscription one.
SATISFIED_BY: dict[str, set[str]] = {
    "Contributor": {"Owner"},
    "Role Based Access Control Administrator": {"Owner", "User Access Administrator"},
    "Azure AI Account Owner": set(),
    "Azure AI Project Manager": {"Azure AI Account Owner"},
}


class PreflightError(Exception):
    """The check could not be evaluated (verdict ERROR)."""


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--subscription",
        default=os.environ.get("AZURE_SUBSCRIPTION_ID"),
        help="Target subscription id (default: $AZURE_SUBSCRIPTION_ID).",
    )
    parser.add_argument(
        "--resource-group",
        default=os.environ.get("AZURE_RESOURCE_GROUP"),
        help=(
            "Pre-existing resource group name (default: $AZURE_RESOURCE_GROUP). "
            "Omit on a greenfield run, where the deployment creates it."
        ),
    )
    parser.add_argument(
        "--ai-account",
        default=os.environ.get("AZURE_AI_ACCOUNT_ID"),
        help="Existing Foundry AI account resource id (default: $AZURE_AI_ACCOUNT_ID).",
    )
    parser.add_argument(
        "--ai-project",
        default=os.environ.get("AZURE_AI_PROJECT_ID"),
        help="Existing Foundry project resource id (default: $AZURE_AI_PROJECT_ID).",
    )
    parser.add_argument(
        "--assignee",
        help=(
            "Principal to check (object id or UPN). Defaults to the signed-in user, "
            "or to 'principal' in the --from-file payload."
        ),
    )
    parser.add_argument(
        "--from-file",
        help=(
            "Read observed assignments from a JSON file instead of calling Azure. "
            "Shape: {'principal': {'id': ..., 'display': ...}, "
            "'assignments': [{'scope': ..., 'role': ...}, ...]}."
        ),
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Print nothing on PASS. The BLOCKED report is always printed.",
    )
    return parser.parse_args(argv)


def _az(args: list[str]) -> object:
    """Run an `az` command and return its parsed JSON output."""
    if shutil.which("az") is None:
        raise PreflightError(
            "Azure CLI ('az') not found on PATH -- required unless --from-file is used."
        )
    completed = subprocess.run(
        ["az", *args, "-o", "json"],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip().splitlines()
        raise PreflightError(
            f"az {' '.join(args)} failed: {detail[-1] if detail else 'unknown error'}"
        )
    try:
        return json.loads(completed.stdout or "null")
    except json.JSONDecodeError as exc:
        raise PreflightError(f"az {' '.join(args)} returned non-JSON output: {exc}") from exc


def build_scopes(args: argparse.Namespace) -> list[tuple[str, str]]:
    """Return the (scope kind, scope id) pairs in play, in report order.

    Only the subscription is unconditional. Resource-group and Foundry scopes are
    checked when the run targets pre-existing ones; on a greenfield run they do
    not exist yet, and the subscription-scoped rights are what permit creating
    them.
    """
    if not args.subscription:
        raise PreflightError(
            "No subscription: set AZURE_SUBSCRIPTION_ID or pass --subscription."
        )

    subscription_scope = f"/subscriptions/{args.subscription}"
    scopes = [(SUBSCRIPTION, subscription_scope)]

    if args.resource_group:
        group = args.resource_group
        scopes.append(
            (
                RESOURCE_GROUP,
                group
                if group.startswith("/subscriptions/")
                else f"{subscription_scope}/resourceGroups/{group}",
            )
        )
    if args.ai_account:
        scopes.append((AI_ACCOUNT, args.ai_account))
    if args.ai_project:
        scopes.append((AI_PROJECT, args.ai_project))
    return scopes


def _normalize(assignments: object) -> list[dict[str, str]]:
    records = []
    for item in assignments or []:
        if not isinstance(item, dict):
            continue
        scope = item.get("scope")
        role = item.get("role") or item.get("roleDefinitionName")
        if scope and role:
            records.append({"scope": str(scope), "role": str(role)})
    return records


def load_from_file(path: str, assignee: str | None) -> tuple[dict[str, str], list[dict[str, str]]]:
    with open(path, encoding="utf-8") as handle:
        payload = json.load(handle)
    if isinstance(payload, list):
        payload = {"assignments": payload}
    principal = payload.get("principal") or {}
    resolved = {
        "id": assignee or principal.get("id") or "(unknown)",
        "display": principal.get("display") or principal.get("id") or assignee or "(unknown)",
    }
    return resolved, _normalize(payload.get("assignments"))


def resolve_principal(assignee: str | None) -> dict[str, str]:
    if assignee:
        return {"id": assignee, "display": assignee}
    user = _az(["ad", "signed-in-user", "show"])
    if not isinstance(user, dict) or not user.get("id"):
        raise PreflightError(
            "Could not resolve the signed-in user -- run 'az login' or pass --assignee."
        )
    return {
        "id": str(user["id"]),
        "display": str(user.get("userPrincipalName") or user.get("displayName") or user["id"]),
    }


def resolve_assignments(principal_id: str, scopes: list[tuple[str, str]]) -> list[dict[str, str]]:
    """Read effective assignments -- inherited and group-derived included."""
    records: list[dict[str, str]] = []
    for _, scope in scopes:
        listed = _az(
            [
                "role",
                "assignment",
                "list",
                "--assignee",
                principal_id,
                "--scope",
                scope,
                "--include-inherited",
                "--include-groups",
            ]
        )
        records.extend(_normalize(listed))
    return records


def _covers(assignment_scope: str, scope: str) -> bool:
    """True when an assignment at `assignment_scope` applies to `scope`.

    An assignment inherits downwards, so a subscription-scoped grant satisfies a
    requirement on a resource group or Foundry project beneath it.
    """
    a = assignment_scope.rstrip("/").lower()
    s = scope.rstrip("/").lower()
    return s == a or s.startswith(f"{a}/")


def find_missing(
    scopes: list[tuple[str, str]], assignments: list[dict[str, str]]
) -> list[dict[str, str]]:
    """Diff required against effective, applying role and scope equivalence."""
    missing = []
    for kind, scope in scopes:
        effective = {
            record["role"] for record in assignments if _covers(record["scope"], scope)
        }
        for req_kind, role, why in REQUIREMENTS:
            if req_kind != kind:
                continue
            if role in effective or effective & SATISFIED_BY.get(role, set()):
                continue
            missing.append({"scope": scope, "role": role, "why": why})
    return missing


def report_blocked(principal: dict[str, str], missing: list[dict[str, str]]) -> None:
    count = len(missing)
    plural = "" if count == 1 else "s"
    print(
        f"RBAC pre-flight: BLOCKED -- {count} required role assignment{plural} "
        f"{'is' if count == 1 else 'are'} missing."
    )
    print()
    print(f"  principal: {principal['display']} ({principal['id']})")
    print()
    for gap in missing:
        print(f"  MISSING  {principal['display']} -> {gap['scope']}")
        print(f"           role: {gap['role']}")
        print(f"           why:  {gap['why']}")
    print()
    print("Ask a subscription owner to run:")
    print()
    for gap in missing:
        print(
            f'  az role assignment create --assignee "{principal["id"]}" '
            f'--role "{gap["role"]}" --scope "{gap["scope"]}"'
        )
    print()
    print(f"reference: {REFERENCE}")
    print("No resources have been created. Re-run this check once the assignments are in place.")


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    try:
        scopes = build_scopes(args)
        if args.from_file:
            principal, assignments = load_from_file(args.from_file, args.assignee)
        else:
            principal = resolve_principal(args.assignee)
            assignments = resolve_assignments(principal["id"], scopes)
    except PreflightError as exc:
        print(f"RBAC pre-flight: ERROR -- {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"RBAC pre-flight: ERROR -- {exc}", file=sys.stderr)
        return 1

    missing = find_missing(scopes, assignments)
    if missing:
        report_blocked(principal, missing)
        return 2

    if not args.quiet:
        required = sum(1 for kind, _, _ in REQUIREMENTS if kind in {k for k, _ in scopes})
        print(f"RBAC pre-flight: PASS -- {required} required role assignments satisfied.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
