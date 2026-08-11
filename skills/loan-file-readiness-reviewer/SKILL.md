---
name: loan-file-readiness-reviewer
description: Reviews lending and mortgage files for document completeness, extraction provenance, cross-source consistency, freshness, and policy-defined exceptions. Use when processors need a traceable readiness package before human underwriting or approval.
license: MIT
metadata:
  author: aiappsgbb
  version: "1.1"
---

# Loan-File Readiness Reviewer

Create a processor-ready, auditable inventory of what a lending file contains, what it lacks, and which inconsistencies require human review. This skill prepares evidence; it does not assess creditworthiness or make a lending decision.

## When to use

- A new or updated loan file needs completeness review
- Extracted document data needs provenance and reconciliation
- A processor needs a minimal, prioritized evidence request
- A file needs readiness status before underwriting

**Not for:** approval, denial, pricing, credit-risk ranking, fraud determination, legal advice, or requesting documents outside the applicable checklist and policy.

## Required inputs

- Application and product-specific document checklist
- Authorized borrower documents and system-of-record data
- Document validity, recency, and signature requirements
- Current processing policy and exception-routing rules
- Source identifiers and extraction confidence
- Application, product, purpose, jurisdiction, stage, policy version, and authorized reviewer
- Duplicate-document rules, accepted alternatives, retention rules, and system write permissions

Never infer a missing value. Mark unreadable, ambiguous, or conflicting evidence for review.

## Workflow

1. Confirm the application, product, jurisdiction, and policy version in scope.
2. Inventory documents and classify each against the required checklist.
3. Extract required fields with page or source references and confidence.
4. Reconcile names, addresses, dates, income, assets, liabilities, property, signatures, and identifiers across sources.
5. Flag missing, stale, incomplete, duplicate, altered, or inconsistent evidence using supplied rules.
6. Distinguish correctable processing issues from exceptions requiring compliance, fraud, or underwriting review.
7. Draft a prioritized request list that asks only for necessary missing evidence.
8. Produce a readiness status and route the package to the authorized human reviewer.

## Classification and status rules

- Give each checklist item one status: **satisfied**, **missing**, **incomplete**, **stale**, **unreadable**, **conflicting**, **not applicable**, or **human review**.
- Cite document, page, field, and extraction confidence for every material fact.
- Do not let one document silently overwrite another; preserve both values and the conflict.
- Apply accepted alternatives and not-applicable rules only when the supplied policy permits them.
- Use **ready for human underwriting** only when every required item is satisfied or an authorized exception is recorded.
- Keep borrower requests specific, minimal, neutral, and free of decision language.

## Guardrails

- Never approve, deny, price, or recommend a credit decision.
- Do not use protected characteristics or unsupported proxies.
- Minimize personally identifiable information in summaries and logs.
- Preserve document provenance and never conceal extraction uncertainty.
- Route suspected fraud or compliance issues; do not make accusations.

## Output template

```markdown
# Loan-File Readiness Review

**Application:** [reference]
**Product/jurisdiction:** [values]
**Policy version:** [identifier]
**As of:** [timestamp]
**Readiness:** [ready for human underwriting / not ready / blocked]

## Checklist
| Requirement | Status | Evidence | Page/field | Freshness | Confidence | Reviewer note |
| --- | --- | --- | --- | --- | --- | --- |

## Inconsistencies
| Field | Source A/value | Source B/value | Materiality rule | Route |
| --- | --- | --- | --- | --- |

## Evidence requests
| Priority | Request | Reason/policy | Recipient | Owner | Due |
| --- | --- | --- | --- | --- | --- |

## Exceptions and routing
[Compliance, fraud, processing, or underwriting route; do not state a conclusion.]
```

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Treating low-confidence extraction as fact | Mark confidence and require verification |
| Requesting every possible document | Follow the product-specific checklist and accepted alternatives |
| Choosing one value from conflicting sources | Preserve the conflict and route it |
| Calling a file underwriting-ready with open required items | Use not ready unless an authorized exception exists |
| Writing suspected fraud as a finding | Describe the anomaly neutrally and route it |

## Completion check

Verify checklist coverage, source/page provenance, freshness, extraction confidence, conflict preservation, policy-minimal requests, readiness logic, and a named human review route.
