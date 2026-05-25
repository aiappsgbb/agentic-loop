import { Link } from 'react-router-dom';
import { BookOpen, Rocket, ShieldCheck, GitBranch, Database, Eye } from 'lucide-react';

interface PlaybookEntry {
  icon: typeof Rocket;
  name: string;
  description: string;
  steps: number;
  level: string;
  slug?: string;
}

const PLAYBOOKS: PlaybookEntry[] = [
  { icon: Rocket, name: 'Getting started', description: 'Spin up a simple Weather Agent powered by Foundry Hosted Agents.', steps: 6, level: 'Starter', slug: 'getting-started' },
  { icon: GitBranch, name: 'Multi-Agent Orchestration', description: 'Design a planner-executor topology with hand-offs, shared memory, and budget controls.', steps: 9, level: 'Intermediate' },
  { icon: Database, name: 'Enterprise Knowledge Grounding', description: 'Bring your data into Foundry with hybrid retrieval, ACL-aware indexing, and citations.', steps: 7, level: 'Intermediate' },
  { icon: ShieldCheck, name: 'Governance & Safety Baseline', description: 'Wire content safety, policy guardrails, jailbreak detection, and red-team evals from day one.', steps: 8, level: 'Advanced' },
  { icon: Eye, name: 'Continuous Evaluation Loop', description: 'Move from offline scoring to production traces, regression sets, and automated improvement PRs.', steps: 10, level: 'Advanced' },
  { icon: BookOpen, name: 'Voice-First Agent Blueprint', description: 'Combine real-time STT, TTS, and frontier reasoning for low-latency conversational experiences.', steps: 6, level: 'Intermediate' },
];

export default function Playbooks() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Playbooks</div>
        <h1>Opinionated paths to production.</h1>
        <p className="lede">
          Curated, step-by-step guides that combine GitHub Copilot for development with Microsoft Foundry for runtime — so your team always has a paved road.
        </p>
      </div>
      <div className="playbook-list">
        {PLAYBOOKS.map(p => {
          const inner = (
            <>
              <div className="ic"><p.icon size={20} /></div>
              <div>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </div>
              <div className="meta">
                <span className="difficulty">{p.level}</span>
                <span>{p.steps} steps</span>
              </div>
            </>
          );
          return p.slug ? (
            <Link key={p.name} to={`/playbooks/${p.slug}`} className="playbook-row interactive">
              {inner}
            </Link>
          ) : (
            <div key={p.name} className="playbook-row">{inner}</div>
          );
        })}
      </div>
    </>
  );
}
