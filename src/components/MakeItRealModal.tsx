import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Check, Copy, Terminal, Sparkles, Rocket, ArrowRight, FolderPlus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdvisorPackage } from '../data/advisor';
import { getRunSkill } from '../data/skills';
import { formatWorkshopSpecMarkdown } from '../data/workshop';
import { FOUNDRY_LOOP, buildWorkflowLabel } from '../data/buildWorkflow';

interface Props {
  open: boolean;
  onClose: () => void;
  advisorPackage: AdvisorPackage | null;
}

const STEPS = [
  { id: 'prep', title: 'Prepare your environment', icon: Terminal },
  { id: 'project', title: 'Create your project', icon: FolderPlus },
  { id: 'loop', title: 'Your build prompt', icon: Sparkles },
  { id: 'review', title: 'Review approved spec', icon: Check },
  { id: 'skills', title: 'Choose skills', icon: Sparkles },
  { id: 'operate', title: 'Verify your pilot', icon: RefreshCw },
];

export default function MakeItRealModal({ open, onClose, advisorPackage }: Props) {
  if (!open || !advisorPackage) return null;
  return <MakeItRealDialog key={advisorPackage.copilotPrompt} open={open} onClose={onClose} advisorPackage={advisorPackage} />;
}

function MakeItRealDialog({ open, onClose, advisorPackage }: Props & { advisorPackage: AdvisorPackage }) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedRunSkills, setSelectedRunSkills] = useState<string[]>([]);
  const [copyError, setCopyError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what had focus so we can restore it when the modal closes.
    triggerRef.current = document.activeElement as HTMLElement | null;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href]');
        if (!nodes?.length) return;
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === modalRef.current)) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      triggerRef.current?.focus?.();
    };
  }, [onClose, open]);

  function closeModal() {
    setStep(0);
    onClose();
  }

  function toggleRunSkill(id: string) {
    setSelectedRunSkills(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setCopyError('');
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch {
      setCopyError('Clipboard unavailable. Select and copy the displayed prompt manually.');
    }
  }

  const availableRunSkills = advisorPackage.runSkills.filter(s => getRunSkill(s));

  const chosenRunSkills = availableRunSkills.filter(s => selectedRunSkills.includes(s));
  const runSkillsLine = chosenRunSkills.length
    ? `\n\nUse the following skills when running the agent(s): ${chosenRunSkills.join(', ')}.`
    : '';
  const specPrompt = `${advisorPackage.copilotPrompt}${runSkillsLine}`;
  const currentStep = STEPS[step].id;
  const execution = advisorPackage.workshopSpec?.execution ?? 'agentic-loop';

  return createPortal(
    <div className="modal-backdrop build-prompt-backdrop" onClick={closeModal}>
      <div className="modal build-prompt-modal" ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="make-it-real-title">
        <header className="modal-head">
          <div>
            <div className="modal-eyebrow">Customer workshop · Agentic Launchpad</div>
            <h2 id="make-it-real-title">Your build prompt</h2>
            <p>Your scope is confirmed. Prepare your environment, create your project, then paste the Markdown prompt into GitHub Copilot App. If you're already set up, go straight to Your build prompt; this page does not start a build or deployment.</p>
          </div>
          <button className="icon-btn" onClick={closeModal} aria-label="Close"><X size={16} /></button>
        </header>

        <nav className="stepper" aria-label="Build prompt and setup guidance">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i === step ? 'current' : 'todo';
            return (
              <button key={s.id} className={`step ${state}`} aria-current={i === step ? 'page' : undefined} onClick={() => setStep(i)}>
                <span className="step-bubble"><Icon size={14} /></span>
                <span className="step-label">{s.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="modal-body">
          {currentStep === 'prep' && (
            <div className="step-pane">
              <h3>Prepare your environment</h3>
              <p className="muted">Use <a href="https://gh.io/app" target="_blank" rel="noopener noreferrer">GitHub Copilot App</a> for this build. Sign in with your Copilot-enabled GitHub account. You also need Git, Node.js, Python 3.13, GitHub CLI (gh), Azure CLI (az) and Azure Developer CLI (azd) with its Foundry extensions. Check permissions, model/region availability and approved sample data before a live workshop. The canvas readiness check helps identify missing tools; approve any installation separately.</p>
              <p className="muted">Open <strong>Customize → Plugins</strong>, find <strong>foundry-agentic-loop</strong> and install it. The <a href={FOUNDRY_LOOP.pluginUrl} target="_blank" rel="noopener noreferrer">published Foundry Agentic Loop plugin</a> bundles the skill, canvas and SDD workflow. No separate lean plugin, policy-skill installation or Cockpit import is needed.</p>
              <CodeBlock label="Alternative: install the published plugin from Copilot CLI" code={FOUNDRY_LOOP.installCommand} k="prep-plugin" copied={copied} onCopy={copy} />
              <p className="muted">The canvas does not grant deployment permissions or replace Azure sign-in. Run the terminal checks below in the environment where Copilot executes the build, including when using a sandbox. This portal cannot verify your tools or subscription readiness.</p>
              <CodeBlock label="Sign in to GitHub CLI and Azure in your terminal" code={'gh auth login\naz login\nazd auth login'} k="prep-auth" copied={copied} onCopy={copy} />
              <CodeBlock label="Verify command-line prerequisites and Azure subscription" code="gh --version && gh auth status && az account show && azd version && azd auth login --check-status && python3 --version && node --version && git --version" k="prep-check" copied={copied} onCopy={copy} />
            </div>
          )}

          {currentStep === 'project' && (
            <div className="step-pane">
              <h3>Create your project</h3>
              <p className="muted">Create an empty folder (or a private repo) to hold the loop's artifacts — spec, plan, source, and infra.</p>
              <CodeBlock label="New local folder" code="mkdir my-agentic-app && cd my-agentic-app" k="proj-mkdir" copied={copied} onCopy={copy} />
              <CodeBlock label="…or a private GitHub repo" code="gh repo create my-agentic-app --private --clone && cd my-agentic-app" k="proj-repo" copied={copied} onCopy={copy} />
              <p className="muted"><strong>Why this skill?</strong> <Link to="/skills/foundry-agentic-loop" onClick={closeModal}>foundry-agentic-loop</Link> coordinates the <Link to="/concepts/platform" onClick={closeModal}>reference architecture</Link>, readiness checks and build mode. It is included in the plugin, not installed separately. Copilot asks before installing the companion microsoft-foundry skill.</p>
              <p className="muted">In GitHub Copilot App, choose <strong>+ → Add project from → Local folder or repository</strong> and select your folder. Start a session and send:</p>
              <CodeBlock label="Open the bundled canvas from Chat" code={FOUNDRY_LOOP.openPrompt} k="proj-open-loop" copied={copied} onCopy={copy} />
              <p className="muted">On <strong>Start</strong>, confirm your selected workflow: <strong>{buildWorkflowLabel(execution)}</strong>. Rapid needs an existing Foundry project; SDD starts from a subscription and creates a project. For Threadlight, follow its maintained guide instead of starting SDD. The first build records the mode in AGENTS.md and Azure settings in .azure/deployment-plan.md; changing modes needs confirmation.</p>
              <p className="muted">The canvas has <strong>Start, Build, Explore and Optimize</strong> tabs. Use a prompt template or your confirmed workshop prompt below. If a bundled component is missing, Copilot asks before reinstalling the plugin; it never installs extensions from a URL or edits Copilot settings. Re-enable disabled extensions in your extension settings and continue in a new session. Without the canvas, continue in Chat; without the workflow, SDD cannot start. Changing to Rapid needs your confirmation and an existing Foundry project.</p>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="step-pane">
              <h3>Your confirmed scope</h3>
              <p className="muted">This is the source of truth for the final prompt. Close the hand-off to edit it; any upstream change invalidates approval.</p>
              <pre className="workshop-spec">{advisorPackage.workshopSpec ? formatWorkshopSpecMarkdown(advisorPackage.workshopSpec) : advisorPackage.intent}</pre>
              {advisorPackage.workshopSpec?.execution === 'threadlight-pipeline' && <div className="modal-hint">The shipped Threadlight variant requires awesome-gbb and threadlight-skills. Follow its maintained guide and validate the opinionated infrastructure and deployment scope before execution.</div>}
            </div>
          )}
          {currentStep === 'skills' && (
            <div className="step-pane">
              <h3>Choose skills</h3>
              <p className="muted">The <strong>foundry-agentic-loop build skill</strong> comes with the plugin and is invoked by the prompt. Copilot identifies additional <strong>build skills</strong> from the scope; review any installation or update approvals. <strong>Run skills</strong> are reused by the customer agent at execution time; select the ones you want below. Return to <strong>Your build prompt</strong> to copy the updated prompt.</p>

              {availableRunSkills.length > 0 ? (
                <div className="run-skill-checklist">
                  {availableRunSkills.map(s => {
                    const meta = getRunSkill(s);
                    const checked = selectedRunSkills.includes(s);
                    return (
                      <label key={s} className={`run-skill-option ${checked ? 'checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRunSkill(s)} />
                        <span className="run-skill-check"><Check size={12} /></span>
                        <span className="run-skill-info">
                          <span className="run-skill-name">{s}</span>
                          {meta?.description && <span className="run-skill-desc">{meta.description}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="modal-hint"><Rocket size={14} /> No run skills suggested for this package — Copilot will generate any it needs during the build phase.</div>
              )}
            </div>
          )}

          {currentStep === 'loop' && (
            <div className="step-pane">
              <h3>Copy your prompt into GitHub Copilot App</h3>
              <PackageBlock icon={<Sparkles size={14} />} title="Build prompt" action="Copy prompt" copied={copied === 'prompt'} onCopy={() => copy(specPrompt, 'prompt')}>
                {specPrompt}
              </PackageBlock>
              <p className="muted">Paste this Markdown prompt into your project session. It preserves your confirmed scope, selected guides and run skills. Copilot will use <strong>{buildWorkflowLabel(execution)}</strong>. {execution === 'agentic-loop' ? 'Specify includes the plan and frozen contract. Each phase has independent review and bounded fix rounds; review the spec before implementation and approve azd up separately.' : execution === 'agentic-loop-rapid' ? 'Build and verify locally in your existing project, then approve any deployment separately.' : 'Validate the Threadlight prerequisites and review its design before execution; deployment needs separate approval.'}</p>
              <p className="muted">SDD flight records live in <code>.agentic-loop/runs/</code>; verified lessons go in <code>docs/LOOP.md</code>. Later, ask Copilot to <strong>improve the agentic loop</strong> for measured, evidence-backed changes that require your approval and never weaken gates.</p>
              {advisorPackage.playbooks.length > 0 && <>
                <p className="muted"><strong>First build on this topic?</strong> Explore the selected playbooks to understand the capability and guide the customer through it. <strong>Already familiar?</strong> Reuse the approach through the prompt below; you don't need to repeat every playbook step.</p>
                <ul>{advisorPackage.playbooks.map(guide => <li key={guide.slug}><Link to={`/playbooks/${guide.slug}`} onClick={closeModal}>Explore {guide.name} playbook</Link></li>)}</ul>
              </>}
            </div>
          )}

          {currentStep === 'operate' && (
            <div className="step-pane">
              <h3>Verify your pilot</h3>
              <p className="muted">Check the approved success criteria, identity boundaries, safe data handling and scenario-specific failure paths. Record evidence, remaining gaps and production next steps. If development deployment was approved, inspect models, agents, tools and traces. Review the exact development environment before any cleanup.</p>
              {execution !== 'agentic-loop-rapid' && <CodeBlock label="Review development resources before cleanup" code="azd env get-values" k="operate-cleanup" copied={copied} onCopy={copy} />}
              {execution === 'agentic-loop-rapid' && <p className="muted">Review the resources recorded in .azure/deployment-plan.md. Do not tear down the pre-existing Foundry project or assume an azd environment exists.</p>}
              <div className="success-banner">
                <Rocket size={16} />
                <div>
                  <strong>A pilot with evidence, not a production certification.</strong>
                  <span> Validate remaining operational, security and customer requirements before production rollout.</span>
                </div>
              </div>
            </div>
          )}
          {copyError && <p role="alert" className="workshop-warning">{copyError}</p>}
        </div>

        <footer className="modal-foot">
          {step === 0
            ? <button className="ghost-btn" onClick={closeModal}>Back to workshop</button>
            : <button className="ghost-btn" onClick={() => setStep(s => Math.max(0, s - 1))}>Back</button>}
          {step < STEPS.length - 1 ? (
            <button className="primary-btn" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
              {STEPS[step + 1].title} <ArrowRight size={14} />
            </button>
          ) : (
            <button className="primary-btn" onClick={closeModal}>Done</button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function PackageBlock(props: { icon: ReactNode; title: string; action: string; copied: boolean; onCopy: () => void; children: string }) {
  return (
    <div className="prompt-preview">
      <div className="prompt-preview-head">
        {props.icon} {props.title}
        <button className="ghost-btn" onClick={props.onCopy}>
          {props.copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> {props.action}</>}
        </button>
      </div>
      <pre>{props.children}</pre>
    </div>
  );
}

function CodeBlock({ label, code, k, copied, onCopy }: { label: string; code: string; k: string; copied: string | null; onCopy: (text: string, key: string) => void }) {
  return (
    <div className="code-block">
      <div className="code-block-head">
        <span>{label}</span>
        <button className="ghost-btn" onClick={() => onCopy(code, k)}>
          {copied === k ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}
