import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';
import scenarios from '../data/scenarios.json';

interface Scenario {
  id: string; name: string; industry: string; description: string; image: string; tags: string[]; link?: string;
}

function resolveImage(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  return '/' + src;
}

interface Props { carousel?: boolean; showExplore?: boolean; }

export default function ScenariosGallery({ carousel = true, showExplore = true }: Props) {
  const data = scenarios as Scenario[];
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
          {filtered.map(s => (
            <Link to={`/scenarios/${s.id}`} key={s.id} className="scenario-card">
              <div className="scenario-img">
                <span className="scenario-industry">{s.industry}</span>
                <img src={resolveImage(s.image)} alt={s.name} loading="lazy" />
              </div>
              <div className="scenario-body">
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="scenario-tags">
                  {s.tags.map(t => <span key={t} className="scenario-tag">{t}</span>)}
                </div>
                {s.link && (
                  <a
                    className="scenario-learn-more"
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    Learn more <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 40, color: 'var(--text-muted)' }}>No scenarios match your filters.</div>
          )}
        </div>
      </div>
    </section>
  );
}
