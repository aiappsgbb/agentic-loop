import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Rocket, ShieldCheck, GitBranch, Database, Eye, ArrowRight, Layers, Wrench, CloudSun,
  Search, X, Brain, Tag, Mic, Castle, Waypoints, Sparkles,
} from 'lucide-react';
import { playbooks, playbookHasDeck, scenariosForPlaybook } from '../data/links';
import { getBuildSkill, getRunSkill } from '../data/skills';
import CapabilityPicker, { type PickerOption } from '../components/CapabilityPicker';
import LensSwitcher from '../components/LensSwitcher';
import { playbookStage, getStage, type StageId } from '../data/stages';

const STAGE_FILTERS: { id: StageId | null; label: string }[] = [
  { id: null, label: 'All stages' },
  { id: 'build', label: 'Build' },
  { id: 'productionise', label: 'Productionise' },
];

const ICONS: Record<string, typeof Rocket> = {
  Rocket, GitBranch, Database, ShieldCheck, Eye, BookOpen, CloudSun, Mic, Wrench, Castle, Waypoints,
};

function toOptions(values: string[]): PickerOption[] {
  const counts = new Map<string, number>();
  values.forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, label: id, count, icon: Tag }));
}

export default function Playbooks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');
  const stage: StageId | null = stageParam === 'build' || stageParam === 'productionise' ? stageParam : null;
  const setStage = (id: StageId | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('stage', id); else next.delete('stage');
    setSearchParams(next, { replace: true });
  };
  const [query, setQuery] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [caps, setCaps] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);

  const levelOptions = useMemo(() => toOptions(playbooks.map(p => p.level)), []);
  const capOptions = useMemo(() => toOptions(playbooks.flatMap(p => p.capabilities ?? [])), []);
  const blockOptions = useMemo(() => toOptions(playbooks.flatMap(p => p.building_blocks ?? [])), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return playbooks.filter(p => {
      if (stage && playbookStage(p.slug) !== stage) return false;
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
      return true;
    });
  }, [query, levels, caps, blocks, stage]);

  const activeCount = levels.length + caps.length + blocks.length + (query.trim() ? 1 : 0) + (stage ? 1 : 0);
  const clearAll = () => { setQuery(''); setLevels([]); setCaps([]); setBlocks([]); setStage(null); };

  return (
    <>
      <div className="page-head">
        <LensSwitcher />
        <h1>Start from an architecture pattern.</h1>
        <p className="lede">
          Pick the pattern your solution needs, such as grounding, multi-agent orchestration, governance, evaluation or voice, then follow a step-by-step guide to building it on Azure.
          <strong> Build</strong> playbooks get a working agent; <strong>Productionise</strong> playbooks make it safe to run.
        </p>
      </div>

      <div className="stage-filter" role="tablist" aria-label="Filter by stage">
        {STAGE_FILTERS.map(f => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={stage === f.id}
            className={`stage-filter-pill ${f.id ? `stage-${f.id}` : ''} ${stage === f.id ? 'active' : ''}`}
            onClick={() => setStage(f.id)}
          >
            {f.label}
            <span className="facet-count">{f.id ? playbooks.filter(p => playbookStage(p.slug) === f.id).length : playbooks.length}</span>
          </button>
        ))}
      </div>

      <div className="playbook-filters">
        <div className="search-input">
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search playbooks" aria-label="Search playbooks" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <CapabilityPicker label="Level" options={levelOptions} selected={levels} onChange={setLevels} triggerIcon={Layers} />
        <CapabilityPicker label="Capabilities" options={capOptions} selected={caps} onChange={setCaps} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={blockOptions} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
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
                  <div className="playbook-skill-col">
                    <span className="playbook-skill-label"><Wrench size={13} /> Build SKILLs:</span>
                    <div className="advisor-chip-list compact">
                      {(p.buildSkills ?? []).slice(0, 6).map(skill => (
                        getBuildSkill(skill)
                          ? (
                            <Link
                              key={skill}
                              to={`/skills/${skill}`}
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
                  <div className="playbook-skill-col">
                    <span className="playbook-skill-label"><Rocket size={13} /> Run SKILLs:</span>
                    {(p.runSkills ?? []).length > 0 ? (
                      <div className="advisor-chip-list compact">
                        {(p.runSkills ?? []).slice(0, 6).map(skill => (
                          getRunSkill(skill)
                            ? (
                              <Link
                                key={skill}
                                to={`/skills/${skill}`}
                                className="skill-pill run skill-pill-link"
                                onClick={e => e.stopPropagation()}
                              >
                                {skill}
                              </Link>
                            )
                            : <span key={skill} className="skill-pill run">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="playbook-skill-empty">Run SKILLs are generated during the build phase.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="meta">
                <span className={`stage-pill stage-${playbookStage(p.slug)}`}>{getStage(playbookStage(p.slug)).name}</span>
                {p.accelerator && (
                  <span className="playbook-accelerator"><Sparkles size={11} /> Accelerator</span>
                )}
                <span className="difficulty">{p.level}</span>
                <span className="playbook-kind">Guide</span>
                {interactive && <span className="playbook-open">Open <ArrowRight size={12} /></span>}
              </div>
            </>
          );
          return interactive ? (
            <Link key={p.slug} to={`/playbooks/${p.slug}`} className={`playbook-row interactive${p.accelerator ? ' playbook-row--accelerator' : ''}`}>
              {inner}
            </Link>
          ) : (
            <div key={p.slug} className={`playbook-row${p.accelerator ? ' playbook-row--accelerator' : ''}`}>{inner}</div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="playbook-empty">No playbooks match your search and filters.</p>
      )}
    </>
  );
}
