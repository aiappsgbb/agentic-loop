import { Link } from 'react-router-dom';
import {
  BookOpen, Rocket, ShieldCheck, GitBranch, Database, Eye, ArrowRight, Layers, Wrench, Cloud, Workflow,
} from 'lucide-react';
import { playbooks, playbookHasDeck, scenariosForPlaybook } from '../data/links';

const ICONS: Record<string, typeof Rocket> = {
  Rocket, GitBranch, Database, ShieldCheck, Eye, BookOpen, Workflow, Layers,
};

export default function Playbooks() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Playbooks · the HOW</div>
        <h1>Master a reusable technique.</h1>
        <p className="lede">
          Playbooks are horizontal, step-by-step guides to a single capability — grounding, orchestration, governance, evaluation, voice. Combine several and you get a <Link to="/scenarios">Scenario</Link>. Use a playbook when you want to learn <em>how</em> to do one thing well.
        </p>
      </div>

      <div className="playbook-list">
        {playbooks.map(p => {
          const Icon = ICONS[p.icon] ?? BookOpen;
          const usedIn = scenariosForPlaybook(p, 3);
          const totalUsedIn = scenariosForPlaybook(p).length;
          const interactive = playbookHasDeck(p.slug);
          const inner = (
            <>
              <div className="ic"><Icon size={20} /></div>
              <div className="playbook-row-main">
                <h3>{p.name}</h3>
                <p>{p.summary}</p>
                <p className="playbook-use-when"><strong>Use when:</strong> {p.use_when}</p>
                {usedIn.length > 0 && (
                  <div className="playbook-backlinks">
                    <span className="playbook-backlinks-label"><Layers size={12} /> Used in {totalUsedIn} scenarios:</span>
                    {usedIn.map(s => (
                      <Link
                        key={s.id}
                        to={`/scenarios/${s.id}`}
                        className="playbook-scenario-chip"
                        onClick={e => e.stopPropagation()}
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="playbook-skill-bindings">
                  <div>
                    <span className="playbook-skill-label"><Wrench size={13} /> Build SKILLs</span>
                    <div className="advisor-chip-list compact">
                      {(p.buildSkills ?? []).slice(0, 4).map(skill => <span key={skill} className="skill-pill">{skill}</span>)}
                    </div>
                  </div>
                  <div>
                    <span className="playbook-skill-label"><Cloud size={13} /> Deployment SKILLs</span>
                    <div className="advisor-chip-list compact">
                      {(p.deploymentSkills ?? []).slice(0, 4).map(skill => <span key={skill} className="skill-pill run">{skill}</span>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="meta">
                <span className="difficulty">{p.level}</span>
                <span>{p.steps} steps</span>
                {interactive && <span className="playbook-open">Open <ArrowRight size={12} /></span>}
              </div>
            </>
          );
          return interactive ? (
            <Link key={p.slug} to={`/playbooks/${p.slug}`} className="playbook-row interactive">
              {inner}
            </Link>
          ) : (
            <div key={p.slug} className="playbook-row">{inner}</div>
          );
        })}
      </div>
    </>
  );
}
