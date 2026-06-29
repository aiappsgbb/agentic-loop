import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, ArrowRight, ExternalLink,
  LayoutGrid, Rows3, X, Video, ChevronDown, Check, Play,
} from 'lucide-react';
import scenarios from '../data/scenarios.json';
import { asset } from '../data/asset';

interface Scenario {
  id: string; name: string; industry: string; description: string; image: string;
  tags: string[]; capabilities?: string[]; buildingBlocks?: string[]; patterns?: string[];
  runSkills?: string[]; videoFileName?: string; link?: string;
}

function resolveImage(src: string) {
  return asset(src);
}

function prettifySkill(slug: string) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Props { carousel?: boolean; showExplore?: boolean; browse?: boolean; }

type FacetKey = 'industries' | 'tags' | 'capabilities' | 'buildingBlocks' | 'patterns' | 'runSkills';

const EMPTY_FACETS: Record<FacetKey, string[]> = {
  industries: [], tags: [], capabilities: [], buildingBlocks: [], patterns: [], runSkills: [],
};

export default function ScenariosGallery({ carousel = true, showExplore = true, browse = false }: Props) {
  const data = scenarios as Scenario[];
  if (browse) return <ScenariosBrowse data={data} />;
  return <ScenariosCarousel data={data} carousel={carousel} showExplore={showExplore} />;
}

