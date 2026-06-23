import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  ArrowLeft, ArrowRight, Copy, Check, Info, Lightbulb, AlertTriangle, ListOrdered, X, Pin, PinOff,
  Sparkles, Workflow, Layers, ShieldCheck, Wrench, Rocket, GitBranch, Database, Eye, BookOpen, Play,
} from 'lucide-react';
import { playbooks } from '../data/links';
import type { Playbook } from '../data/links';

const PB_ICONS: Record<string, typeof Rocket> = {
  Rocket, GitBranch, Database, ShieldCheck, Eye, BookOpen, Workflow, Layers, Wrench,
};

// One accent per chapter — readable on both dark and light surfaces.
const PHASE_ACCENTS = ['#8b6dff', '#1fb6d6', '#e0950e', '#ec4899', '#22b07d', '#5b8cff'];
const chapterAccent = (i: number) => PHASE_ACCENTS[((i % PHASE_ACCENTS.length) + PHASE_ACCENTS.length) % PHASE_ACCENTS.length];

const PLAYBOOK_FILES = import.meta.glob('/playbooks/*/README.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Authored diagram SVGs, inlined (not <img>) so they inherit the live theme
// via currentColor + CSS custom properties instead of being sandboxed.
const DIAGRAMS = import.meta.glob('/playbooks/*/images/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Slide {
  id: string;
  chapter: string;
  title: string;
  body: string;
  opener?: boolean;
}

interface Parsed {
  title: string;
  lede: string;
  chapters: string[];
  slides: Slide[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parsePlaybook(md: string, slug: string): Parsed {
  const lines = md.split(/\r?\n/);
  let title = slug;
  const ledeLines: string[] = [];
  const slides: Slide[] = [];
  const chapters: string[] = [];

  let inFence = false;
  let phase: 'pre-h1' | 'lede' | 'body' = 'pre-h1';
  let currentChapter = 'Intro';
  let currentSlide: Slide | null = null;
  let chapterBuf: string[] = [];
  let collectingIntro = false;

  const pushSlide = () => {
    if (currentSlide) {
      currentSlide.body = currentSlide.body.replace(/\n+$/g, '').replace(/\n?---\s*$/g, '');
      slides.push(currentSlide);
      currentSlide = null;
    }
  };

  const flushOpener = () => {
    if (collectingIntro) {
      const body = chapterBuf
        .join('\n')
        .replace(/\n+$/g, '')
        .replace(/\n?---\s*$/g, '')
        .trim();
      if (body) {
        slides.push({
          id: slugify(`${currentChapter}-overview`),
          chapter: currentChapter,
          title: currentChapter,
          body,
          opener: true,
        });
      }
      collectingIntro = false;
      chapterBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      if (currentSlide) currentSlide.body += line + '\n';
      else if (collectingIntro) chapterBuf.push(line);
      else if (phase === 'lede') ledeLines.push(line);
      continue;
    }
    if (!inFence) {
      const h1 = line.match(/^#\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const h3 = line.match(/^###\s+(.+)$/);
      if (h1) {
        title = h1[1].trim();
        phase = 'lede';
        continue;
      }
      if (h2) {
        pushSlide();
        flushOpener();
        currentChapter = h2[1].trim();
        if (!chapters.includes(currentChapter)) chapters.push(currentChapter);
        collectingIntro = true;
        chapterBuf = [];
        phase = 'body';
        continue;
      }
      if (h3) {
        pushSlide();
        flushOpener();
        const t = h3[1].trim();
        currentSlide = { id: slugify(`${currentChapter}-${t}`), chapter: currentChapter, title: t, body: '' };
        phase = 'body';
        continue;
      }
    }
    if (currentSlide) {
      currentSlide.body += line + '\n';
    } else if (collectingIntro) {
      chapterBuf.push(line);
    } else if (phase === 'lede') {
      ledeLines.push(line);
    }
  }
  pushSlide();
  flushOpener();

  const lede = ledeLines.join('\n').trim().split(/\n\n+/)[0] ?? '';

  // Rewrite relative image paths to /playbooks/<slug>/images/...
  const fix = (body: string) =>
    body.replace(/(!\[[^\]]*]\()\.?\/?images\//g, `$1/playbooks/${slug}/images/`);

  const introSlide: Slide = {
    id: 'intro',
    chapter: 'Intro',
    title: title,
    body: lede,
  };

  return {
    title,
    lede,
    chapters: ['Intro', ...chapters],
    slides: [introSlide, ...slides.map(s => ({ ...s, body: fix(s.body) }))],
  };
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, '');
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div className="md-code">
      <button className="md-copy" type="button" aria-label="Copy code" onClick={onCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre><code className={className}>{children}</code></pre>
    </div>
  );
}

function calloutKind(text: string): 'note' | 'tip' | 'warning' | null {
  const m = text.trim().match(/^(Note|Tip|Warning|Important)\s*[:：]/i);
  if (!m) return null;
  const k = m[1].toLowerCase();
  if (k === 'tip') return 'tip';
  if (k === 'warning' || k === 'important') return 'warning';
  return 'note';
}

function PlaybookHero({
  meta, title, lede, chapters, slideCount, onStart,
}: {
  meta?: Playbook;
  title: string;
  lede: string;
  chapters: string[];
  slideCount: number;
  onStart: () => void;
}) {
  const Icon = (meta && PB_ICONS[meta.icon]) || BookOpen;
  const build = meta?.buildSkills ?? [];
  const deploy = meta?.deploymentSkills ?? [];
  const skillCount = build.length + deploy.length;
  const stages = chapters.filter(c => c !== 'Intro');

  return (
    <div className="pb-hero">
      <div className="pb-hero-head">
        <div className="pb-hero-icon"><Icon size={26} /></div>
        <div className="pb-hero-badges">
          {meta?.featured && <span className="pb-badge flagship"><Sparkles size={13} /> Flagship</span>}
          {meta?.level && <span className="pb-badge level">{meta.level}</span>}
          <span className="pb-badge"><ListOrdered size={13} /> {stages.length || meta?.steps || slideCount} stages</span>
          {skillCount > 0 && <span className="pb-badge"><Workflow size={13} /> {skillCount} skills</span>}
        </div>
      </div>

      <h1 className="pb-hero-title">{title}</h1>

      <div className="pb-hero-lede md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lede}</ReactMarkdown>
      </div>

      {meta?.use_when && (
        <p className="pb-hero-usewhen">
          <span className="pb-hero-usewhen-tag">Use this when</span>
          {meta.use_when}
        </p>
      )}

      {meta?.techniques?.length ? (
        <div className="pb-hero-tech">
          {meta.techniques.filter(t => t !== '*').map(t => (
            <span key={t} className="pb-tech-chip">{t}</span>
          ))}
        </div>
      ) : null}

      {skillCount > 0 && (
        <div className="pb-hero-chain">
          {build.length > 0 && (
            <div className="pb-chain-group">
              <span className="pb-chain-label build">Build skills</span>
              <div className="pb-chain-chips">
                {build.map(s => <span key={s} className="pb-chain-chip">{s}</span>)}
              </div>
            </div>
          )}
          {build.length > 0 && deploy.length > 0 && (
            <ArrowRight className="pb-chain-arrow" size={18} aria-hidden="true" />
          )}
          {deploy.length > 0 && (
            <div className="pb-chain-group">
              <span className="pb-chain-label deploy">Deploy skills</span>
              <div className="pb-chain-chips">
                {deploy.map(s => <span key={s} className="pb-chain-chip">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="button" className="pb-hero-cta" onClick={onStart}>
        <Play size={15} /> Start the walkthrough <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function PlaybookPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const key = `/playbooks/${slug}/README.md`;
  const raw = PLAYBOOK_FILES[key];

  if (!raw) {
    return (
      <div className="playbook-missing">
        <h1>Playbook not found</h1>
        <p>No <code>playbooks/{slug}/README.md</code> in this workspace.</p>
        <Link to="/playbooks" className="btn-pill"><ArrowLeft size={14} /> Back to Playbooks</Link>
      </div>
    );
  }

  const parsed = useMemo(() => parsePlaybook(raw, slug), [raw, slug]);
  const [index, setIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [tocPinned, setTocPinned] = useState(() => {
    try { return localStorage.getItem('playbook-toc-pinned') === '1'; } catch { return false; }
  });
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem('playbook-toc-pinned', tocPinned ? '1' : '0'); } catch { /* ignore */ }
  }, [tocPinned]);

  const tocVisible = tocOpen || tocPinned;

  // URL hash sync
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (!id) return;
      const i = parsed.slides.findIndex(s => s.id === id);
      if (i >= 0) setIndex(i);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [parsed.slides]);

  useEffect(() => {
    const id = parsed.slides[index]?.id;
    if (id && `#${id}` !== window.location.hash) {
      history.replaceState(null, '', `#${id}`);
    }
    slideRef.current?.focus();
  }, [index, parsed.slides]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setIndex(i => Math.min(parsed.slides.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        setIndex(0);
      } else if (e.key === 'End') {
        setIndex(parsed.slides.length - 1);
      } else if (e.key === 'Escape') {
        navigate('/playbooks');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [parsed.slides.length, navigate]);

  const slide = parsed.slides[index];
  const progress = ((index + 1) / parsed.slides.length) * 100;
  const chapterIndex = parsed.chapters.indexOf(slide.chapter);
  const meta = playbooks.find(p => p.slug === slug);
  const accent = chapterAccent(chapterIndex >= 0 ? chapterIndex : 0);
  const isHero = slide.id === 'intro';
  const isOpener = !!slide.opener;

  return (
    <div className={`playbook-page ${tocPinned ? 'toc-pinned' : ''}`} style={{ '--ph': accent } as React.CSSProperties}>
      <div className="playbook-topbar">
        <Link to="/playbooks" className="playbook-back" aria-label="Back to Playbooks">
          <ArrowLeft size={16} /> <span>Playbooks</span>
        </Link>
        <div className="playbook-title-strip">
          <span className="playbook-crumb">{parsed.title}</span>
        </div>
        <button
          className={`playbook-toc-btn ${tocVisible ? 'active' : ''}`}
          type="button"
          onClick={() => {
            if (tocPinned) { setTocPinned(false); setTocOpen(false); }
            else setTocOpen(v => !v);
          }}
          aria-label="Table of contents"
          aria-expanded={tocVisible}
        >
          <ListOrdered size={16} /> <span>Contents</span>
        </button>
      </div>

      <div className="playbook-chapter-rail">
        {parsed.chapters.map((c, i) => {
          const firstIdx = parsed.slides.findIndex(s => s.chapter === c);
          return (
            <button
              key={c}
              type="button"
              className={`chapter-pill ${i === chapterIndex ? 'active' : ''} ${i < chapterIndex ? 'done' : ''}`}
              style={{ '--pp': chapterAccent(i) } as React.CSSProperties}
              onClick={() => setIndex(firstIdx >= 0 ? firstIdx : 0)}
            >
              <span className="chapter-pill-num">{i + 1}</span>
              <span className="chapter-pill-label">{c}</span>
            </button>
          );
        })}
      </div>

      <div className="playbook-progress" aria-hidden="true">
        <div className="playbook-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div
        ref={slideRef}
        className={`playbook-slide ${isHero ? 'is-hero' : ''} ${isOpener ? 'is-opener' : ''}`}
        role="region"
        aria-label={`${slide.chapter} — ${slide.title}`}
        tabIndex={-1}
      >
        {!isHero && chapterIndex >= 0 && (
          <span className="playbook-slide-watermark" aria-hidden="true">{chapterIndex}</span>
        )}
        {isHero ? (
          <PlaybookHero
            meta={meta}
            title={slide.title}
            lede={slide.body}
            chapters={parsed.chapters}
            slideCount={parsed.slides.length}
            onStart={() => setIndex(Math.min(parsed.slides.length - 1, 1))}
          />
        ) : (
          <>
        <div className="playbook-slide-eyebrow">
          {isOpener ? (
            <span className="pb-eyebrow-chapter">Chapter {chapterIndex}</span>
          ) : (
            <span className="pb-eyebrow-chapter">{slide.chapter}</span>
          )}
          <span className="dot">·</span>
          <span>Slide {index + 1} of {parsed.slides.length}</span>
        </div>
        <h1 className="playbook-slide-title">{slide.title}</h1>
        <article className="playbook-slide-body md">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => <>{children}</>,
              p: ({ children }) => {
                const text = extractBlockquoteText(children).trim();
                if (/^(What you get|What you'?ll get)\s*[:：]/i.test(text)) {
                  return <p className="pb-lead">{children}</p>;
                }
                return <p>{children}</p>;
              },
              code: ({ className, children, ...props }) => {
                const isBlock = /language-/.test(className ?? '') || String(children).includes('\n');
                if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
                return <code className={className} {...props}>{children}</code>;
              },
              blockquote: ({ children }) => {
                const text = (Array.isArray(children) ? children : [children])
                  .map((c: unknown) => (typeof c === 'string' ? c : ''))
                  .join('');
                const kind = calloutKind(extractBlockquoteText(children)) ?? 'note';
                const Icon = kind === 'warning' ? AlertTriangle : kind === 'tip' ? Lightbulb : Info;
                return (
                  <div className={`md-callout md-callout-${kind}`}>
                    <Icon size={16} className="md-callout-icon" />
                    <div className="md-callout-body">{children}</div>
                    <span style={{ display: 'none' }}>{text}</span>
                  </div>
                );
              },
              a: ({ href, children, ...rest }) => {
                const isExternal = !!href && /^https?:/.test(href);
                return (
                  <a href={href} {...rest} {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}>
                    {children}
                  </a>
                );
              },
              img: ({ src, alt }) => {
                const key = typeof src === 'string' ? src : '';
                const svg = key.endsWith('.svg') ? DIAGRAMS[key] : undefined;
                if (svg) {
                  return (
                    <figure className="md-figure">
                      <div className="md-figure-svg" dangerouslySetInnerHTML={{ __html: svg }} />
                      {alt ? <figcaption>{alt}</figcaption> : null}
                    </figure>
                  );
                }
                return <img src={key} alt={alt ?? ''} loading="lazy" />;
              },
            }}
          >
            {slide.body}
          </ReactMarkdown>
        </article>
          </>
        )}

        <div className="playbook-nav">
          <button
            type="button"
            className="playbook-nav-btn"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <span className="playbook-nav-hint">Use ← → to navigate</span>
          <button
            type="button"
            className="playbook-nav-btn primary"
            onClick={() => setIndex(i => Math.min(parsed.slides.length - 1, i + 1))}
            disabled={index === parsed.slides.length - 1}
            aria-label="Next slide"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {tocVisible && (
        <div className={`playbook-toc ${tocPinned ? 'pinned' : ''}`} role={tocPinned ? undefined : 'dialog'} aria-label="Table of contents">
          <div className="playbook-toc-head">
            <h3>Contents</h3>
            <div className="playbook-toc-actions">
              <button
                type="button"
                className={`icon-btn ${tocPinned ? 'on' : ''}`}
                onClick={() => {
                  setTocPinned(p => {
                    const next = !p;
                    if (next) setTocOpen(false);
                    return next;
                  });
                }}
                aria-label={tocPinned ? 'Unpin contents' : 'Pin contents'}
                title={tocPinned ? 'Unpin contents' : 'Pin contents'}
              >
                {tocPinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              {!tocPinned && (
                <button type="button" className="icon-btn" onClick={() => setTocOpen(false)} aria-label="Close contents">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {parsed.chapters.map(ch => (
            <div key={ch} className="playbook-toc-chapter">
              <div className="playbook-toc-chapter-label">{ch}</div>
              <ul>
                {parsed.slides
                  .map((s, i) => ({ s, i }))
                  .filter(({ s }) => s.chapter === ch)
                  .map(({ s, i }) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`playbook-toc-item ${i === index ? 'active' : ''}`}
                        onClick={() => { setIndex(i); if (!tocPinned) setTocOpen(false); }}
                      >
                        <span className="playbook-toc-num">{i + 1}</span>
                        <span>{s.title}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractBlockquoteText(children: React.ReactNode): string {
  if (children == null) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractBlockquoteText).join('');
  if (typeof children === 'object' && 'props' in (children as { props?: { children?: React.ReactNode } })) {
    const c = (children as { props?: { children?: React.ReactNode } }).props?.children;
    return extractBlockquoteText(c);
  }
  return '';
}
