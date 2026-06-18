import { useMemo, useState } from 'react';
import { Wand2, ArrowRight, AlertTriangle } from 'lucide-react';
import { buildPersonaManifest } from '../data/manifest';
import { relayAndOpen } from '../lib/kratosHandoff';

const EXAMPLES = [
  'A claims assistant for auto insurance that looks up policy details, explains coverage, and checks claim status with human approval before any payout.',
  'A retail-banking helper that answers account and card questions, searches transactions, and flags possible fraud.',
  'A research analyst that searches the web, grounds answers in our internal knowledge base, and summarizes findings with citations.',
];

export default function PersonaBuilder() {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const trimmed = description.trim();
    if (trimmed.length < 12) return null;
    try {
      return buildPersonaManifest({ description: trimmed, name: name.trim() || undefined });
    } catch {
      return null;
    }
  }, [description, name]);

  function create() {
    const trimmed = description.trim();
    if (trimmed.length < 12) {
      setError('Add a sentence or two describing what the agent should do.');
      return;
    }
    setError(null);
    const manifest = buildPersonaManifest({ description: trimmed, name: name.trim() || undefined });
    const ok = relayAndOpen(manifest);
    if (!ok) {
      setError('Could not open Kratos — your browser blocked session storage. Try again or disable private browsing.');
    }
  }

  return (
    <div className="persona-builder">
      <div className="kratos-launcher-head">
        <div className="kratos-launcher-mark"><Wand2 size={18} /></div>
        <div>
          <h3>Describe your agent <span className="wtuw-badge">New</span></h3>
          <p>Write what you want in plain language. We build a Kratos persona and open it live — no manual setup.</p>
        </div>
      </div>

      <label className="kratos-field-label" htmlFor="persona-name">Name <span className="persona-builder-optional">(optional)</span></label>
      <input
        id="persona-name"
        className="persona-builder-input"
        placeholder="e.g. Claims Service Advisor"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={64}
      />

      <label className="kratos-field-label" htmlFor="persona-desc">What should this agent do?</label>
      <textarea
        id="persona-desc"
        className="persona-builder-textarea"
        placeholder="Describe the agent's job, who it helps, what data or tools it needs, and any approval steps…"
        value={description}
        onChange={e => { setDescription(e.target.value); if (error) setError(null); }}
        rows={5}
      />

      <div className="persona-builder-examples">
        <span>Try:</span>
        {EXAMPLES.map((ex, i) => (
          <button key={i} type="button" className="persona-builder-chip" onClick={() => setDescription(ex)}>
            {ex.split(' ').slice(0, 4).join(' ')}…
          </button>
        ))}
      </div>

      {preview && (
        <div className="persona-builder-preview" aria-live="polite">
          <div className="persona-builder-preview-row">
            <strong>{preview.displayName}</strong>
            <span className="persona-builder-count">{preview.skills?.length ?? 0} skills</span>
          </div>
          {preview.skills && preview.skills.length > 0 && (
            <div className="persona-builder-tags">
              {preview.skills.map(s => (
                <span key={s.name} className="persona-builder-tag">{s.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="persona-builder-error" role="alert">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <button className="persona-builder-cta" onClick={create} disabled={description.trim().length < 12}>
        Create in Kratos <ArrowRight size={15} />
      </button>
    </div>
  );
}