function ScenariosCarousel({ data, carousel, showExplore }: { data: Scenario[]; carousel: boolean; showExplore: boolean }) {
  const industries = useMemo(() => ['All', ...Array.from(new Set(data.map(s => s.industry)))], [data]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [chipScroll, setChipScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    const update = () => {
      setChipScroll({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);

  function scrollChips(dir: 1 | -1) {
    const el = chipsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.7), behavior: 'smooth' });
  }

  const filtered = data.filter(s => {
    const matchIndustry = filter === 'All' || s.industry === filter;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    return matchIndustry && matchQuery;
  });

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>Scenarios</h2>
          <p>Real-world agentic patterns shipped with the Agentic Loop.</p>
        </div>
        <div className="filter-bar">
          <div className="search-input">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search scenarios"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className={`chip-scroller ${chipScroll.left ? 'fade-left' : ''} ${chipScroll.right ? 'fade-right' : ''}`}>
            {chipScroll.left && (
              <button className="chip-nav prev" onClick={() => scrollChips(-1)} aria-label="Previous filters">
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="chip-group" role="tablist" ref={chipsRef}>
              {industries.map(i => (
                <button
                  key={i}
                  className={`chip ${filter === i ? 'active' : ''}`}
                  onClick={() => setFilter(i)}
                >
                  {i}
                </button>
              ))}
            </div>
            {chipScroll.right && (
              <button className="chip-nav next" onClick={() => scrollChips(1)} aria-label="Next filters">
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          {showExplore && (
            <Link to="/scenarios" className="explore-btn">
              Explore <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      <div className="carousel">
        {carousel && filtered.length > 3 && (
          <>
            <button className="carousel-nav prev" onClick={() => scroll(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
            <button className="carousel-nav next" onClick={() => scroll(1)} aria-label="Next"><ChevronRight size={18} /></button>
          </>
        )}
        <div className="carousel-track" ref={trackRef}>
          {filtered.map(s => <ScenarioCard key={s.id} s={s} />)}
          {filtered.length === 0 && (
            <div style={{ padding: 40, color: 'var(--text-muted)' }}>No scenarios match your filters.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScenarioCard({ s }: { s: Scenario }) {
  return (
    <Link to={`/scenarios/${s.id}`} className="scenario-card">
      <div className="scenario-img">
        <span className="scenario-industry">{s.industry}</span>
        {s.videoFileName && <span className="scenario-video-badge"><Video size={12} /> Demo</span>}
        <img src={resolveImage(s.image)} alt={s.name} loading="lazy" />
        {s.videoFileName && <span className="scenario-play-watermark"><Play size={22} /></span>}
      </div>
      <div className="scenario-body">
        <h3>{s.name}</h3>
        <p>{s.description}</p>
        <div className="scenario-tags">
          {s.tags.map(t => <span key={t} className="scenario-tag">{t}</span>)}
        </div>
        {s.link && (
          <button
            type="button"
            className="scenario-learn-more"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.open(s.link, '_blank', 'noopener,noreferrer');
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            Learn more <ExternalLink size={12} />
          </button>
        )}
      </div>
    </Link>
  );
}

function ScenarioRow({ s }: { s: Scenario }) {
  return (
    <Link to={`/scenarios/${s.id}`} className="scenario-row">
      <div className="scenario-row-img">
        <img src={resolveImage(s.image)} alt={s.name} loading="lazy" />
        {s.videoFileName && <span className="scenario-video-badge"><Video size={11} /></span>}
        {s.videoFileName && <span className="scenario-play-watermark"><Play size={18} /></span>}
      </div>
      <div className="scenario-row-body">
        <div className="scenario-row-head">
          <span className="scenario-row-industry">{s.industry}</span>
          <h3>{s.name}</h3>
        </div>
        <p>{s.description}</p>
        <div className="scenario-tags">
          {s.tags.map(t => <span key={t} className="scenario-tag">{t}</span>)}
        </div>
      </div>
      <ArrowRight size={16} className="scenario-row-arrow" />
    </Link>
  );
}

function ScenariosBrowse({ data }: { data: Scenario[] }) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [facets, setFacets] = useState<Record<FacetKey, string[]>>(EMPTY_FACETS);
  const [hasVideo, setHasVideo] = useState(false);

  function toggleFacet(key: FacetKey, val: string) {
    setFacets(prev => {
      const cur = prev[key];
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
      return { ...prev, [key]: next };
    });
  }

  function clearAll() {
    setFacets(EMPTY_FACETS);
    setHasVideo(false);
    setQuery('');
  }

  const facetOptions = useMemo(() => {
    const build = (accessor: (s: Scenario) => string[]) => {
      const counts = new Map<string, number>();
      data.forEach(s => accessor(s).forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1)));
      return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    };
    return {
      industries: build(s => [s.industry]),
      tags: build(s => s.tags ?? []),
      capabilities: build(s => s.capabilities ?? []),
      buildingBlocks: build(s => s.buildingBlocks ?? []),
      patterns: build(s => s.patterns ?? []),
      runSkills: build(s => s.runSkills ?? []),
    };
  }, [data]);

  const filtered = useMemo(() => data.filter(s => {
    const q = query.trim().toLowerCase();
    if (q && !(
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.industry.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    )) return false;
    if (facets.industries.length && !facets.industries.includes(s.industry)) return false;
    if (facets.tags.length && !s.tags.some(t => facets.tags.includes(t))) return false;
    if (facets.capabilities.length && !(s.capabilities ?? []).some(t => facets.capabilities.includes(t))) return false;
    if (facets.buildingBlocks.length && !(s.buildingBlocks ?? []).some(t => facets.buildingBlocks.includes(t))) return false;
    if (facets.patterns.length && !(s.patterns ?? []).some(t => facets.patterns.includes(t))) return false;
    if (facets.runSkills.length && !(s.runSkills ?? []).some(t => facets.runSkills.includes(t))) return false;
    if (hasVideo && !s.videoFileName) return false;
    return true;
  }), [data, query, facets, hasVideo]);

  const activeCount =
    Object.values(facets).reduce((n, arr) => n + arr.length, 0) + (hasVideo ? 1 : 0);

  return (
    <section className="section scenarios-browse">
      <div className="browse-toolbar">
        <div className="search-input">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search scenarios"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="browse-actions">
          <button
            className={`facet-trigger toggle ${hasVideo ? 'has-active' : ''}`}
            onClick={() => setHasVideo(v => !v)}
            aria-pressed={hasVideo}
          >
            <Video size={14} /> Demo available
            <span className="facet-count">{data.filter(s => s.videoFileName).length}</span>
          </button>
          <div className="view-toggle" role="tablist" aria-label="View">
            <button
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
              aria-label="List view"
              title="List view"
            >
              <Rows3 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="browse-filters">
        <FacetDropdown label="Industry" options={facetOptions.industries} selected={facets.industries} onToggle={v => toggleFacet('industries', v)} />
        <FacetDropdown label="Tags" options={facetOptions.tags} selected={facets.tags} onToggle={v => toggleFacet('tags', v)} />
        <FacetDropdown label="Capabilities" options={facetOptions.capabilities} selected={facets.capabilities} onToggle={v => toggleFacet('capabilities', v)} />
        <FacetDropdown label="Building blocks" options={facetOptions.buildingBlocks} selected={facets.buildingBlocks} onToggle={v => toggleFacet('buildingBlocks', v)} />
        <FacetDropdown label="Patterns" options={facetOptions.patterns} selected={facets.patterns} onToggle={v => toggleFacet('patterns', v)} />
        <FacetDropdown label="Run skills" options={facetOptions.runSkills} selected={facets.runSkills} onToggle={v => toggleFacet('runSkills', v)} format={prettifySkill} />
        {activeCount > 0 && (
          <button className="clear-filters" onClick={clearAll}>
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      <div className="browse-meta">
        <span>{filtered.length} {filtered.length === 1 ? 'scenario' : 'scenarios'}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="browse-empty">No scenarios match your filters.</div>
      ) : view === 'grid' ? (
        <div className="scenario-grid">
          {filtered.map(s => <ScenarioCard key={s.id} s={s} />)}
        </div>
      ) : (
        <div className="scenario-list">
          {filtered.map(s => <ScenarioRow key={s.id} s={s} />)}
        </div>
      )}
    </section>
  );
}

function FacetDropdown({ label, options, selected, onToggle, format }: {
  label: string;
  options: [string, number][];
  selected: string[];
  onToggle: (val: string) => void;
  format?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="facet-dropdown" ref={ref}>
      <button
        className={`facet-trigger ${selected.length ? 'has-active' : ''} ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        {selected.length > 0
          ? <span className="facet-trigger-count">{selected.length}</span>
          : <span className="facet-trigger-any">Any</span>}
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div className="facet-menu" role="listbox">
          {options.map(([val, count]) => {
            const isSel = selected.includes(val);
            return (
              <div
                key={val}
                className={`facet-option ${isSel ? 'selected' : ''}`}
                role="option"
                aria-selected={isSel}
                onClick={() => onToggle(val)}
              >
                <span className="facet-check">{isSel && <Check size={12} />}</span>
                <span className="facet-option-label">{format ? format(val) : val}</span>
                <span className="facet-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
