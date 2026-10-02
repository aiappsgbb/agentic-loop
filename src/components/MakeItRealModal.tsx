import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Copy, Terminal, Sparkles, Rocket, ArrowRight, FolderPlus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdvisorPackage } from '../data/advisor';
import { getRunSkill } from '../data/skills';
import { formatWorkshopSpec } from '../data/workshop';

interface Props {
  open: boolean;
  onClose: () => void;
  advisorPackage: AdvisorPackage | null;
}

const STEPS = [
  { id: 'prep', title: 'Prepare your environment', icon: Terminal },
  { id: 'project', title: 'Create your project', icon: FolderPlus },
  { id: 'review', title: 'Review approved spec', icon: Check },
  { id: 'skills', title: 'Choose skills', icon: Sparkles },
  { id: 'loop', title: 'Run the build loop', icon: RefreshCw },
  { id: 'operate', title: 'Review & operate', icon: Rocket },
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

  return createPortal(
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="make-it-real-title">
        <header className="modal-head">
          <div>
            <div className="modal-eyebrow">Customer workshop · Agentic Launchpad</div>
            <h2 id="make-it-real-title">Craft prompt and build hand-off</h2>
            <p>Review the approved scope, prepare local tools, then run the existing loop with review checkpoints. Optional development deployment is not a production rollout.</p>
          </div>
          <button className="icon-btn" onClick={closeModal} aria-label="Close"><X size={16} /></button>
        </header>

        <div className="stepper">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i < step ? 'done' : i === step ? 'current' : 'todo';
            return (
              <button key={s.id} className={`step ${state}`} onClick={() => setStep(i)}>
                <span className="step-bubble">{state === 'done' ? <Check size={14} /> : <Icon size={14} />}</span>
                <span className="step-label">{s.title}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-body">
          {step === 0 && (
            <div className="step-pane">
              <h3>1 · Prepare your environment</h3>
              <p className="muted">Prepare the Copilot toolchain and a development Azure subscription. Check resource and role-assignment permissions, model/region availability and approved sample data before a live workshop. This portal cannot verify your local CLI or subscription readiness.</p>
              <CodeBlock label="Sign in to GitHub & Azure" code="copilot login; az login" k="prep-auth" copied={copied} onCopy={copy} />
              <CodeBlock label="Install the Spec2Cloud plugin" code="copilot plugin marketplace add Azure-Samples/Spec2Cloud && copilot plugin install lean@Spec2Cloud" k="prep-plugin" copied={copied} onCopy={copy} />
              <CodeBlock label="Verify prerequisites" code="gh --version && gh skill --help && az account show && azd auth login --check-status && copilot plugin list" k="prep-check" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 1 && (
            <div className="step-pane">
              <h3>2 · Create your project</h3>
              <p className="muted">Create an empty folder (or a private repo) to hold the loop's artifacts — spec, plan, source, and infra.</p>
              <CodeBlock label="New local folder" code="mkdir my-agentic-app && cd my-agentic-app" k="proj-mkdir" copied={copied} onCopy={copy} />
              <CodeBlock label="…or a private GitHub repo" code="gh repo create my-agentic-app --private --clone && cd my-agentic-app" k="proj-repo" copied={copied} onCopy={copy} />
              <CodeBlock label="Install the required Agentic Loop skill" code="gh skill install aiappsgbb/agentic-loop agentic-loop --agent github-copilot --scope project && gh skill list" k="proj-agentic-loop" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 2 && (
            <div className="step-pane">
              <h3>3 · Review approved brief, scope and specification</h3>
              <p className="muted">This is the source of truth for the final prompt. Close the hand-off to edit it; any upstream change invalidates approval.</p>
              <pre className="workshop-spec">{advisorPackage.workshopSpec ? formatWorkshopSpec(advisorPackage.workshopSpec) : advisorPackage.intent}</pre>
              {advisorPackage.workshopSpec?.execution === 'threadlight-pipeline' && <div className="modal-hint">The shipped Threadlight variant requires awesome-gbb and threadlight-skills. Follow its maintained guide and validate the opinionated infrastructure and deployment scope before execution.</div>}
            </div>
          )}
          {step === 3 && (
            <div className="step-pane">
              <h3>4 · Choose skills</h3>
              <p className="muted"><strong>Build skills</strong> are identified and installed automatically by Copilot while it implements your solution — you don't need to pick them. <strong>Run skills</strong> are reused by the agent at execution time; select the ones you want from the suggestions below and they'll be appended to your prompt.</p>

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

          {step === 4 && (
            <div className="step-pane">
              <h3>5 · Run the build loop</h3>
              <p className="muted">Open Copilot App or CLI in your project. Review Specify and Plan against the approved scope before implementing. The copied prompt uses the chosen maintained workflow: the existing <code>/spec2cloud</code> loop or the shipped <code>threadlight-design</code> skill. Keep permission and review checkpoints enabled; deployment needs separate scope approval.</p>
              <div className="modal-hint">Launch the standalone GitHub Copilot app, then open your project folder.</div>
              <CodeBlock label="…or the Copilot CLI (review permissions)" code="copilot" k="loop-open" copied={copied} onCopy={copy} />
              <PackageBlock icon={<Sparkles size={14} />} title="Initial prompt" action="Copy prompt" copied={copied === 'prompt'} onCopy={() => copy(specPrompt, 'prompt')}>
                {specPrompt}
              </PackageBlock>
            </div>
          )}

          {step === 5 && (
            <div className="step-pane">
              <h3>6 · Review MVP evidence and next steps</h3>
              <p className="muted">Check the approved success criteria, identity boundaries, safe data handling and scenario-specific failure paths. Record evidence, remaining gaps and production next steps. If development deployment was approved, inspect models, agents, tools and traces. Review the exact development environment before any cleanup.</p>
              <CodeBlock label="Review development resources before cleanup" code="azd env get-values" k="operate-cleanup" copied={copied} onCopy={copy} />
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
          <button className="ghost-btn" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          <span className="step-counter">Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button className="primary-btn" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
              Next <ArrowRight size={14} />
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
