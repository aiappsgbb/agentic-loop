import { useEffect, useState } from 'react';
import { X, Check, Copy, Code as Github, Terminal, Sparkles, Rocket, ArrowRight, Cloud, BookOpen, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdvisorPackage } from '../data/advisor';

interface Props {
  open: boolean;
  onClose: () => void;
  advisorPackage: AdvisorPackage | null;
}

const STEPS = [
  { id: 'prep', title: 'Prepare your workspace', icon: Terminal },
  { id: 'skills', title: 'Install package skills', icon: Sparkles },
  { id: 'copilot', title: 'Hand off to GitHub Copilot', icon: Github },
  { id: 'foundry', title: 'Deploy with azd up', icon: Cloud },
];

export default function MakeItRealModal({ open, onClose, advisorPackage }: Props) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, open]);

  if (!open || !advisorPackage) return null;

  function closeModal() {
    setStep(0);
    setInstalled({});
    onClose();
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch (error) {
      console.warn('Clipboard copy failed', error);
    }
  }

  const installCmd = (s: string) => `gh copilot skills add ${s}`;
  const allSkills = [...advisorPackage.buildSkills, ...advisorPackage.deploymentSkills];
  const allInstalled = allSkills.length > 0 && allSkills.every(s => installed[s]);
  const architectureChecklist = advisorPackage.runArchitecture.map(item => `- [ ] ${item}`).join('\n');
  const playbookList = advisorPackage.playbooks.map(p => `- ${p.name}: ${p.summary}`).join('\n');

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <div className="modal-eyebrow">Generated package · {advisorPackage.path === 'scenario' ? 'Scenario Advisor' : 'Production Launchpad'}</div>
            <h2>Make it real</h2>
            <p>Install the existing upstream skills, copy the Copilot prompt, and deploy the generated package with <code>azd up</code>.</p>
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
              <h3>1 · Prepare your workspace</h3>
              <p className="muted">Open the repository where this agentic solution will live. The package is text-only here; Copilot will create the deployable code and infrastructure.</p>
              <CodeBlock label="Install Copilot CLI" code="winget install GitHub.cli && gh extension install github/gh-copilot" k="prep-1" copied={copied} onCopy={copy} />
              <CodeBlock label="Sign in" code="gh auth login && gh copilot auth" k="prep-2" copied={copied} onCopy={copy} />
              <CodeBlock label="Open your repo" code="cd path\\to\\your\\repo && code ." k="prep-3" copied={copied} onCopy={copy} />
            </div>
          )}

          {step === 1 && (
            <div className="step-pane">
              <h3>2 · Install the package skills</h3>
              <p className="muted">Build SKILLs create the solution. Deployment SKILLs make it deployable with Azure Developer CLI.</p>
              <div className="skill-install-grid">
                <SkillColumn
                  title="Build SKILLs"
                  subtitle="Create code, tools, agents, APIs, and schemas"
                  skills={advisorPackage.buildSkills}
                  installed={installed}
                  copied={copied}
                  installCmd={installCmd}
                  onToggle={skill => setInstalled(p => ({ ...p, [skill]: !p[skill] }))}
                  onCopy={(skill, cmd) => copy(cmd, skill)}
                />
                <SkillColumn
                  title="Deployment SKILLs"
                  subtitle="Create azd, Bicep, containers, security, and observability"
                  skills={advisorPackage.deploymentSkills}
                  installed={installed}
                  copied={copied}
                  installCmd={installCmd}
                  onToggle={skill => setInstalled(p => ({ ...p, [skill]: !p[skill] }))}
                  onCopy={(skill, cmd) => copy(cmd, skill)}
                />
              </div>
              <p className="muted" style={{ marginTop: 12 }}>
                {allInstalled ? 'All package skills marked installed — ready to hand off to Copilot.' : `${Object.values(installed).filter(Boolean).length} of ${allSkills.length} marked installed`}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="step-pane">
              <h3>3 · Hand off to GitHub Copilot</h3>
              <p className="muted">The prompt carries intent, requirements, playbooks, Build SKILLs, Deployment SKILLs, and run architecture recommendations.</p>
              <CodeBlock label="Open Copilot" code="copilot" k="copilot-cmd" copied={copied} onCopy={copy} />
              <PackageBlock icon={<Sparkles size={14} />} title="Copilot prompt" action="Copy prompt" copied={copied === 'prompt'} onCopy={() => copy(advisorPackage.copilotPrompt, 'prompt')}>
                {advisorPackage.copilotPrompt}
              </PackageBlock>
              <PackageBlock icon={<BookOpen size={14} />} title="Selected playbooks" action="Copy playbooks" copied={copied === 'playbooks'} onCopy={() => copy(playbookList, 'playbooks')}>
                {playbookList}
              </PackageBlock>
            </div>
          )}

          {step === 3 && (
            <div className="step-pane">
              <h3>4 · Deploy with azd up</h3>
              <p className="muted">Deployment SKILLs should create or validate these architecture pieces before Azure deployment.</p>
              <PackageBlock icon={<Wrench size={14} />} title="Architecture checklist" action="Copy checklist" copied={copied === 'architecture'} onCopy={() => copy(architectureChecklist, 'architecture')}>
                {architectureChecklist}
              </PackageBlock>
              <CodeBlock label="Canonical deploy command" code={advisorPackage.deploymentCommand} k="foundry-2" copied={copied} onCopy={copy} />
              <div className="success-banner">
                <Rocket size={16} />
                <div>
                  <strong>You're in the loop.</strong>
                  <span> Copilot builds the package; Foundry and Azure run it with governance, telemetry, and evals.</span>
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
    </div>
  );
}

function SkillColumn(props: {
  title: string;
  subtitle: string;
  skills: string[];
  installed: Record<string, boolean>;
  copied: string | null;
  installCmd: (skill: string) => string;
  onToggle: (skill: string) => void;
  onCopy: (skill: string, cmd: string) => void;
}) {
  return (
    <div>
      <div className="skill-install-title">{props.title} <span>{props.subtitle}</span></div>
      {props.skills.map(skill => {
        const cmd = props.installCmd(skill);
        return (
          <SkillRow
            key={skill}
            skill={skill}
            cmd={cmd}
            installed={!!props.installed[skill]}
            onToggle={() => props.onToggle(skill)}
            onCopy={() => props.onCopy(skill, cmd)}
            copied={props.copied === skill}
          />
        );
      })}
    </div>
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
