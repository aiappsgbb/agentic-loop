# Playbook Title: One-line subject

<!--
HOW THIS FILE RENDERS
- The page is a slide deck. Each `###` (H3) heading becomes one slide.
- Each `##` (H2) heading becomes a chapter in the progress rail.
- The `#` (H1) heading is the deck title only — it is not a slide.
- Text placed directly under a `#` or `##` heading (i.e. not under an `###`)
  is NOT shown. Put every piece of content inside an `### ` section.
- The first slide must be an `###` heading (see "Overview" below).
- Images live in ./images/ and are referenced as ./images/<file>; paths are
  rewritten automatically at render time.
- Use `---` between sections freely; it is stripped from slide bodies.
- Register the playbook in src/data/playbooks.json with a matching `slug`
  (must equal this folder's name).
-->

## Intro

### Overview

One paragraph on what this playbook teaches and the end state the reader reaches.

The playbook is organized in three chapters:

- **Build** — go from a prompt to a working prototype.
- **Run** — operate the deployed solution with telemetry enabled.
- **Scale** — evolve the running solution through the loop.

---

### What we will build

Describe the target solution in a sentence or two.

---

### Setup

What the reader needs before starting:

- Azure subscription with Contributor permissions, plus a GitHub Copilot plan.
- Required CLIs installed and authenticated.

```bash
az account show                 # confirm the correct tenant and subscription
azd auth login --check-status   # confirm you are signed in to azd
```

> **Heads up on cost.** This playbook provisions billable Azure resources.
> See [Clean up](#clean-up) to remove everything when you are done.

## Build

### First build step

Describe the first action. Each `###` is a slide, so keep one idea per section.

```bash
# example command
```

> Tip: callouts render as styled notes — use them for asides and warnings.

---

### Second build step

Continue the build. Reference images with `./images/<file>`.

![Step screenshot](./images/run.png)

## Run

### Run the solution

How to exercise the deployed solution and what to expect.

![Preview](./images/preview.png)

---

### Observe traces

How to read telemetry and debug a turn end to end.

## Scale

### Take it further

How to evolve the solution and push changes through the loop.

> Tip: run the loop unattended for larger changes.

---

### Clean up

Tear down billable resources when finished. Run from the project root:

```bash
azd down --purge --force
```
