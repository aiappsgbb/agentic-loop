import { Zap, ArrowUpRight } from 'lucide-react';
import { KRATOS_PERSONAS } from '../data/kratos';
import { openPersona } from '../lib/kratosHandoff';

// Curated-persona gallery. No inner chat: clicking a card opens that persona
// directly in the embedded Kratos app (same-origin /kratos mount).
export default function KratosLauncher() {
  return (
    <div className="kratos-gallery">
      {KRATOS_PERSONAS.map(p => (
        <button
          key={p.id}
          type="button"
          className="kratos-persona-card"
          onClick={() => openPersona(p.kratosSlug)}
          aria-label={`Open ${p.name} in Kratos`}
        >
          <div className="kratos-persona-card-top">
            <span className="kratos-persona-mark"><Zap size={16} /></span>
            <span className="kratos-persona-skillcount">{p.skillCount} skills</span>
          </div>
          <h3 className="kratos-persona-name">{p.name}</h3>
          <p className="kratos-persona-tagline">{p.tagline}</p>
          <div className="kratos-persona-skills">
            {p.skills.slice(0, 5).map(s => (
              <span key={s} className="kratos-persona-chip">{s}</span>
            ))}
            {p.skills.length > 5 && (
              <span className="kratos-persona-chip more">+{p.skills.length - 5}</span>
            )}
          </div>
          <span className="kratos-persona-open">Open live <ArrowUpRight size={14} /></span>
        </button>
      ))}
    </div>
  );
}
