import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hammer, Rocket, Search, BookOpen, ArrowUpRight,
} from 'lucide-react';
import { BUILD_SKILLS, RUN_SKILLS } from '../data/skills';
import type { BuildSkill, RunSkill } from '../data/skills';

type Phase = 'build' | 'run';

export default function SkillsCatalog() {
  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | Phase>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set([
      ...BUILD_SKILLS.map(s => s.category),
      ...RUN_SKILLS.map(s => s.category),
    ]))],
    [],
  );

  const buildSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUILD_SKILLS.filter(s => {
      if (phaseFilter === 'run') return false;
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || s.category.toLowerCase().includes(q)
        || s.repo.toLowerCase().includes(q)
        || s.id.toLowerCase().includes(q);
    });
  }, [query, phaseFilter, categoryFilter]);

  const runSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RUN_SKILLS.filter(s => {
      if (phaseFilter === 'build') return false;
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || s.category.toLowerCase().includes(q)
        || s.repo.toLowerCase().includes(q)
        || s.id.toLowerCase().includes(q);
    });
  }, [query, phaseFilter, categoryFilter]);

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Skills catalog · Reference</div>
        <h1>Agent Skills that powers the Agentic Loop.</h1>
        <p className="lede">
          Browse the skills that GitHub Copilot use on the <strong>build</strong> phase and that Microsoft Foundry hosted agents use on the <strong>run</strong> phase. One consistent contract, two sides of the loop.
        </p>
      </div>

      <div className="catalog-toolbar">
        <div className="search-input catalog-search">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search skills, repos, or categories"
            aria-label="Search skills, repos, or categories"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="chip-group catalog-chips" role="tablist">
          {(['all', 'build', 'run'] as const).map(p => (
            <button
              key={p}
              className={`chip ${phaseFilter === p ? 'active' : ''}`}
              onClick={() => setPhaseFilter(p)}
            >
              {p === 'all' ? 'All phases' : p === 'build' ? 'Build' : 'Run'}
            </button>
          ))}
        </div>
        <div className="chip-group catalog-chips" role="tablist">
          {categories.map(c => (
            <button
              key={c}
              className={`chip ${categoryFilter === c ? 'active' : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="catalog-phase">
        <div className="catalog-phase-head">
          <div className="catalog-phase-icon build"><Hammer size={18} /></div>
          <div>
            <div className="catalog-phase-eyebrow">Build phase</div>
            <h2>GitHub Copilot · authoring, grounding, and shipping agents.</h2>
            <p>The skills the loop installs while you build — agent frameworks, Azure building blocks, and deployment. Open one to read its <code>SKILL.md</code>.</p>
          </div>
          <span className="catalog-count">{buildSkills.length}</span>
        </div>
        {buildSkills.length === 0 ? (
          <div className="catalog-empty">No build skills match your filters.</div>
        ) : (
          <div className="catalog-grid">
            {buildSkills.map(s => <BuildSkillCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="catalog-phase">
        <div className="catalog-phase-head">
          <div className="catalog-phase-icon run"><Rocket size={18} /></div>
          <div>
            <div className="catalog-phase-eyebrow">Run phase</div>
            <h2>Microsoft Foundry · skills the agent runs at execution time.</h2>
            <p>Reusable run-phase skills the agent invokes while serving users. When a prompt explicitly names one, the loop reuses it instead of authoring a new one — then versions it on Foundry and attaches it to the toolbox.</p>
          </div>
          <span className="catalog-count">{runSkills.length}</span>
        </div>
        {runSkills.length === 0 ? (
          <div className="catalog-empty">No run skills match your filters.</div>
        ) : (
          <div className="catalog-grid">
            {runSkills.map(s => <RunSkillCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="catalog-cta">
        <BookOpen size={18} />
        <div>
          <strong>New to the catalog?</strong> Start with a playbook — it threads the right skills together for a specific outcome.
        </div>
      </section>
    </>
  );
}

function BuildSkillCard({ s }: { s: BuildSkill }) {
  const Icon = s.icon;
  return (
    <Link to={`/skills/${s.id}`} className="skill-card phase-build skill-card-link">
      <div className="skill-card-head">
        <div className="skill-card-icon"><Icon size={18} /></div>
        <ArrowUpRight size={16} className="skill-card-open" />
      </div>
      <h3>{s.id}</h3>
      <p>{s.description}</p>
      <div className="skill-card-foot">
        <span className="skill-surface">{s.repo}</span>
        <span className="skill-dot">·</span>
        <span className="skill-category">{s.category}</span>
      </div>
    </Link>
  );
}

function RunSkillCard({ s }: { s: RunSkill }) {
  const Icon = s.icon;
  return (
    <Link to={`/skills/${s.id}`} className="skill-card phase-run skill-card-link">
      <div className="skill-card-head">
        <div className="skill-card-icon"><Icon size={18} /></div>
        <ArrowUpRight size={16} className="skill-card-open" />
      </div>
      <h3>{s.id}</h3>
      <p>{s.description}</p>
      <div className="skill-card-foot">
        <span className="skill-surface">{s.repo || 'Reused skill'}</span>
        <span className="skill-dot">·</span>
        <span className="skill-category">{s.category}</span>
      </div>
    </Link>
  );
}
