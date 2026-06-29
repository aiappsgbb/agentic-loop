import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Rocket, ShieldCheck, GitBranch, Database, Eye, ArrowRight, Layers, Wrench, CloudSun,
  Search, X, Brain, Workflow, Tag,
} from 'lucide-react';
import { playbooks, playbookHasDeck, scenariosForPlaybook } from '../data/links';
import { getBuildSkill } from '../data/skills';
import CapabilityPicker, { type PickerOption } from '../components/CapabilityPicker';

const ICONS: Record<string, typeof Rocket> = {
  Rocket, GitBranch, Database, ShieldCheck, Eye, BookOpen, CloudSun,
};

function toOptions(values: string[]): PickerOption[] {
  return [...new Set(values)].sort().map(v => ({ id: v, label: v, icon: Tag }));
}

export default function Playbooks() {
  const [query, setQuery] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [caps, setCaps] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [pats, setPats] = useState<string[]>([]);

  const levelOptions = useMemo(() => toOptions(playbooks.map(p => p.level)), []);
  const capOptions = useMemo(() => toOptions(playbooks.flatMap(p => p.capabilities ?? [])), []);
  const blockOptions = useMemo(() => toOptions(playbooks.flatMap(p => p.building_blocks ?? [])), []);
  const patternOptions = useMemo(
    () => toOptions(playbooks.flatMap(p => p.patterns ?? []).filter(x => x !== '*')),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return playbooks.filter(p => {
      if (q) {
        const hay = [
          p.name, p.summary, p.use_when,
          ...(p.patterns ?? []), ...(p.capabilities ?? []), ...(p.building_blocks ?? []),
          ...(p.buildSkills ?? []),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (levels.length && !levels.includes(p.level)) return false;
      if (caps.length && !caps.some(c => (p.capabilities ?? []).includes(c))) return false;
      if (blocks.length && !blocks.some(b => (p.building_blocks ?? []).includes(b))) return false;
      if (pats.length) {
        const pp = p.patterns ?? [];
        if (!(pp.includes('*') || pats.some(x => pp.includes(x)))) return false;
      }
      return true;
    });
  }, [query, levels, caps, blocks, pats]);

  const activeCount = levels.length + caps.length + blocks.length + pats.length + (query.trim() ? 1 : 0);
  const clearAll = () => { setQuery(''); setLevels([]); setCaps([]); setBlocks([]); setPats([]); };

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Playbooks · the HOW</div>
        <h1>Master a reusable pattern.</h1>
        <p className="lede">
          Playbooks are horizontal, step-by-step guides to a single capability — grounding, orchestration, governance, evaluation, voice. Combine several and you get a <Link to="/scenarios">Scenario</Link>. Use a playbook when you want to learn <em>how</em> to do one thing well.
        </p>
      </div>

      <div className="playbook-filters">
        <div className="search-input">
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search playbooks" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <CapabilityPicker label="Level" options={levelOptions} selected={levels} onChange={setLevels} triggerIcon={Layers} />
        <CapabilityPicker label="Capabilities" options={capOptions} selected={caps} onChange={setCaps} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={blockOptions} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
        <CapabilityPicker label="Patterns" options={patternOptions} selected={pats} onChange={setPats} triggerIcon={Workflow} />
        {activeCount > 0 && (
          <button className="playbook-filter-clear" type="button" onClick={clearAll}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <div className="playbook-list">
        {filtered.map(p => {
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
                  <span className="playbook-skill-label"><Wrench size={13} /> Build SKILLs:</span>
                  <div className="advisor-chip-list compact">
                    {(p.buildSkills ?? []).slice(0, 6).map(skill => (
                      getBuildSkill(skill)
                        ? (
                          <Link
                            key={skill}
                            to={`/skills/${skill}/SKILL.md`}
                            className="skill-pill skill-pill-link"
                            onClick={e => e.stopPropagation()}
                          >
                            {skill}
                          </Link>
                        )
                        : <span key={skill} className="skill-pill">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="meta">
                <span className="difficulty">{p.level}</span>
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

      {filtered.length === 0 && (
        <p className="playbook-empty">No playbooks match your search and filters.</p>
      )}
    </>
  );
}
