"""Non-sensitive browser journeys. Start dev (5173) and preview (4173) first."""
import json
import os
import re
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("WORKSHOP_UI_URL", "http://127.0.0.1:5173/agentic-loop")
STATIC = os.environ.get("WORKSHOP_STATIC_URL", "http://127.0.0.1:4173/agentic-loop")
HR = "Employees need HR policy answers grounded in approved documents with citations."
EXAMPLES = json.loads(Path("src/data/workshop-briefs.json").read_text())


class WorkshopJourneys(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        self.errors = []
        self.preparation_requests = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("request", lambda request: self.preparation_requests.append(request.url)
                     if "/api/workshop/" in request.url or ":4318" in request.url else None)

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])
        self.assertEqual(self.preparation_requests, [], "Workshop preparation must not call a service")

    def go(self, path="/workshop", base=BASE):
        self.page.goto(base + path)
        self.page.wait_for_load_state("networkidle")

    def prepare(self, brief):
        self.page.get_by_label("What should the customer be able to do?").fill(brief)
        for checkbox in self.page.locator(".workshop-technical input").all():
            if checkbox.is_enabled():
                checkbox.uncheck()
        self.page.get_by_role("checkbox", name="Identity & Access", exact=False).check()
        self.page.get_by_role("checkbox", name="Observability", exact=False).check()
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()

    def scope(self, resolutions=""):
        self.page.get_by_label("Who will use the pilot?", exact=True).fill("Customer HR staff")
        self.page.get_by_label("What does success look like?", exact=True).fill("Every supported answer cites the approved source")
        if resolutions:
            self.page.get_by_label("Scope notes and decisions", exact=True).fill(resolutions)

    def continue_button(self):
        return self.page.get_by_role("button", name=re.compile(r"^(Confirm scope & get prompt|Open build prompt)$"))

    def open_prompt(self):
        self.continue_button().click()
        dialog = self.page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        steps = dialog.locator(".step-label").all_text_contents()
        self.assertEqual(steps[:3], ["Prepare your environment", "Create your project", "Your build prompt"])
        expect(dialog.get_by_role("heading", name="Prepare your environment", exact=True)).to_be_visible()
        expect(dialog.get_by_role("link", name="GitHub Copilot App", exact=True)).to_have_attribute("href", "https://gh.io/app")
        expect(dialog.get_by_role("link", name="install the lean plugin", exact=True)).to_have_attribute(
            "href", "https://github.com/copilot/app/launch?open=ghapp%3A%2F%2Fplugins%2Finstall%3Fsource%3Dlean%2540Spec2Cloud")
        self.assertNotIn("copilot login", dialog.inner_text())
        self.assertNotIn("copilot plugin", dialog.inner_text())
        dialog.locator(".modal-foot").get_by_role("button", name="Create your project", exact=True).click()
        expect(dialog.get_by_role("heading", name="Create your project", exact=True)).to_be_visible()
        expect(dialog.get_by_text("Add project from", exact=False)).to_be_visible()
        expect(dialog.get_by_text("Why this skill?", exact=True)).to_be_visible()
        expect(dialog.get_by_role("link", name="agentic-loop", exact=True)).to_have_attribute("href", "/agentic-loop/skills/agentic-loop")
        expect(dialog.get_by_role("link", name="reference architecture", exact=True)).to_have_attribute("href", "/agentic-loop/concepts/platform")
        expect(dialog.get_by_text("Installing the skill is not invoking it.", exact=False)).to_be_visible()
        self.assertIn("gh skill update --dry-run", dialog.inner_text())
        dialog.locator(".modal-foot").get_by_role("button", name="Your build prompt", exact=True).click()
        expect(dialog.get_by_role("button", name="Copy prompt", exact=True)).to_be_visible()
        expect(dialog.get_by_role("heading", name="Copy your prompt into GitHub Copilot App", exact=True)).to_be_visible()
        self.assertNotIn("Start the Copilot CLI", dialog.inner_text())
        self.assertNotIn('"brief":', dialog.locator(".prompt-preview pre").inner_text())
        return dialog

    def approved_spec(self):
        dialog = self.open_prompt()
        dialog.get_by_role("navigation").get_by_role("button", name="Review approved spec", exact=True).click()
        data = dialog.locator(".workshop-spec").inner_text()
        self.assertTrue(data.startswith("## Confirmed customer workshop specification"))
        self.page.keyboard.press("Escape")
        return data

    def snapshot(self, name):
        folder = Path(os.environ.get("WORKSHOP_UI_ARTIFACTS", "test-results/workshop"))
        folder.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=str(folder / name), full_page=self.page.get_by_role("dialog").count() == 0, animations="disabled")

    def test_home_and_empty_brief(self):
        self.go("/")
        self.assertGreater(self.page.get_by_role("link", name="Start a technical workshop").count(), 0)
        self.assertGreater(self.page.get_by_role("link", name="Show an industry demo").count(), 0)
        self.page.get_by_role("button", name="Dark", exact=True).click()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "dark")
        self.snapshot("home-dark.png")
        self.go()
        brief = self.page.get_by_label("What should the customer be able to do?")
        self.assertIn(brief.input_value(), EXAMPLES)
        expect(self.page.get_by_role("button", name="Prepare workshop", exact=True)).to_be_enabled()
        brief.fill("")
        expect(self.page.get_by_role("button", name="Prepare workshop", exact=True)).to_be_disabled()
        expect(brief).to_have_value("")
        expect(brief).to_have_attribute("placeholder", "Enter the customer brief here...")
        expect(self.page.get_by_label("Use an industry example")).to_have_count(0)
        frontier = self.page.get_by_role("checkbox", name="Frontier Models", exact=False)
        expect(frontier).to_be_checked()
        expect(frontier).to_be_disabled()
        for theme in ["Light", "Dark"]:
            self.page.get_by_role("button", name=theme, exact=True).click()
            self.page.locator(".prompt-box > label").click()
            expect(brief).to_be_focused()
            style = brief.evaluate("""element => {
                const style = getComputedStyle(element);
                return {border: parseFloat(style.borderTopWidth), background: style.backgroundColor,
                        height: element.getBoundingClientRect().height, resize: style.resize,
                        outline: style.outlineStyle, font: style.fontFamily};
            }""")
            self.assertGreaterEqual(style["border"], 2)
            self.assertNotEqual(style["background"], "rgba(0, 0, 0, 0)")
            self.assertGreaterEqual(style["height"], 160)
            self.assertEqual(style["resize"], "vertical")
            self.assertEqual(style["outline"], "solid")
            self.assertIn("Inter", style["font"])
            self.snapshot("brief-" + theme.lower() + ".png")
        self.go("/#prompt")
        self.assertGreater(self.page.evaluate("window.scrollY"), 0)

    def test_random_sample_briefs_preserve_navigation_and_customer_edits(self):
        for index, expected in enumerate(EXAMPLES):
            page = self.context.new_page()
            page.on("pageerror", lambda error: self.errors.append(str(error)))
            try:
                page.add_init_script(f"Math.random = () => {(index + 0.5) / len(EXAMPLES)}")
                page.goto(BASE + "/workshop")
                page.wait_for_load_state("networkidle")
                brief = page.get_by_label("What should the customer be able to do?")
                expect(brief).to_have_value(expected)
                expect(page.get_by_text("Sample customer brief. Edit or replace it with your own.", exact=True)).to_be_visible()
                expect(page.get_by_role("checkbox", name="Frontier Models", exact=False)).to_be_checked()
                expect(page.get_by_role("checkbox", name="Frontier Models", exact=False)).to_be_disabled()
                expect(page.get_by_role("checkbox", name="Identity & Access", exact=False)).to_be_checked()
                expect(page.get_by_role("checkbox", name="Observability", exact=False)).to_be_checked()
                selected_name = "Foundry IQ" if index < 2 else "Human-in-the-Loop"
                expect(page.get_by_role("checkbox", name=selected_name, exact=False)).to_be_checked()
                expect(page.locator(".workshop-technical textarea")).to_have_count(0)
                expect(page.get_by_role("group")).to_have_count(3)
                column_positions = page.locator(".workshop-option-column").evaluate_all("elements => elements.map(element => element.getBoundingClientRect().x)")
                self.assertEqual(len(set(column_positions)), 3)
                for text in [expected, "My customer's editable brief"]:
                    brief.fill(text)
                    page.get_by_role("link", name="Playbook library", exact=True).click()
                    page.get_by_role("link", name="Start a technical workshop", exact=True).click()
                    expect(brief).to_have_value(text)
                expect(page.get_by_text("Sample customer brief. Edit or replace it with your own.", exact=True)).to_have_count(0)
                brief.fill("")
                page.get_by_role("button", name="Light", exact=True).click()
                expect(brief).to_have_value("")
                expect(page.get_by_role("button", name="Prepare workshop", exact=True)).to_be_disabled()
            finally:
                page.close()

    def test_strong_reuse_scope_copy_and_stale_approval(self):
        calls = []
        self.page.route("**/api/workshop/analyze", lambda route: calls.append(route.request) or route.abort())
        self.go()
        self.prepare(HR)
        expect(self.page.get_by_text("Reusable starting point", exact=True)).to_be_visible()
        expect(self.page.get_by_role("button", name="Propose only gaps with Copilot SDK")).to_have_count(0)
        proposal = self.page.get_by_label("Proposed workshop approach", exact=True)
        guide = proposal.get_by_role("article", name="Enterprise Knowledge Grounding", exact=True)
        expect(guide.get_by_role("heading", name="Enterprise Knowledge Grounding", exact=True)).to_be_visible()
        expect(guide.get_by_text("Grounded answers with citations", exact=True)).to_be_visible()
        expect(guide.get_by_text("What you can reuse", exact=True)).to_be_visible()
        expect(proposal.get_by_text("Learn while building.", exact=True)).to_be_visible()
        expect(guide.get_by_text("What you'll explore", exact=True)).to_be_visible()
        expect(guide.get_by_text("Foundry IQ; Agentic Retrieval; Storage.", exact=False)).to_be_visible()
        expect(guide.get_by_text("What needs adapting", exact=True)).to_be_visible()
        expect(guide.get_by_text("Confirm before building:", exact=True)).to_be_visible()
        expect(guide.get_by_text("Not included:", exact=True)).to_be_visible()
        expect(guide.get_by_role("checkbox", name="Include Enterprise Knowledge Grounding in build prompt")).to_be_checked()
        expect(proposal.get_by_text("This is a proposal, not a built or deployed app.", exact=False)).to_be_visible()
        expect(self.page.locator(".workshop-plan details, .workshop-plan summary")).to_have_count(0)
        expect(self.page.get_by_label("Review workshop").locator("textarea")).to_have_count(3)
        expect(self.page.get_by_text("Structured specification (source of truth)", exact=True)).to_have_count(0)
        expect(self.continue_button()).to_be_disabled()
        expect(self.page.get_by_text("Add who will use the pilot. Define what success looks like.", exact=True)).to_be_visible()
        expect(self.page.get_by_role("button", name="Approve workshop")).to_have_count(0)
        expect(self.page.get_by_role("button", name="Craft prompt and build hand-off")).to_have_count(0)
        expect(self.page.get_by_label("Review workshop").locator(".craft-btn")).to_have_count(1)
        self.scope()
        notes = "Approved sample documents only\nEU region; no payroll writes\nCorpus owner provides approved policy samples"
        self.page.get_by_label("Scope notes and decisions", exact=True).fill(notes)
        checkbox = self.page.get_by_role("checkbox", name="Foundry IQ", exact=False)
        checkbox.focus()
        self.page.keyboard.press("Space")
        expect(checkbox).to_be_checked()
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        dialog = self.open_prompt()
        expect(dialog.get_by_role("heading", name="Your build prompt", exact=True)).to_be_visible()
        expect(dialog.get_by_text("this page does not start a build or deployment.", exact=False)).to_be_visible()
        self.snapshot("build-prompt.png")
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async () => {throw new Error('Clipboard disabled in fixture')}}})")
        dialog.get_by_role("button", name="Copy prompt", exact=True).click()
        expect(dialog.get_by_role("alert")).to_contain_text("Clipboard unavailable")
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => window.copiedWorkshopPrompt = text}})")
        dialog.get_by_role("button", name="Copy prompt", exact=True).click()
        expect(dialog.get_by_role("alert")).to_have_count(0)
        copied = self.page.evaluate("window.copiedWorkshopPrompt")
        self.assertEqual(copied.count(HR), 1)
        for text in [HR, "Customer HR staff", "EU region; no payroll writes", "Foundry IQ",
                     "Frontier Models", "Every supported answer cites the approved source", "Corpus owner provides approved policy samples"]:
            self.assertIn(text, copied)
        self.assertNotIn("Weather", copied)
        self.assertIn("## Learn while building", copied)
        self.assertIn("Solution Engineer can teach the customer", copied)
        self.assertIn("without repeating every tutorial step", copied)
        self.assertIn("## Required Agentic Loop build policy", copied)
        self.assertIn("Installation alone is not evidence of invocation.", copied)
        self.assertIn("after Specify writes ./docs/spec.md and before Plan starts, invoke the installed agentic-loop skill", copied)
        self.assertNotIn("policy layer before Specify", copied)
        self.page.keyboard.press("Escape")
        expect(dialog).to_have_count(0)
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_be_focused()
        self.open_prompt().get_by_role("button", name="Prepare your environment", exact=True).click()
        self.page.get_by_role("dialog").get_by_role("button", name="Back to workshop", exact=True).click()
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_be_focused()
        self.page.get_by_label("Scope notes and decisions", exact=True).fill("Changed customer constraint")
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_have_count(0)
        expect(self.page.get_by_role("button", name="Confirm scope & get prompt", exact=True)).to_be_enabled()
        self.page.get_by_role("link", name="Playbook library", exact=True).click()
        self.page.get_by_role("link", name="Start a technical workshop", exact=True).click()
        expect(self.page.get_by_label("Scope notes and decisions", exact=True)).to_have_value("Changed customer constraint")
        self.assertIn("Changed customer constraint", self.approved_spec())
        self.page.get_by_role("checkbox", name="Storage", exact=False).check()
        expect(self.page.get_by_label("Review workshop")).to_have_count(0)
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_have_count(0)
        expect(self.page.get_by_role("button", name="Confirm scope & get prompt", exact=True)).to_be_enabled()
        self.assertEqual(calls, [])
        self.snapshot("strong-workshop.png")

    def test_missing_details_and_reconfirmation_are_clear(self):
        self.go()
        self.prepare(HR)
        self.page.get_by_label("Who will use the pilot?", exact=True).fill("Customer HR staff")
        expect(self.continue_button()).to_be_disabled()
        expect(self.page.get_by_text("Define what success looks like.", exact=True)).to_be_visible()
        self.page.get_by_label("What does success look like?", exact=True).fill("Answers cite approved sources")
        self.open_prompt()
        self.page.keyboard.press("Escape")
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_be_enabled()
        self.page.get_by_label("What does success look like?", exact=True).fill("")
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_have_count(0)
        expect(self.continue_button()).to_be_disabled()
        self.page.get_by_label("What does success look like?", exact=True).fill("Changed criterion: unsupported questions are refused")
        self.assertIn("### Success criteria\n\n- Changed criterion: unsupported questions are refused", self.approved_spec())

    def test_learning_playbook_is_accessible_without_losing_confirmed_scope(self):
        self.go()
        self.prepare(HR)
        self.scope("Teach citations using approved policy samples.")
        policy = self.page.get_by_label("Required Agentic Loop build skill", exact=True)
        expect(policy.get_by_role("heading", name="Why the Agentic Loop skill is required")).to_be_visible()
        policy.get_by_role("link", name="reference architecture", exact=True).click()
        self.page.wait_for_url("**/concepts/platform")
        expect(self.page.get_by_role("heading", name="The reference architecture for the Agentic Loop.", exact=True)).to_be_visible()
        self.page.get_by_role("link", name="Start a technical workshop", exact=True).first.click()
        expect(self.page.get_by_label("Scope notes and decisions", exact=True)).to_have_value("Teach citations using approved policy samples.")
        dialog = self.open_prompt()
        expect(dialog.get_by_text("First build on this topic?", exact=True)).to_be_visible()
        expect(dialog.get_by_text("Already familiar?", exact=True)).to_be_visible()
        dialog.get_by_role("link", name="Explore Enterprise Knowledge Grounding playbook", exact=True).click()
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.page.wait_for_url("**/playbooks/enterprise-knowledge-grounding")
        self.page.get_by_role("link", name="Start a technical workshop", exact=True).first.click()
        expect(self.page.get_by_label("What should the customer be able to do?")).to_have_value(HR)
        expect(self.page.get_by_label("Scope notes and decisions", exact=True)).to_have_value("Teach citations using approved policy samples.")
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_be_enabled()
        self.open_prompt()

    def test_guide_inclusion_manual_choices_and_workflow_are_explicit(self):
        self.go()
        self.prepare(HR)
        self.scope()
        guide = self.page.get_by_role("article", name="Enterprise Knowledge Grounding", exact=True)
        include = guide.get_by_role("checkbox", name="Include Enterprise Knowledge Grounding in build prompt", exact=True)
        include.uncheck()
        expect(guide.get_by_text("Include in build prompt", exact=True)).to_be_visible()
        expect(self.page.get_by_role("heading", name="Still needs a customer-specific decision")).to_be_visible()
        expect(self.continue_button()).to_be_disabled()
        expect(self.page.get_by_text("Add scope notes that resolve the remaining gaps and questions.", exact=True)).to_be_visible()
        include.check()
        expect(self.continue_button()).to_be_enabled()
        self.assertIn("### Selected guides\n\n- enterprise-knowledge-grounding:", self.approved_spec())

        self.page.get_by_label("Add another guide (optional)", exact=False).select_option("governance-safety-baseline")
        added = self.page.get_by_role("article", name="Governance & Safety Baseline", exact=True)
        expect(added.get_by_text("Added manually.", exact=False)).to_be_visible()
        expect(self.page.get_by_role("button", name="Open build prompt", exact=True)).to_have_count(0)
        self.assertIn("- governance-safety-baseline:", self.approved_spec())
        added.get_by_role("checkbox", name="Include Governance & Safety Baseline in build prompt", exact=True).click()
        expect(added).to_have_count(0)

        workflow = self.page.get_by_label("Build workflow", exact=True)
        workflow.select_option("threadlight-pipeline")
        pipeline = self.page.get_by_role("article", name="Idea to Production", exact=True)
        expect(pipeline).to_be_visible()
        expect(pipeline.get_by_role("checkbox", name="Include Idea to Production in build prompt", exact=True)).to_be_disabled()
        expect(self.continue_button()).to_be_disabled()
        workflow.select_option("agentic-loop")
        expect(pipeline).to_have_count(0)
        expect(self.page.locator(".workshop-plan details, .workshop-plan summary")).to_have_count(0)
        self.page.get_by_role("button", name="Dark", exact=True).click()
        self.snapshot("proposal-dark.png")

    def test_partial_preserves_guidance_and_requires_manual_gap_decisions(self):
        self.go()
        self.prepare(HR + " Integrate with a custom payroll system.")
        expect(self.page.get_by_text("Partly covered", exact=True)).to_be_visible()
        expect(self.page.get_by_role("article", name="Enterprise Knowledge Grounding", exact=True)).to_be_visible()
        expect(self.page.get_by_text("Customer-specific system integration", exact=True)).to_be_visible()
        self.scope()
        expect(self.continue_button()).to_be_disabled()
        self.scope("Use the customer-approved read-only payroll API; verified sample contract. No payroll writes.")
        data = self.approved_spec()
        self.assertIn("read-only payroll API", data)
        self.assertIn("### Remaining gaps\n\n- Customer-specific system integration", data)
        self.assertIn("- enterprise-knowledge-grounding:", data)
        self.assertNotIn("acceptedSuggestions", data)

    def test_custom_workshop_is_prepared_without_any_network_requests(self):
        self.go()
        requests = []
        self.page.route("**/*", lambda route: requests.append(route.request.url) or route.abort())
        self.prepare("Schedule telescopes fairly for volunteer teams.")
        expect(self.page.get_by_text("Custom approach needed", exact=True)).to_be_visible()
        expect(self.page.get_by_role("button", name="Propose only gaps with Copilot SDK")).to_have_count(0)
        expect(self.page.get_by_role("heading", name="Provisional AI suggestions")).to_have_count(0)
        self.scope()
        expect(self.continue_button()).to_be_disabled()
        self.scope("Validated a manual scheduling pilot with synthetic data; customer approved fairness rules. No live integration yet.")
        data = self.approved_spec()
        self.assertIn("### Capabilities\n\n- Frontier Models", data)
        self.assertIn("Identity & Access", data)
        self.assertIn("### Selected guides\n\n- None specified.", data)
        self.assertNotIn("acceptedSuggestions", data)
        dialog = self.open_prompt()
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => window.copiedWorkshopPrompt = text}})")
        dialog.get_by_role("button", name="Copy prompt", exact=True).click()
        self.assertIn(data, self.page.evaluate("window.copiedWorkshopPrompt"))
        self.assertEqual(requests, [])

    def test_vague_unsupported_and_static_manual_path(self):
        self.go()
        self.prepare("Help me")
        expect(self.page.get_by_text("Clarify the brief", exact=True)).to_be_visible()
        self.prepare("Use an unsupported integration to the legacy scheduling system.")
        expect(self.page.get_by_text("Unsupported requirement", exact=True)).to_be_visible()
        self.go(base=STATIC)
        self.prepare("Schedule telescope usage fairly for volunteer teams.")
        expect(self.page.get_by_text("Recommendations use curated rules in your browser, not AI analysis.", exact=False)).to_be_visible()
        expect(self.page.get_by_role("button", name="Propose only gaps with Copilot SDK")).to_have_count(0)
        self.page.get_by_role("checkbox", name="Frontier Models", exact=False).check()
        self.page.get_by_role("checkbox", name="Human-in-the-Loop", exact=False).check()
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        self.scope("Customer validated a manual MVP with synthetic scheduling data; live integrations excluded. Fair telescope allocation with manual approval.")
        expect(self.continue_button()).to_be_enabled()
        data = self.approved_spec()
        self.assertIn("Frontier Models", data)
        self.assertIn("Human-in-the-Loop", data)
        self.assertIn("Fair telescope allocation", data)

    def test_deep_links_library_roles_examples_theme_and_mobile(self):
        slugs = [
            "getting-started", "enterprise-knowledge-grounding", "multi-agent-orchestration",
            "governance-safety-baseline", "continuous-evaluation-loop", "voice-first-agent-blueprint",
            "bring-your-own-skills", "threadlight-pipeline", "citadel-governance-hub"
        ]
        for slug in slugs:
            self.go("/playbooks/" + slug)
            expect(self.page.locator(".playbook-crumb")).not_to_be_empty()
        scenarios = json.loads(Path("src/data/scenarios.json").read_text())
        demo = next(s for s in scenarios if s.get("video"))
        self.go("/scenarios/" + demo["id"])
        self.page.get_by_role("button", name="Play " + demo["name"] + " demo", exact=True).click()
        expect(self.page.get_by_role("dialog")).to_be_visible()
        self.page.keyboard.press("Escape")
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.page.get_by_role("link", name="Start a technical workshop").last.click()
        expect(self.page.get_by_label("What should the customer be able to do?")).not_to_have_value("")
        for field, group in [("capabilities", "Capabilities"), ("buildingBlocks", "Building blocks"), ("patterns", "Candidate patterns")]:
            for label in demo.get(field, []):
                name = "Foundry IQ" if label == "Knowledge" else label
                expect(self.page.get_by_role("group", name=group, exact=True).get_by_role("checkbox", name=name, exact=False)).to_be_checked()
        self.go("/workshop?guide=enterprise-knowledge-grounding")
        self.prepare(HR)
        expect(self.page.get_by_text("Reusable starting point", exact=True)).to_be_visible()
        self.go("/playbooks")
        for label in ["Learn the workflow", "Capability guide", "Delivery workflow", "Governance and operations", "Shared infrastructure"]:
            self.assertGreater(self.page.get_by_text(label, exact=True).count(), 0)
        self.go()
        expect(self.page.get_by_label("Use an industry example")).to_have_count(0)
        self.page.get_by_role("button", name="Light", exact=True).click()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "light")
        self.context.close()
        self.context = self.browser.new_context(viewport={"width": 390, "height": 844})
        self.page = self.context.new_page()
        self.go()
        expect(self.page.get_by_label("What should the customer be able to do?")).to_be_visible()
        self.snapshot("mobile-brief.png")
        self.prepare(HR)
        self.scope()
        expect(self.continue_button()).to_be_enabled()
        column_positions = self.page.locator(".workshop-option-column").evaluate_all("elements => elements.map(element => element.getBoundingClientRect().x)")
        self.assertEqual(len(set(column_positions)), 1)
        width = self.page.evaluate("document.documentElement.scrollWidth")
        self.assertLessEqual(width, 390)
        self.snapshot("mobile-workshop.png")
        dialog = self.open_prompt()
        self.snapshot("mobile-build-prompt.png")
        copy_bounds = dialog.get_by_role("button", name="Copy prompt", exact=True).bounding_box()
        self.assertGreaterEqual(copy_bounds["y"], 0)
        self.assertLessEqual(copy_bounds["y"] + copy_bounds["height"], 844)
        footer_bounds = dialog.locator(".modal-foot").bounding_box()
        self.assertLessEqual(footer_bounds["y"] + footer_bounds["height"], 844)
        self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), 390)
        self.page.keyboard.press("Escape")
        self.page.get_by_role("button", name="Open menu").click()
        self.page.get_by_role("link", name="Show an industry demo", exact=True).click()
        expect(self.page.locator(".app-shell")).not_to_have_class(re.compile(r".*is-mobile-open.*"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
