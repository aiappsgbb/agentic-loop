import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Copy, Terminal, Sparkles, Rocket, ArrowRight, FolderPlus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdvisorPackage } from '../data/advisor';
import { getRunSkill } from '../data/skills';

interface Props {
  open: boolean;
  onClose: () => void;
  advisorPackage: AdvisorPackage | null;
}

const STEPS = [
  { id: 'prep', title: 'Prepare your environment', icon: Terminal },
  { id: 'project', title: 'Create your project', icon: FolderPlus },
  { id: 'skills', title: 'Choose skills', icon: Sparkles },
  { id: 'loop', title: 'Run the build loop', icon: RefreshCw },
  { id: 'operate', title: 'Review & operate', icon: Rocket },
];

export default function MakeItRealModal({ open, onClose, advisorPackage }: Props) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedRunSkills, setSelectedRunSkills] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what had focus so we can restore it when the modal closes.
    triggerRef.current = document.activeElement as HTMLElement | null;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
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

  // Reset run-skill selection (unselected by default) whenever the package changes.
  useEffect(() => {
    if (!open || !advisorPackage) return;
    setSelectedRunSkills([]);
  }, [open, advisorPackage]);

  if (!open || !advisorPackage) return null;

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
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Clipboard copy failed', error);
    }
  }

  const runSkillIds = new Set<string>();
  advisorPackage.playbooks.forEach(p => (p.runSkills ?? []).forEach(s => { if (getRunSkill(s)) runSkillIds.add(s); }));
  const availableRunSkills = [...runSkillIds];

  const chosenRunSkills = availableRunSkills.filter(s => selectedRunSkills.includes(s));
  const runSkillsLine = chosenRunSkills.length
    ? `\n\nUse the following skills when running the agent(s): ${chosenRunSkills.join(', ')}.`
    : '';
  const specPrompt = `/spec2cloud ${advisorPackage.intent}${runSkillsLine}`;

  return createPortal(
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="make-it-real-title">
        <header className="modal-head">
          <div>
            <div className="modal-eyebrow">Agentic Launchpad</div>
            <h2 id="make-it-real-title">Make it real</h2>
            <p>Set up the toolchain, run the build loop in Autopilot, and let Copilot ship a governed agentic solution.</p>
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
              <p className="muted">Install the Agentic Loop toolchain and the Spec2Cloud plugin that drives the build loop. You need an Azure subscription with Contributor access and a GitHub Copilot plan.</p>
              <CodeBlock label="Sign in to GitHub & Azure" code="copilot login; az login" k="prep-auth" copied={copied} onCopy={copy} />
              <CodeBlock label="Install the Spec2Cloud plugin" code="copilot plugin marketplace add Azure-Samples/Spec2Cloud && copilot plugin install lean@Spec2Cloud" k="prep-plugin" copied={copied} onCopy={copy} />
              <CodeBlock label="Verify prerequisites" code="az account show && azd auth login --check-status && copilot plugin list" k="prep-check" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 1 && (
            <div className="step-pane">
              <h3>2 · Create your project</h3>
              <p className="muted">Create an empty folder (or a private repo) to hold the loop's artifacts — spec, plan, source, and infra.</p>
              <CodeBlock label="New local folder" code="mkdir my-agentic-app && cd my-agentic-app" k="proj-mkdir" copied={copied} onCopy={copy} />
              <CodeBlock label="…or a private GitHub repo" code="gh repo create my-agentic-app --private --clone && cd my-agentic-app" k="proj-repo" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 2 && (
            <div className="step-pane">
              <h3>3 · Choose skills</h3>
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

          {step === 3 && (
            <div className="step-pane">
              <h3>4 · Run the build loop</h3>
              <p className="muted">Start by opening GitHub Copilot App or the CLI, then add your project and select your preferred coding model in Autopilot mode. Paste your prompt and run the <code>/spec2cloud</code> command to execute the complete workflow: Specify → Plan → Implement → Verify → Deploy. The agentic-loop defaults are pre-configured for seamless execution.</p>
              <div className="modal-hint">Launch the standalone GitHub Copilot app, then open your project folder.</div>
              <CodeBlock label="…or the Copilot CLI (all permissions)" code="copilot --allow-all" k="loop-open" copied={copied} onCopy={copy} />
              <PackageBlock icon={<Sparkles size={14} />} title="Initial prompt" action="Copy prompt" copied={copied === 'prompt'} onCopy={() => copy(specPrompt, 'prompt')}>
                {specPrompt}
              </PackageBlock>
            </div>
          )}

          {step === 4 && (
            <div className="step-pane">
              <h3>5 · Review & operate</h3>
              <p className="muted">When the loop finishes, Copilot returns the deployed frontend URL and previews it. Open the Foundry portal to review models, agents, tools, and traces in Application Insights.</p>
              <CodeBlock label="Clean up when you're done" code="azd down --purge --force" k="operate-cleanup" copied={copied} onCopy={copy} />
              <div className="success-banner">
                <Rocket size={16} />
                <div>
                  <strong>You're in the loop.</strong>
                  <span> Copilot builds the agentic solution; Foundry and Azure runs the agentic loop with governance, telemetry, and evals.</span>
                </div>
              </div>
            </div>
          )}
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
