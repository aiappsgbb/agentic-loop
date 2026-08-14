---
name: production-flow-optimizer
description: Diagnoses manufacturing bottlenecks and proposes constraint-aware production, WIP, changeover, and shift plans. Use when a plant team needs to improve throughput or recover a schedule without violating safety, quality, labor, maintenance, or material constraints.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Production Flow Optimizer

Convert plant constraints and performance data into feasible production-recovery options and a human-approved operating plan. Optimize against the stated objective while preserving safety, quality, labor, maintenance, and customer commitments.

## When to use

- Throughput, service level, WIP, or schedule attainment is below target
- A disruption requires safe replanning
- Operations needs to compare sequencing, staffing, changeover, or maintenance options
- A shift needs a decision-ready handoff

**Not for:** machine control, autonomous schedule release, workforce discipline, bypassing quality holds, or optimization without a declared objective and constraints.

## Required inputs

- Production plan and actual output by line, product, and shift
- Cycle time, takt time, WIP, queue, downtime, scrap, and changeover data
- Labor, material, maintenance, tooling, energy, and shipping constraints
- Safety rules, quality holds, approved routings, and service-level priorities
- Planning horizon, optimization objective, baseline plan, freeze windows, and approval owner
- Known data gaps, source timestamps, units, and system-of-record identifiers

State the planning horizon and optimization objective before recommending changes. If the baseline plan, hard constraints, or horizon data cannot be verified or reconciled, request the missing information rather than substituting assumed values.

## Workflow

1. Validate data freshness and reconcile plan, MES, inventory, maintenance, and quality records.
2. Build the active constraint map and calculate the supplied throughput, delay, WIP, and service metrics.
3. Identify the governing bottleneck and distinguish chronic constraints from temporary disruptions.
4. Generate a small set of feasible options for sequencing, WIP release, staffing, changeovers, maintenance windows, or material allocation.
5. Reject options that conflict with safety, quality, labor, maintenance, customer, or equipment constraints.
6. Compare feasible options against the stated objective and show assumptions and tradeoffs.
7. Recommend a plan with expected impact, confidence range, monitoring points, and rollback trigger.
8. Produce a shift handoff covering decisions, unresolved constraints, risks, owners, and next checkpoints.
9. Require planner or operations approval before changing schedules or writing to operational systems.

## Analysis rules

- Compare every option with the same baseline and planning horizon.
- Show the formula and source values for material calculations.
- Separate hard constraints from preferences and never relax a hard constraint silently.
- Include a no-change baseline and at least two feasible alternatives when evidence permits.
- Use ranges or scenarios when demand, downtime, yield, or cycle-time inputs are uncertain.
- Declare the result **blocked** when required baseline or constraint data cannot be verified or reconciled.
- Declare the result **infeasible** only when the required inputs are verified and no option satisfies all hard constraints.

## Guardrails

- Never trade safety or quality compliance for throughput.
- Never issue machine-control commands or autonomously release held product.
- Do not hide infeasibility; identify the blocking constraint and required decision.
- Keep calculations reproducible from cited inputs.

## Output template

```markdown
# Production Flow Recommendation

**Horizon:** [start-end]
**Objective:** [metric and priority]
**Baseline:** [plan/version]
**Status:** [recommended / infeasible / blocked]

## Current state
| Metric | Baseline | Actual | Gap | Source |
| --- | --- | --- | --- | --- |

## Governing constraints
| Constraint | Hard/preference | Capacity/limit | Evidence |
| --- | --- | --- | --- |

## Options
| Option | Changes | Expected impact | Tradeoffs | Constraint result | Confidence |
| --- | --- | --- | --- | --- | --- |

## Recommendation
[Selected option, rationale, assumptions, and rejected alternatives.]

## Execution and shift handoff
| Action | Owner | Timing | Dependency | Approval/status |
| --- | --- | --- | --- | --- |

## Monitoring and rollback
[Leading indicators, checkpoints, thresholds, rollback trigger, and fallback plan.]
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Optimizing a local station instead of system throughput | Identify the governing end-to-end constraint |
| Mixing stale inventory with current MES data | Reconcile timestamps and freeze the analysis snapshot |
| Presenting an impossible plan as a recommendation | Report infeasibility and the blocking decision |
| Giving a point estimate despite uncertain downtime | Use scenarios or confidence ranges |
| Omitting the no-change baseline | Compare every proposal against it |

## Completion check

Verify that the objective and horizon are explicit, every option satisfies hard constraints, calculations are reproducible, tradeoffs and uncertainty are visible, and the recommendation has approval, monitoring, rollback, and shift-handoff ownership.
