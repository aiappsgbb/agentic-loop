---
name: factory-operations-triage
description: Triages smart-factory anomalies by correlating machine telemetry, MES events, maintenance history, quality deviations, and approved procedures. Use when operators need evidence-backed severity, likely causes, and safe next actions for an industrial incident.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Factory Operations Triage

Turn an industrial anomaly into a traceable triage package that helps operators and engineers act safely. This skill identifies what is known, what remains uncertain, and which approved response path applies; it does not control equipment or declare final root cause.

## When to use

- An alarm, drift, stoppage, scrap spike, or quality deviation needs rapid triage
- Maintenance and operations need a shared evidence timeline
- A near miss needs containment before a formal investigation
- A work order, incident, or deviation record needs an evidence-backed draft

**Not for:** autonomous process control, safety-system bypass, final root-cause certification, or replacing emergency response and site incident-command procedures.

## Required inputs

- Plant, line, asset, product or lot, operating mode, and time window
- Authorized telemetry, alarms, MES events, QMS deviations, CMMS history, and work orders
- Current operating limits, baselines, and site-approved SOPs
- Data timestamps, units, source identifiers, and freshness
- Site severity matrix, escalation roster, record identifiers, and write permissions

If the scope, limits, or evidence is missing, request it. Never invent a threshold or silently substitute stale data.

## Workflow

1. Confirm the incident scope and normalize timestamps, units, asset identifiers, and lot identifiers.
2. Separate observed facts from inferred relationships. Cite the source and timestamp for every material fact.
3. Compare signals with supplied limits and baselines; identify the first deviation and correlated events.
4. Link the evidence to recent maintenance, changeovers, material changes, and quality deviations.
5. Rank plausible causes by supporting and contradicting evidence. Label uncertainty.
6. Retrieve the current site-approved response procedure and verify its version and applicability.
7. Assign severity using the supplied safety, quality, downtime, and production-impact rules.
8. Recommend safe operator checks, maintenance inspection, containment, or escalation.
9. Draft write-back updates for the incident, work order, or deviation record, but require approval before writing.

## Evidence and status rules

- Label every claim as **observed**, **calculated**, **reported**, or **hypothesis**.
- Use only the site's supplied severity matrix. If it is unavailable, report **severity unassigned** and escalate.
- Use confidence labels **high**, **medium**, or **low**, supported by evidence and counter-evidence.
- Mark the case **blocked** when required telemetry, SOPs, operating limits, or authorization are unavailable.
- Mark triage **complete** only when immediate safety status, containment, owner, and next checkpoint are explicit.

## Guardrails

- Never send commands to PLC, SCADA, DCS, robot, or other control systems.
- Never override interlocks, alarms, lockout/tagout, quality holds, or site safety procedures.
- Treat a safety-critical or unknown condition as an immediate human escalation.
- Do not claim root cause until the designated investigator confirms it.

## Output template

```markdown
# Factory Triage: [plant / line / asset]

**Window:** [start-end, timezone]
**Operating mode:** [mode]
**Data freshness:** [sources and latest timestamps]
**Severity:** [site rating or unassigned]
**Status:** [escalated / contained / monitoring / blocked]

## Immediate safety and containment
| Action | Approved procedure | Owner | Approval/status |
| --- | --- | --- | --- |

## Evidence timeline
| Time | Type | Observation | Source | Freshness |
| --- | --- | --- | --- | --- |

## Cause hypotheses
| Rank | Hypothesis | Confidence | Supporting evidence | Counter-evidence | Next check |
| --- | --- | --- | --- | --- | --- |

## Impact
[Safety, quality, downtime, product/lot, and downstream impact.]

## Escalation and next checkpoint
[Owner, destination, due time, and decision needed.]

## Proposed record updates
[Draft only; identify target record and required approver.]
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Treating correlation as root cause | Keep it as a hypothesis until the designated investigation confirms it |
| Comparing mismatched units or clocks | Normalize units and timezone before analysis |
| Using a generic internet procedure | Use only the current site-approved SOP |
| Optimizing production during an unresolved safety event | Escalate and contain first |
| Writing to operations systems without approval | Produce a draft and capture the named approver |

## Completion check

Before returning, verify that all material claims have provenance, uncertainty is visible, the response is compatible with the approved SOP, safety status and containment are explicit, and every next action has an owner and checkpoint.
