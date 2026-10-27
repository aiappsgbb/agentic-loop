# Information architecture - what to use when

This document defines the portal's current surfaces and navigation. Historical
three-path advisor plans do not override this model.

## Customer actions

| The user wants... | Surface | Outcome |
| --- | --- | --- |
| To build a customer-specific pilot | **Start a technical workshop** (`/workshop`) | Review requirements, reuse relevant guidance, confirm scope and copy a Copilot build prompt. |
| To show an existing industry example | **Show an industry demo** (`/scenarios`) | Browse industry examples and their available demo links; optionally seed a workshop from an example. |

These are separate actions, not prerequisite courses. The home `#prompt`
Launchpad remains available for a concrete idea. Scenario and idea inputs use
the same build hand-off and requirement coverage model.

## Supporting surfaces

| Surface | One-line job |
| --- | --- |
| **Playbooks** | Reusable implementation guidance selected for relevant customer requirements. |
| **Skills catalog** | Look up Build and Run capabilities. |
| **Concepts / Platform** | Understand the operating model and Foundry/Azure architecture. |

A scenario describes an industry outcome; a playbook supplies an implementation
technique. Shared requirement coverage in `src/data/workshop.ts`, consumed by
`src/data/links.ts` and the advisors, determines which guides apply. Wildcard
eligibility does not mean universal recommendation. Missing coverage remains
an explicit gap, not a claim that the customer requirement is infeasible.

## Navigation grouping

- **Home** - customer actions and the concrete-idea Launchpad.
- **Customer conversation** - technical workshop and industry showcase.
- **Library & expert access** - playbook library and skills catalog.
- **Learn** - agentic concepts and the platform reference architecture.

## Retired reference integration

Kratos is no longer a portal surface. The sidebar, home actions and routing
must not advertise or launch it. `/kratos`, `/reference/kratos` and nested
legacy paths resolve to the standard not-found page. Persona generation and
the session-storage import relay have been removed; no replacement demo or
redirect is implied. See [hosting](../infra/README.md) for route retirement.
