import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowLeft, ArrowRight, Copy, Check, Info, Lightbulb, AlertTriangle, ListOrdered, X, Pin, PinOff } from 'lucide-react';
import Mermaid from '../components/Mermaid';
import ShareButton from '../components/ShareButton';

const PLAYBOOK_FILES = import.meta.glob('/playbooks/*/README.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

interface Slide {
  id: string;
  chapter: string;
  title: string;
  body: string;
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

/** Accent color per chapter/stage, cycled by chapter index. */
const STAGE_ACCENTS = ['#8b6dff', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];

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

  const pushSlide = () => {
    if (currentSlide) {
      currentSlide.body = currentSlide.body.replace(/\n+$/g, '').replace(/\n?---\s*$/g, '');
      slides.push(currentSlide);
      currentSlide = null;
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      if (currentSlide) currentSlide.body += line + '\n';
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
        currentChapter = h2[1].trim();
        if (!chapters.includes(currentChapter)) chapters.push(currentChapter);
        phase = 'body';
        continue;
      }
      if (h3) {
        pushSlide();
        const t = h3[1].trim();
        currentSlide = { id: slugify(`${currentChapter}-${t}`), chapter: currentChapter, title: t, body: '' };
        phase = 'body';
        continue;
      }
    }
    if (currentSlide) {
      currentSlide.body += line + '\n';
    } else if (phase === 'lede') {
      ledeLines.push(line);
    }
  }
  pushSlide();

  const lede = ledeLines.join('\n').trim().split(/\n\n+/)[0] ?? '';

  // Rewrite relative image paths to <base>playbooks/<slug>/images/...
  const fix = (body: string) =>
    body.replace(/(!\[[^\]]*]\()\.?\/?images\//g, `$1${import.meta.env.BASE_URL}playbooks/${slug}/images/`);

  return {
    title,
    lede,
    chapters,
    slides: slides.map(s => ({ ...s, body: fix(s.body) })),
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

/** Reconstruct raw text from React children (rehype-highlight wraps code in spans). */
function childrenToText(children: React.ReactNode): string {
  if (children == null || children === false) return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (typeof children === 'object' && 'props' in children) {
    return childrenToText((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
}

export default function PlaybookPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const key = `/playbooks/${slug}/README.md`;
  // undefined = still loading, null = no such playbook, string = README content
  const [raw, setRaw] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const loader = PLAYBOOK_FILES[key];
    if (!loader) { setRaw(null); return; }
    setRaw(undefined);
    loader()
      .then(text => { if (!cancelled) setRaw(text); })
      .catch(() => { if (!cancelled) setRaw(null); });
    return () => { cancelled = true; };
  }, [key]);

  const parsed = useMemo(() => (raw ? parsePlaybook(raw, slug) : null), [raw, slug]);
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

  // Per-route document title.
  useEffect(() => {
    if (parsed) document.title = `${parsed.title} · Agentic Loop`;
  }, [parsed]);

  // URL hash sync
  useEffect(() => {
    if (!parsed) return;
    const slides = parsed.slides;
    const fromHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (!id) return;
      const i = slides.findIndex(s => s.id === id);
      if (i >= 0) setIndex(i);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [parsed]);

  useEffect(() => {
    if (!parsed) return;
    const slides = parsed.slides;
    const id = slides[index]?.id;
    if (id && `#${id}` !== window.location.hash) {
      history.replaceState(null, '', `#${id}`);
    }
    slideRef.current?.focus();
  }, [index, parsed]);

  // Keyboard nav
  useEffect(() => {
    if (!parsed) return;
    const slideCount = parsed.slides.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setIndex(i => Math.min(slideCount - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        setIndex(0);
      } else if (e.key === 'End') {
        setIndex(slideCount - 1);
      } else if (e.key === 'Escape') {
        navigate('/playbooks');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [parsed, navigate]);

  if (raw === undefined) {
    return (
      <div className="playbook-missing">
        <p className="route-loading" role="status" aria-live="polite">Loading playbook…</p>
      </div>
    );
  }

  if (!parsed || parsed.slides.length === 0) {
    return (
      <div className="playbook-missing">
        <h1>Playbook not found</h1>
        <p>No <code>playbooks/{slug}/README.md</code> in this workspace.</p>
        <Link to="/playbooks" className="btn-pill"><ArrowLeft size={14} /> Back to Playbooks</Link>
      </div>
    );
  }

  const slide = parsed.slides[index];
  const progress = ((index + 1) / parsed.slides.length) * 100;
  const chapterIndex = parsed.chapters.indexOf(slide.chapter);
  const accent = STAGE_ACCENTS[(chapterIndex < 0 ? 0 : chapterIndex) % STAGE_ACCENTS.length];

  return (
    <div
      className={`playbook-page ${tocPinned ? 'toc-pinned' : ''}`}
      style={{ '--pb-accent': accent } as CSSProperties}
    >
      <div className="playbook-topbar">
        <Link to="/playbooks" className="playbook-back" aria-label="Back to Playbooks">
          <ArrowLeft size={16} /> <span>Playbooks</span>
        </Link>
        <div className="playbook-title-strip">
          <span className="playbook-crumb">{parsed.title}</span>
        </div>
        <ShareButton title={parsed.title} />
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
        className="playbook-slide"
        role="region"
        aria-label={`${slide.chapter} — ${slide.title}`}
        tabIndex={-1}
      >
        <div className="playbook-slide-eyebrow">
          <span>{slide.chapter}</span>
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
              code: ({ className, children, ...props }) => {
                if (/language-mermaid/.test(className ?? '')) {
                  return <Mermaid chart={childrenToText(children).replace(/\n$/, '')} />;
                }
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
            }}
          >
            {slide.body}
          </ReactMarkdown>
        </article>

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
