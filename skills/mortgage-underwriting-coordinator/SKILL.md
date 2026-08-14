---
name: mortgage-underwriting-coordinator
description: Assembles mortgage underwriting evidence, policy checks, conditions, and fair-lending controls into a traceable package for a human underwriter. Use when lending teams need faster analysis and condition tracking without delegating approval, denial, or pricing to an agent.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Mortgage Underwriting Coordinator

Prepare a decision-ready, reproducible underwriting package for an authorized human underwriter. Coordinate policy evidence and conditions while preventing the agent from making, recommending, or obscuring consequential lending decisions.

## When to use

- A ready mortgage file needs policy-to-evidence assembly
- Policy-defined calculations need reproducible support
- Conditions and exceptions need ownership and tracking
- Compliance and fair-lending checks need a traceable human handoff

**Not for:** approval, denial, pricing, automated credit-risk ranking, inventing policy exceptions, adverse-action reasoning, appraisal judgment, or legal interpretation.

## Required inputs

- Ready loan file and verified evidence provenance
- Product, investor, jurisdiction, and policy versions
- Authorized income, asset, liability, credit, collateral, and occupancy data
- Applicable compliance and fair-lending controls
- Human underwriter and exception-approval routes
- Application, product, investor, purpose, property, jurisdiction, and policy effective date
- Policy-defined formulas, tolerances, condition taxonomy, and audit-retention requirements

Stop when the governing policy, jurisdiction, evidence, or reviewer cannot be established.

## Workflow

1. Verify file readiness, policy scope, evidence freshness, and unresolved exceptions.
2. Build a policy-to-evidence matrix with citations for each applicable requirement.
3. Calculate only policy-defined measures from verified inputs and show the formula, units, and source values.
4. Identify inconsistencies, unsupported assumptions, and policy exceptions.
5. Draft clear, necessary conditions and track their owner, evidence, due date, and status.
6. Apply supplied compliance and fair-lending checks; exclude protected characteristics and prohibited proxies from decision support.
7. Summarize strengths, risks, missing evidence, and unresolved conditions without recommending approval or denial.
8. Route the complete package, exceptions, and audit trail to the authorized human underwriter.
9. Update condition status only from verified evidence or an authorized reviewer action.

## Analysis and condition rules

- Cite the exact policy provision and evidence source for every requirement and exception.
- Show formula, source values, units, rounding, and policy threshold for every calculation.
- Separate **fact**, **calculation**, **policy result**, **exception**, and **human judgment required**.
- Give each condition one status: **proposed**, **issued by human**, **received**, **satisfied by human**, **waived by authorized human**, or **expired**.
- Run fair-lending controls over process consistency and prohibited-variable exclusion, not applicant desirability.
- If policies conflict or applicability is ambiguous, stop that analysis and route it to the named policy owner.

## Guardrails

- Never approve, deny, price, rank, or autonomously condition a loan.
- Never use protected characteristics or prohibited proxy variables.
- Do not invent compensating factors, policy exceptions, or evidence.
- Minimize personally identifiable information in outputs and telemetry.
- Require human compliance review for ambiguous or high-impact findings.

## Output template

```markdown
# Mortgage Underwriting Coordination Package

**Application:** [reference]
**Product/investor/jurisdiction:** [values]
**Policy version/effective date:** [values]
**Prepared as of:** [timestamp]
**Status:** [ready for human review / blocked]

## Policy-to-evidence matrix
| Requirement | Policy citation | Evidence citation | Result | Confidence | Human judgment |
| --- | --- | --- | --- | --- | --- |

## Calculations
| Measure | Formula | Source values | Result | Policy threshold | Review status |
| --- | --- | --- | --- | --- | --- |

## Exceptions and inconsistencies
| Issue | Evidence | Policy impact | Required authority | Status |
| --- | --- | --- | --- | --- |

## Condition register
| Condition | Basis | Owner | Due | Evidence | Status |
| --- | --- | --- | --- | --- | --- |

## Compliance controls
[Checks performed, scope, result, limitations, and human reviewer.]

## Human handoff
[Open judgments, unresolved evidence, required approvals, and audit references. No decision recommendation.]
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Turning a policy result into an approval recommendation | Present evidence and leave the decision to the underwriter |
| Hiding rounding or sourced values | Show the complete reproducible calculation |
| Treating a proposed condition as issued | Only a human can issue, satisfy, or waive it |
| Using protected data to improve a risk assessment | Exclude it and run only approved process controls |
| Resolving conflicting policy interpretations silently | Block the item and route it to the policy owner |

## Completion check

Verify policy applicability, evidence provenance, reproducible calculations, explicit uncertainty, condition authority and status, prohibited-variable exclusion, unresolved human judgments, and a complete audit handoff with no decision recommendation.
