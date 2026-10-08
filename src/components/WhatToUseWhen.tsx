import { Link } from 'react-router-dom';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';

const PATHS = [
  {
    label: 'Build with the customer',
    title: 'Start a technical workshop',
    sub: "Turn the customer's requirements into a tailored MVP or pilot. Reuse maintained guidance first.",
    to: '/workshop',
    icon: Sparkles,
    meta: 'Prepare workshop',
  },
  {
    label: 'Showcase',
    title: 'Show an industry demo',
    sub: 'Explore ready-made examples without setup. Available demos and Kratos remain directly accessible.',
    to: '/scenarios',
    icon: Layers,
    meta: 'Explore industry examples',
  },
];

export default function WhatToUseWhen() {
  return (
    <section className="wtuw" id="what-to-use-when">
      <div className="wtuw-head">
        <div className="section-eyebrow">Customer conversation</div>
        <h2>What do you need for this customer conversation?</h2>
        <p>
          Build a customer-specific pilot or show an existing example. These are separate actions, not prerequisite courses.
        </p>
      </div>

      <div className="wtuw-path-grid workshop-entry-grid" aria-label="Customer actions">
        {PATHS.map(path => {
          const Icon = path.icon;
          const inner = (
            <>
              <div className="wtuw-path-card-top">
                <span className="wtuw-path-number">{path.label}</span>
                <span className="wtuw-path-icon"><Icon size={18} /></span>
              </div>
              <h3>{path.title}</h3>
              <p>{path.sub}</p>
              <span className="wtuw-path-action">
                {path.meta} <ArrowRight size={14} />
              </span>
            </>
          );
          return (
            <Link key={path.label} to={path.to} className="wtuw-path-card">{inner}</Link>
          );
        })}
      </div>
      <p>Already know which guide you need? <Link to="/playbooks">Browse playbooks</Link>. <Link to="/reference/kratos">Try Kratos</Link>.</p>
    </section>
  );
}
