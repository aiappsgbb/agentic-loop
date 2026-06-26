import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowUp, Plus, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import {
  KRATOS_PERSONAS, KRATOS_STARTER_PROMPTS, mockKratosReply, type KratosPersona,
} from '../data/kratos';

const KRATOS_REPO = 'https://github.com/kmavrodis/kratos-agent';

/** Minimal, safe inline markdown: escape HTML, then apply **bold** and _italic_. */
function renderInline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  steps?: { skill: string; note: string }[];
  pending?: boolean;
}

interface Props {
  initialPersonaId: string;
  initialPrompt: string;
  onReset: () => void;
}

export default function KratosChatMock({ initialPersonaId, initialPrompt, onReset }: Props) {
  const persona: KratosPersona =
    KRATOS_PERSONAS.find(p => p.id === initialPersonaId) ?? KRATOS_PERSONAS[0];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Schedule the mocked Reason → Act → Observe latency for a pending assistant message. */
  function resolveReply(botId: number, value: string) {
    const reply = mockKratosReply(persona, value);
    window.setTimeout(() => {
      setMessages(prev => prev.map(m => (m.id === botId ? { ...m, steps: reply.steps } : m)));
    }, 700);
    window.setTimeout(() => {
      setMessages(prev => prev.map(m => (m.id === botId ? { ...m, text: reply.answer, pending: false } : m)));
      setBusy(false);
    }, 1700);
  }

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    const userId = ++idRef.current;
    const botId = ++idRef.current;
    setMessages(prev => [
      ...prev,
      { id: userId, role: 'user', text: value },
      { id: botId, role: 'assistant', text: '', pending: true },
    ]);
    setInput('');
    resolveReply(botId, value);
  }

  // Seed the first turn on mount via a timer, so the effect body never calls setState synchronously.
  useEffect(() => {
    if (!initialPrompt) return;
    const t = window.setTimeout(() => send(initialPrompt), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="kratos-chat">
      <header className="kratos-chat-bar">
        <div className="kratos-chat-brand">
          <div className="kratos-launcher-mark"><Zap size={16} /></div>
          <div>
            <strong>{persona.name}</strong>
            <span className="kratos-chat-sub">{persona.skillCount} skills · mock preview</span>
          </div>
        </div>
        <div className="kratos-chat-actions">
          <button className="kratos-chip-btn" onClick={onReset}><Plus size={14} /> New conversation</button>
          <a className="kratos-chip-btn" href={KRATOS_REPO} target="_blank" rel="noreferrer">
            Open real Kratos <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div className="kratos-chat-skills">
        {persona.skills.map(s => <span key={s} className="kratos-skill-pill">{s}</span>)}
      </div>

      <div className="kratos-chat-scroll" ref={scrollRef}>
        {messages.map(m => (
          <div key={m.id} className={`kratos-msg ${m.role}`}>
            {m.role === 'assistant' && <div className="kratos-msg-avatar"><Zap size={13} /></div>}
            <div className="kratos-msg-body">
              {m.steps && (
                <div className="kratos-msg-steps">
                  {m.steps.map((st, i) => (
                    <span key={i} className="kratos-step"><b>{st.skill}</b> · {st.note}</span>
                  ))}
                </div>
              )}
              {m.pending && !m.text ? (
                <div className="kratos-typing"><Loader2 size={14} className="spin" /> Reason → Act → Observe…</div>
              ) : (
                <p className="kratos-msg-text" dangerouslySetInnerHTML={{ __html: renderInline(m.text) }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="kratos-chat-suggestions">
        {KRATOS_STARTER_PROMPTS.slice(0, 2).map(s => (
          <button key={s} className="kratos-suggestion" onClick={() => send(s)} disabled={busy}>{s}</button>
        ))}
      </div>

      <div className="kratos-chat-input">
        <textarea
          placeholder="Ask me anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button className="kratos-send" onClick={() => send(input)} disabled={!input.trim() || busy} aria-label="Send">
          <ArrowUp size={16} />
        </button>
      </div>

      <div className="kratos-chat-foot">
        <Link to="/kratos" onClick={onReset} className="kratos-back-link"><ArrowLeft size={13} /> Back to Kratos overview</Link>
        <span className="kratos-chat-tag">Copilot SDK + Foundry + MCP · mock</span>
      </div>
    </div>
  );
}
