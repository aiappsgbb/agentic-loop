import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowUp } from 'lucide-react';
import { KRATOS_PERSONAS, buildKratosLiveUrl } from '../data/kratos';

export default function KratosLauncher() {
  const navigate = useNavigate();
  const [personaId, setPersonaId] = useState(KRATOS_PERSONAS[0].id);
  const [prompt, setPrompt] = useState('');

  function persona() {
    return KRATOS_PERSONAS.find(p => p.id === personaId) ?? KRATOS_PERSONAS[0];
  }

  /** Primary: hand off to the deployed (live) Kratos agent in a new tab,
   *  carrying the selected persona and first message. */
  function start(text: string) {
    const value = text.trim();
    if (!value) return;
    window.open(buildKratosLiveUrl(persona().liveSlug, value), '_blank', 'noopener,noreferrer');
  }

  /** Secondary: preview the mock inline without leaving the chapter. */
  function preview() {
    const value = prompt.trim();
    if (!value) return;
    navigate('/kratos', { state: { personaId, prompt: value } });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      start(prompt);
    }
  }

  return (
    <div className="kratos-launcher">
      <div className="kratos-launcher-head">
        <div className="kratos-launcher-mark"><Zap size={18} /></div>
        <div>
          <h3>Kratos <span className="wtuw-badge">Live</span></h3>
          <p>A ready-to-use reference agent for demo, experiment, and prototype — pick a persona and start a chat in the live agent.</p>
        </div>
      </div>

      <label className="kratos-field-label" htmlFor="kratos-persona">Agent persona</label>
      <div className="kratos-select-wrap">
        <select
          id="kratos-persona"
          className="kratos-select"
          value={personaId}
          onChange={e => setPersonaId(e.target.value)}
        >
          {KRATOS_PERSONAS.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.skillCount} skills)</option>
          ))}
        </select>
      </div>

      <div className="kratos-launcher-input">
        <textarea
          placeholder="Ask me anything…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button
          className="kratos-send"
          onClick={() => start(prompt)}
          disabled={!prompt.trim()}
          aria-label="Start conversation in live Kratos"
          title="Start conversation in live Kratos"
        >
          <ArrowUp size={16} />
        </button>
      </div>
      <div className="kratos-launcher-hint">
        <kbd>Enter</kbd> to launch the <strong>live</strong> agent in a new tab · prebuilt, no setup
        {' · '}
        <button type="button" className="kratos-preview-link" onClick={preview} disabled={!prompt.trim()}>
          preview the mock inline
        </button>
      </div>
    </div>
  );
}
