import { useEffect, useState } from 'react';
import { X, Check, Copy, Code as Github, Terminal, Sparkles, Rocket, ArrowRight, Cloud } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  prompt: string;
  buildSkills: string[];
  runSkills: string[];
}

const STEPS = [
  { id: 'prep',    title: 'Prepare your workspace', icon: Terminal },
  { id: 'skills',  title: 'Install suggested skills', icon: Sparkles },
  { id: 'copilot', title: 'Hand off to GitHub Copilot', icon: Github },
  { id: 'foundry', title: 'Deploy to Microsoft Foundry', icon: Cloud },
];

export default function MakeItRealModal({ open, onClose, prompt, buildSkills, runSkills }: Props) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setInstalled({});
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch { /* ignore */ }
  }

  const installCmd = (s: string) => `gh copilot skills add ${s}`;
  const allSkills = [...buildSkills, ...runSkills];
  const allInstalled = allSkills.every(s => installed[s]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <div className="modal-eyebrow">Guided setup</div>
            <h2>Make it real</h2>
            <p>We'll walk you through installing the right skills and starting the build with GitHub Copilot.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
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
              <h3>1 · Prepare your workspace</h3>
              <p className="muted">Install the GitHub Copilot CLI and sign in. Open the repository where your agent will live.</p>
              <CodeBlock label="Install Copilot CLI" code="winget install GitHub.cli && gh extension install github/gh-copilot" k="prep-1" copied={copied} onCopy={copy} />
              <CodeBlock label="Sign in" code="gh auth login && gh copilot auth" k="prep-2" copied={copied} onCopy={copy} />
              <CodeBlock label="Open your repo" code="cd path/to/your/repo && code ." k="prep-3" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 1 && (
            <div className="step-pane">
              <h3>2 · Install the suggested skills</h3>
              <p className="muted">These skills will be wired into your repo by Copilot and hosted by Foundry at runtime. Click each one to mark it installed, or copy the command.</p>
              <div className="skill-install-grid">
                <div>
                  <div className="skill-install-title">Build skills <span>(GitHub Copilot)</span></div>
                  {buildSkills.map(s => (
                    <SkillRow key={s} skill={s} cmd={installCmd(s)} installed={!!installed[s]}
                      onToggle={() => setInstalled(p => ({ ...p, [s]: !p[s] }))}
                      onCopy={() => copy(installCmd(s), s)} copied={copied === s} />
                  ))}
                </div>
                <div>
                  <div className="skill-install-title">Run skills <span>(Microsoft Foundry)</span></div>
                  {runSkills.map(s => (
                    <SkillRow key={s} skill={s} cmd={installCmd(s)} installed={!!installed[s]}
                      onToggle={() => setInstalled(p => ({ ...p, [s]: !p[s] }))}
                      onCopy={() => copy(installCmd(s), s)} copied={copied === s} />
                  ))}
                </div>
              </div>
              <p className="muted" style={{ marginTop: 12 }}>
                {allInstalled ? '✓ All skills installed — ready to hand off to Copilot.' : `${Object.values(installed).filter(Boolean).length} of ${allSkills.length} installed`}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="step-pane">
              <h3>3 · Hand off to GitHub Copilot</h3>
              <p className="muted">Copy your crafted prompt and paste it into the Copilot window. Copilot will use the suggested skills to create a spec for the specified intent and start the implementation.</p>
              <CodeBlock label="Open Copilot" code="copilot" k="copilot-cmd" copied={copied} onCopy={copy} />
              {(() => {
                const craftedPrompt = prompt ? `/lean:implement ${prompt}` : '';
                return (
                  <div className="prompt-preview">
                    <div className="prompt-preview-head">
                      <Sparkles size={14} /> Your crafted prompt
                      <button className="ghost-btn" onClick={() => copy(craftedPrompt, 'prompt')} disabled={!craftedPrompt}>
                        {copied === 'prompt' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy prompt</>}
                      </button>
                    </div>
                    <pre>{craftedPrompt || 'Describe your agent in the textbox to generate a prompt.'}</pre>
                  </div>
                );
              })()}
            </div>
          )}

          {step === 3 && (
            <div className="step-pane">
              <h3>4 · Deploy to Microsoft Foundry</h3>
              <p className="muted">Once implementation is done, deploy with one command. All Azure resources will be provisioned and the code will be deployed.</p>
              <CodeBlock label="Copilot prompt" code="/lean:deploy" k="foundry-1" copied={copied} onCopy={copy} />
              <CodeBlock label="OR run it directly in your CLI." code="azd up" k="foundry-2" copied={copied} onCopy={copy} />
              <div className="success-banner">
                <Rocket size={16} />
                <div>
                  <strong>You're in the loop.</strong>
                  <span> Traces will flow back to Copilot as improvement suggestions.</span>
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
            <button className="primary-btn" onClick={onClose}>Done</button>
          )}
        </footer>
      </div>
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

function SkillRow({ skill, cmd, installed, onToggle, onCopy, copied }: { skill: string; cmd: string; installed: boolean; onToggle: () => void; onCopy: () => void; copied: boolean }) {
  return (
    <div className={`skill-row ${installed ? 'is-installed' : ''}`}>
      <button className="skill-check" onClick={onToggle} aria-label={installed ? 'Mark uninstalled' : 'Mark installed'}>
        {installed && <Check size={12} />}
      </button>
      <div className="skill-info">
        <span className="skill-name">{skill}</span>
        <code className="skill-cmd">{cmd}</code>
      </div>
      <button className="ghost-btn" onClick={onCopy}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}
