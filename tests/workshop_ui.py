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
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def go(self, path="/workshop", base=BASE):
        self.page.goto(base + path)
        self.page.wait_for_load_state("networkidle")

    def prepare(self, brief):
        self.page.get_by_label("What should the customer be able to do?").fill(brief)
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()

    def scope(self, resolutions=""):
        self.page.get_by_label("Intended users", exact=True).fill("Customer HR staff")
        self.page.get_by_label("Testable success criteria", exact=True).fill("Every supported answer cites the approved source")
        self.page.get_by_label("Required verification evidence", exact=True).fill("20 citation/refusal cases and access-boundary results")
        if resolutions:
            self.page.get_by_label("Gap validation and question resolutions", exact=True).fill(resolutions)

    def snapshot(self, name):
        folder = Path(os.environ.get("WORKSHOP_UI_ARTIFACTS", "test-results/workshop"))
        folder.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=str(folder / name), full_page=True)

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
        expect(self.page.get_by_role("heading", name="Strong documented match")).to_be_visible()
        expect(self.page.get_by_role("button", name="Propose only gaps with Copilot SDK")).to_have_count(0)
        expect(self.page.get_by_label("Coverage and reuse").get_by_text("Enterprise Knowledge Grounding", exact=True)).to_be_visible()
        self.scope()
        self.page.get_by_label("Constraints and dependencies", exact=True).fill("Approved sample documents only\nEU region; no payroll writes")
        self.page.get_by_label("Out-of-scope and production exclusions", exact=True).fill("Production rollout\nPayroll writes")
        self.page.get_by_label("Assumptions", exact=True).fill("Corpus owner provides approved policy samples")
        self.page.get_by_text("Technical requirements (optional expert editing)", exact=True).click()
        self.page.get_by_role("button", name="Capabilities Any").click()
        self.page.get_by_role("option", name="Foundry IQ").focus()
        self.page.keyboard.press("Enter")
        self.page.keyboard.press("Escape")
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        self.page.get_by_role("button", name="Approve scope and specification").click()
        expect(self.page.get_by_text("Approved specification is current.", exact=True)).to_be_visible()
        self.page.get_by_role("button", name="Craft prompt and build hand-off").click()
        dialog = self.page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        dialog.get_by_role("button", name="Run the build loop", exact=True).click()
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async () => {throw new Error('Clipboard disabled in fixture')}}})")
        dialog.get_by_role("button", name="Copy prompt", exact=True).click()
        expect(dialog.get_by_role("alert")).to_contain_text("Clipboard unavailable")
        self.page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => window.copiedWorkshopPrompt = text}})")
        dialog.get_by_role("button", name="Copy prompt", exact=True).click()
        expect(dialog.get_by_role("alert")).to_have_count(0)
        copied = self.page.evaluate("window.copiedWorkshopPrompt")
        for text in [HR, "Customer HR staff", "EU region; no payroll writes", "Foundry IQ",
                     "Every supported answer cites the approved source", "Corpus owner provides approved policy samples"]:
            self.assertIn(text, copied)
        self.assertNotIn("Weather", copied)
        self.page.keyboard.press("Escape")
        expect(dialog).to_have_count(0)
        self.page.get_by_label("Constraints and dependencies", exact=True).fill("Changed customer constraint")
        expect(self.page.get_by_role("button", name="Craft prompt and build hand-off")).to_be_disabled()
        self.page.get_by_role("link", name="Playbook library", exact=True).click()
        self.page.get_by_role("link", name="Start a technical workshop", exact=True).click()
        expect(self.page.get_by_label("Constraints and dependencies", exact=True)).to_have_value("Changed customer constraint")
        self.assertEqual(calls, [])
        self.snapshot("strong-workshop.png")

    def test_partial_uses_only_missing_integration_and_accepts_edited_suggestion(self):
        received = []

        def analyze(route):
            request = route.request.post_data_json
            received.append(request)
            route.fulfill(json={
                "suggestions": [{"kind": "requirement", "source": "custom", "id": "custom-payroll",
                                 "label": "Payroll adapter", "reason": "Validate an approved read-only API",
                                 "addresses": [request["gaps"][0]["id"]]}],
                "guideIds": [], "questions": ["Which approved payroll API?"], "uncertainties": [], "unsupported": []
            })

        self.page.route("**/api/workshop/analyze", analyze)
        self.go()
        self.prepare(HR + " Integrate with a custom payroll system.")
        expect(self.page.get_by_role("heading", name="Partial coverage")).to_be_visible()
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        expect(self.page.get_by_role("heading", name="Provisional AI suggestions")).to_be_visible()
        self.assertEqual([g["id"] for g in received[0]["gaps"]], ["integration"])
        self.assertIn("knowledge-grounding", received[0]["coveredRequirementIds"])
        self.page.get_by_label("Suggestion 1", exact=True).fill("Read-only customer payroll adapter")
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 1:")).check()
        self.scope("Use the customer-approved read-only payroll API; verified sample contract. No payroll writes.")
        self.page.get_by_role("button", name="Approve scope and specification").click()
        self.page.get_by_text("Structured specification (source of truth)", exact=True).click()
        data = json.loads(self.page.locator(".workshop-spec").inner_text())
        self.assertEqual(data["acceptedSuggestions"][0]["label"], "Read-only customer payroll adapter")
        self.assertIn("enterprise-knowledge-grounding", [g["slug"] for g in data["guides"]])

    def test_no_match_accept_edit_remove_and_sdk_validation_failure(self):
        def proposal(route):
            gap = route.request.post_data_json["gaps"][0]["id"]
            route.fulfill(json={
                "suggestions": [
                    {"kind": "capabilities", "source": "catalog", "id": "frontier-models", "label": "Candidate model", "reason": "Validate scheduling approach", "addresses": [gap]},
                    {"kind": "buildingBlocks", "source": "custom", "id": "custom-scheduler", "label": "Scheduling adapter", "reason": "No packaged adapter", "addresses": [gap]},
                    {"kind": "patterns", "source": "catalog", "id": "workflow", "label": "Candidate workflow", "reason": "Review fairness rules", "addresses": [gap]},
                    {"kind": "buildingBlocks", "source": "catalog", "id": "identity", "label": "Existing identity baseline", "reason": "Preserve approved access boundaries", "addresses": [gap]},
                ], "guideIds": [], "questions": [], "uncertainties": ["Fairness not validated"], "unsupported": []
            })
        self.page.route("**/api/workshop/analyze", proposal)
        self.go()
        self.prepare("Schedule telescopes fairly for volunteer teams.")
        expect(self.page.get_by_role("heading", name="No suitable packaged playbook")).to_be_visible()
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 1:")).check()
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 2:")).check()
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 3:")).check()
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 4:")).check()
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 4:")).uncheck()
        self.page.get_by_label("Suggestion 2", exact=True).fill("Customer scheduling integration")
        self.page.get_by_role("checkbox", name=re.compile(r"^Accept suggestion 1:")).uncheck()
        self.scope("Validated a manual scheduling pilot with synthetic data; customer approved fairness rules. No live integration yet.")
        self.page.get_by_role("button", name="Approve scope and specification").click()
        self.page.get_by_text("Structured specification (source of truth)", exact=True).click()
        data = json.loads(self.page.locator(".workshop-spec").inner_text())
        self.assertEqual(data["capabilities"], [])
        self.assertIn("Customer scheduling integration", data["buildingBlocks"])
        self.assertIn("Identity & Access", data["buildingBlocks"])
        self.assertIn("Workflow Automation", data["candidatePatterns"])
        self.assertEqual(len(data["acceptedSuggestions"]), 2)

        self.page.unroute("**/api/workshop/analyze")
        self.page.route("**/api/workshop/analyze", lambda route: route.fulfill(json={
            "suggestions": [], "guideIds": ["fake-playbook"], "questions": [], "uncertainties": [], "unsupported": []
        }))
        self.page.get_by_label("What should the customer be able to do?").fill("Schedule volunteer telescope access differently.")
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        expect(self.page.get_by_role("alert")).to_contain_text("Fabricated")
        expect(self.page.get_by_role("heading", name="Provisional AI suggestions")).to_have_count(0)

    def test_auth_timeout_cancel_and_stale_responses(self):
        self.go()
        self.prepare("Schedule shared telescopes for volunteer teams.")
        for code, message in [("AUTH_REQUIRED", "Sign in with the Copilot CLI"), ("TIMEOUT", "Copilot analysis timed out")]:
            self.page.route("**/api/workshop/analyze", lambda route: route.fulfill(status=503, json={"code": code, "message": message}))
            self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
            expect(self.page.get_by_role("alert")).to_contain_text(message)
            self.page.unroute("**/api/workshop/analyze")
        pending = []
        self.page.route("**/api/workshop/analyze", lambda route: pending.append(route))
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        expect(self.page.get_by_role("button", name="Cancel analysis")).to_be_visible()
        self.page.get_by_role("button", name="Cancel analysis").click()
        expect(self.page.get_by_role("alert")).to_contain_text("cancelled")
        for route in pending:
            route.abort()
        pending.clear()
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        expect(self.page.get_by_role("button", name="Cancel analysis")).to_be_visible()
        self.page.get_by_label("What should the customer be able to do?").fill(HR)
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        for route in pending:
            route.fulfill(json={"suggestions": [], "guideIds": [], "questions": ["Stale question"], "uncertainties": [], "unsupported": []})
        expect(self.page.get_by_role("heading", name="Strong documented match")).to_be_visible()
        expect(self.page.get_by_role("heading", name="Provisional AI suggestions")).to_have_count(0)

    def test_vague_unsupported_and_static_manual_path(self):
        self.go()
        self.prepare("Help me")
        expect(self.page.get_by_role("heading", name="Needs clarification")).to_be_visible()
        self.prepare("Use an unsupported integration to the legacy scheduling system.")
        expect(self.page.get_by_role("heading", name="Unsupported requirement")).to_be_visible()
        self.go(base=STATIC)
        self.prepare("Schedule telescope usage fairly for volunteer teams.")
        expect(self.page.get_by_text("AI analysis is unavailable on this static portal.", exact=False)).to_be_visible()
        self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        expect(self.page.get_by_role("alert")).to_contain_text("unavailable")
        self.page.get_by_text("Technical requirements (optional expert editing)", exact=True).click()
        self.page.get_by_label("Custom capabilities (one per line)", exact=True).fill("Fair telescope allocation")
        self.page.get_by_label("Custom building blocks (one per line)", exact=True).fill("Read-only scheduling API")
        self.page.get_by_label("Custom candidate patterns (one per line)", exact=True).fill("Manual approval")
        self.page.get_by_role("button", name="Prepare workshop", exact=True).click()
        self.scope("Customer validated a manual MVP with synthetic scheduling data; live integrations excluded.")
        self.page.get_by_role("button", name="Approve scope and specification").click()
        expect(self.page.get_by_role("button", name="Craft prompt and build hand-off")).to_be_enabled()
        self.page.get_by_text("Structured specification (source of truth)", exact=True).click()
        data = json.loads(self.page.locator(".workshop-spec").inner_text())
        self.assertIn("Fair telescope allocation", data["capabilities"])
        self.assertIn("Read-only scheduling API", data["buildingBlocks"])
        self.assertIn("Manual approval", data["candidatePatterns"])

    @unittest.skipUnless(os.environ.get("WORKSHOP_LIVE_SDK") == "1", "Live SDK explicitly opt-in")
    def test_live_sdk_browser_adapter(self):
        self.go()
        health = self.page.request.get(BASE + "/api/workshop/health")
        self.assertEqual(health.status, 200)
        self.assertEqual(health.json()["authentication"], "checked-per-analysis")
        self.prepare("Help a fictional community center schedule shared telescopes fairly across volunteer teams.")
        with self.page.expect_response("**/api/workshop/analyze", timeout=120000) as pending:
            self.page.get_by_role("button", name="Propose only gaps with Copilot SDK").click()
        self.assertEqual(pending.value.status, 200, pending.value.text())
        data = pending.value.json()
        self.assertIn("suggestions", data)
        expect(self.page.get_by_role("heading", name="Provisional AI suggestions")).to_be_visible()
        self.assertGreater(len(data["suggestions"]) + len(data["questions"]), 0)
        self.snapshot("live-sdk-workshop.png")

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
        self.go("/workshop?guide=enterprise-knowledge-grounding")
        self.prepare(HR)
        expect(self.page.get_by_role("heading", name="Strong documented match")).to_be_visible()
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
        width = self.page.evaluate("document.documentElement.scrollWidth")
        self.assertLessEqual(width, 390)
        self.snapshot("mobile-workshop.png")
        self.page.get_by_role("button", name="Open menu").click()
        self.page.get_by_role("link", name="Show an industry demo", exact=True).click()
        expect(self.page.locator(".app-shell")).not_to_have_class(re.compile(r".*is-mobile-open.*"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
