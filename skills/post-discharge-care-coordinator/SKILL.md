---
name: post-discharge-care-coordinator
description: Coordinates post-discharge tasks, appointments, medication questions, patient responses, and rule-based escalation from an approved discharge plan. Use when a care team needs reliable follow-up while keeping all clinical judgments and urgent decisions with licensed professionals.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Post-Discharge Care Coordinator

Translate a finalized discharge plan into a closed-loop coordination workflow. Keep administrative follow-up reliable while routing every clinical judgment, medication concern, and urgent symptom to the approved professional or emergency pathway.

## When to use

- A patient has a finalized discharge plan with follow-up tasks
- Appointments, referrals, tests, medications, and equipment need coordination
- Approved check-ins need to capture barriers and patient-reported status
- A care team needs evidence that escalations and handoffs closed

**Not for:** generating discharge instructions, diagnosing symptoms, changing medications, replacing emergency services, or coordinating from a draft or conflicting plan.

## Required inputs

- Final discharge instructions and responsible care team
- Follow-up appointments, referrals, tests, and task deadlines
- Medication list and approved patient-facing instructions
- Patient consent, channel, language, and accessibility preferences
- Organization-approved symptom and escalation protocols
- Discharge timestamp, encounter identifier, task priority rules, emergency contact pathway, and escalation SLA
- Equipment, home-health, pharmacy, transportation, and caregiver dependencies when applicable

Use only finalized, versioned discharge information. Surface conflicts rather than resolving them clinically.

## Workflow

1. Verify patient identity, discharge event, authorization, and data freshness.
2. Convert the discharge plan into dated tasks with owners, dependencies, and completion evidence.
3. Reconcile administrative inconsistencies across instructions, appointments, referrals, and medication lists.
4. Prepare approved reminders and check-ins in the patient's preferred format.
5. Capture patient-reported status, barriers, questions, and task completion without reinterpreting the response.
6. Apply only explicit escalation rules to reported symptoms or missed critical follow-up.
7. Route clinical questions, medication concerns, and red flags to the designated licensed professional.
8. Track acknowledgements, contact attempts, escalations, and closed-loop outcomes.

## Coordination and status rules

- Assign each task one status: **pending**, **scheduled**, **completed**, **declined**, **blocked**, or **escalated**.
- Record completion evidence; a sent reminder is not task completion.
- Preserve the patient's own words for symptom or medication concerns.
- Apply only supplied escalation rules and SLA clocks.
- Detect duplicate or conflicting instructions and block affected tasks pending human reconciliation.
- Keep retries within approved contact cadence and channel consent.

## Guardrails

- Never diagnose, prescribe, change medication, or provide emergency triage beyond the approved protocol.
- For emergency warning signs, direct the patient to the approved emergency channel immediately.
- Minimize protected health information and use only approved communication channels.
- Do not mark an escalation resolved without evidence from the responsible care team.

## Output template

```markdown
# Post-Discharge Coordination Plan

**Encounter/discharge:** [identifier and timestamp]
**Plan version:** [identifier]
**Responsible team:** [team/contact]
**Status:** [active / blocked / complete]

## Task register
| Task | Due | Owner | Dependency | Evidence required | Status |
| --- | --- | --- | --- | --- | --- |

## Patient communications
| Purpose | Channel/time | Approved message | Response/outcome |
| --- | --- | --- | --- |

## Conflicts and barriers
| Issue | Source | Impacted task | Human owner | Status |
| --- | --- | --- | --- | --- |

## Escalations
| Trigger | Patient-reported detail | Urgency/SLA | Destination | Acknowledged | Closed-loop evidence |
| --- | --- | --- | --- | --- | --- |
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Marking a reminder as completed care | Require the defined completion evidence |
| Resolving conflicting medication lists administratively | Block and route to a licensed professional |
| Summarizing away the patient's wording | Preserve the report verbatim alongside the structured field |
| Closing an escalation when it is sent | Require acknowledgement and resolution evidence |
| Continuing outreach after consent changes | Stop and update the communication status |

## Completion check

Verify that every plan item has an owner, due date, dependency, status, and completion evidence; conflicts are visible; urgent paths follow the approved protocol; and all escalations have acknowledgement and closed-loop resolution tracking.
