import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowLeft, ExternalLink, Copy, Check, Terminal, AlertTriangle } from 'lucide-react';
import {
  getBuildSkill, skillRepoUrl, skillRawUrl, skillInstallCommand,
} from '../data/skills';

interface Frontmatter {
  name?: string;
  description?: string;
}

/** Split YAML frontmatter from the markdown body and pull out name/description. */
function parseSkillMarkdown(raw: string): { fm: Frontmatter; body: string } {
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };

  const [, yaml, body] = match;
  const fm: Frontmatter = {};
  for (const line of yaml.split(/\r?\n/)) {
    const kv = line.match(/^(name|description)\s*:\s*(.*)$/i);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[kv[1].toLowerCase() as keyof Frontmatter] = value;
  }
  return { fm, body };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; fm: Frontmatter; body: string };

export default function SkillDetail() {
  const { name } = useParams<{ name: string }>();
  const skill = name ? getBuildSkill(name) : undefined;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!skill) return;
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(skillRawUrl(skill))
      .then(res => {
        if (!res.ok) throw new Error(`SKILL.md returned ${res.status}`);
        return res.text();
      })
      .then(raw => {
        if (cancelled) return;
        const { fm, body } = parseSkillMarkdown(raw);
        setState({ status: 'ready', fm, body });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load SKILL.md' });
      });

    return () => { cancelled = true; };
  }, [skill]);

  if (!skill) {
    return (
      <div className="skill-detail-missing">
        <h1>Skill not found</h1>
        <p>No build skill named <code>{name}</code> in the catalog.</p>
        <Link to="/skills" className="btn-pill"><ArrowLeft size={14} /> Back to Skills</Link>
      </div>
    );
  }

  const displayName = (state.status === 'ready' && state.fm.name) || skill.name;
  const displayDesc = (state.status === 'ready' && state.fm.description) || skill.description;
  const installCmd = skillInstallCommand(skill);
  const repoUrl = skillRepoUrl(skill);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="skill-detail">
      <div className="skill-detail-topbar">
        <Link to="/skills" className="playbook-back" aria-label="Back to Skills">
          <ArrowLeft size={16} /> <span>Skills</span>
        </Link>
        <span className="skill-detail-repo">{skill.repo}</span>
      </div>

      <header className="skill-detail-head">
        <h1>{displayName}</h1>
        <p className="lede">{displayDesc}</p>
      </header>

      <div className="skill-detail-actions">
        <a className="btn-pill" href={repoUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> Open <code>SKILL.md</code> on GitHub
        </a>
        <div className="skill-install">
          <Terminal size={14} className="skill-install-icon" />
          <code>{installCmd}</code>
          <button type="button" className="skill-install-copy" onClick={copyInstall} aria-label="Copy install command">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <article className="skill-detail-body md">
        {state.status === 'loading' && (
          <div className="skill-detail-loading">Loading <code>SKILL.md</code>…</div>
        )}
        {state.status === 'error' && (
          <div className="md-callout md-callout-warning">
            <AlertTriangle size={16} className="md-callout-icon" />
            <div className="md-callout-body">
              <p>Couldn't load <code>SKILL.md</code> ({state.message}).</p>
              <p><a href={skillRawUrl(skill)} target="_blank" rel="noreferrer">View the raw file</a> or <a href={repoUrl} target="_blank" rel="noreferrer">open it on GitHub</a>.</p>
            </div>
          </div>
        )}
        {state.status === 'ready' && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
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
            {state.body}
          </ReactMarkdown>
        )}
      </article>
    </div>
  );
}
