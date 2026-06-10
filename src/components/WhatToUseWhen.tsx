import { Link } from 'react-router-dom';
import {
  Rocket, Layers, BookOpen, Sparkles, Lightbulb, Library, ArrowRight,
} from 'lucide-react';

interface Path {
  want: string;
  to: string;
  dest: string;
  icon: typeof Rocket;
  external?: boolean;
}

const PATHS: Path[] = [
  { want: 'See a working agent right now — no setup', to: '/kratos', dest: 'Kratos', icon: Rocket },
  { want: 'Start from a proven outcome for my industry', to: '/scenarios', dest: 'Scenarios', icon: Layers },
  { want: 'Learn a specific technique (grounding, eval, voice…)', to: '/playbooks', dest: 'Playbooks', icon: BookOpen },
  { want: 'Build my own idea from a blank prompt', to: '#prompt', dest: 'Start below', icon: Sparkles },
  { want: 'Look up a specific Build or Run capability', to: '/skills', dest: 'Skills catalog', icon: Library },
  { want: 'Understand the model and the platform', to: '/concepts/agentic-loop', dest: 'Concepts', icon: Lightbulb },
];

export default function WhatToUseWhen() {
  return (
    <section className="wtuw">
      <div className="wtuw-head">
        <div className="section-eyebrow">Find your starting point</div>
        <h2>What to use when</h2>
        <p>Six surfaces, one question: what are you trying to do right now?</p>
      </div>
      <div className="wtuw-grid">
        {PATHS.map(p => {
          const Icon = p.icon;
          const inner = (
            <>
              <div className="wtuw-ic"><Icon size={18} /></div>
              <div className="wtuw-body">
                <span className="wtuw-want">{p.want}</span>
                <span className="wtuw-dest">{p.dest} <ArrowRight size={13} /></span>
              </div>
            </>
          );
          return p.to.startsWith('#') ? (
            <a key={p.want} href={p.to} className="wtuw-card">{inner}</a>
          ) : (
            <Link key={p.want} to={p.to} className="wtuw-card">{inner}</Link>
          );
        })}
      </div>
    </section>
  );
}
