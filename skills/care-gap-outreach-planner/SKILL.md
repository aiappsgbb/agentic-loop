---
name: care-gap-outreach-planner
description: Prioritizes care gaps and prepares personalized, consent-aware patient outreach from approved clinical rules and care plans. Use when a healthcare team needs to identify outreach cohorts, remove access barriers, and coordinate follow-up without making diagnoses or changing treatment.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Care-Gap Outreach Planner

Create an auditable outreach plan that helps an authorized care team close policy-defined care gaps while respecting patient consent, equity, accessibility, and clinical decision boundaries.

## When to use

- An authorized team needs to identify and prioritize care-gap outreach
- Patients need navigation around documented access barriers
- Approved education or scheduling messages need personalization
- Outreach outcomes and follow-up ownership need closed-loop tracking

**Not for:** diagnosis, treatment selection, population-risk scoring without approved rules, emergency triage, marketing, or outreach without verified authorization and consent.

## Required inputs

- Authorized patient identity and minimum-necessary record fields
- Current care plan and organization-approved care-gap rules
- Appointment, referral, screening, and adherence status
- Consent, language, accessibility, channel, and contact-time preferences
- Approved education content and escalation routes
- Rule version, inclusion/exclusion criteria, suppression list, outreach cadence, and responsible care team
- Source timestamps, record identifiers, and prior contact history

Do not proceed when identity, authorization, consent, or rule provenance cannot be verified.

## Workflow

1. Verify the patient or cohort scope, data freshness, and permitted use.
2. Apply only supplied care-gap rules and cite the supporting record and rule version.
3. Prioritize gaps by the organization's urgency, equity, and impact criteria.
4. Identify documented access barriers such as scheduling, language, transportation, affordability, or digital access.
5. Draft plain-language outreach using approved content, the preferred language, and the permitted channel.
6. Offer approved next steps such as scheduling, referral navigation, benefit support, or clinician contact.
7. Route clinical questions, conflicts, and high-risk findings to the designated care professional.
8. Record contact attempts, outcomes, declined outreach, unresolved barriers, and follow-up ownership.

## Prioritization and communication rules

- Apply only the supplied cohort and priority rules; do not create a clinical risk model.
- Record why each patient is included, excluded, suppressed, or deferred.
- Use minimum-necessary information in every message and never include sensitive details in an unapproved channel.
- Preserve the approved clinical meaning when adapting language, reading level, or accessibility.
- Apply contact-frequency limits and stop immediately on opt-out or withdrawn consent.
- Flag missing or conflicting records for human review rather than guessing.

## Guardrails

- Never diagnose, prescribe, reinterpret results, or modify a care plan.
- Never infer sensitive attributes or use them to deprioritize care.
- Minimize protected health information and avoid exposing it in unapproved channels.
- Respect opt-out, consent, accessibility, and communication preferences.
- Escalate urgent symptoms according to the supplied clinical protocol.

## Output template

```markdown
# Care-Gap Outreach Plan

**Cohort/rule version:** [identifier]
**As of:** [timestamp]
**Permitted purpose:** [purpose]
**Status:** [ready / needs clinical review / blocked]

## Prioritized gaps
| Patient/ref | Gap | Rule/evidence | Priority | Barrier | Suppression check |
| --- | --- | --- | --- | --- | --- |

## Outreach plan
| Patient/ref | Channel/time | Approved message | Next action | Owner | Due |
| --- | --- | --- | --- | --- | --- |

## Escalations and exclusions
| Patient/ref | Reason | Destination | Urgency | Status |
| --- | --- | --- | --- | --- |

## Outcome fields
[Attempt, reached, declined, scheduled, barrier unresolved, escalated, and next follow-up.]
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Treating missing data as no care gap | Mark unknown and route for record review |
| Personalizing beyond approved content | Preserve clinical meaning and request approval |
| Contacting through the easiest channel | Use the consented channel and preference |
| Repeated outreach despite no response | Apply the approved cadence and suppression rules |
| Using sensitive attributes to lower priority | Apply only approved equity-aware criteria |

## Completion check

Verify authorization, consent, rule provenance, data freshness, suppression status, accessible approved messaging, explicit ownership, and a closed-loop outcome path for every proposed outreach item.
