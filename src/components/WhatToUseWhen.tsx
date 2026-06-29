import { Link } from 'react-router-dom';
import { Layers, Sparkles, ArrowRight, Zap } from 'lucide-react';

const PATHS = [
  {
    label: 'Path 1',
    title: 'Kratos',
    sub: 'Ready-to-use demo with domain personas and task skills. No advisor inputs, no setup.',
    to: '/kratos',
    icon: Zap,
    meta: 'Try it live',
    hash: false,
  },
  {
    label: 'Path 2',
    title: 'Agentic Launchpad',
    sub: 'Bring a concrete idea, craft your spec, and generate a Copilot-led deployment path.',
    to: '#prompt',
    icon: Sparkles,
    meta: 'Build from idea',
    hash: true,
  },
  {
    label: 'Path 3',
    title: 'Industry scenarios',
    sub: 'Start from a vertical use case and adapt to your specific requirements.',
    to: '/scenarios',
    icon: Layers,
    meta: 'Start from scenario',
    hash: false,
  },
];

export default function WhatToUseWhen() {
  return (
    <section className="wtuw" id="what-to-use-when">
      <div className="wtuw-head">
        <div className="section-eyebrow">Choose your innovation path</div>
        <h2>Where do you want to start?</h2>
        <p>
          Three paths, one loop: try Kratos, build your own idea, or start from a scenario.
          Playbooks are the reusable HOW guidance behind the advisor paths.
        </p>
      </div>

      <div className="wtuw-path-grid" aria-label="Three paths">
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
          return path.hash ? (
            <a key={path.label} href={path.to} className="wtuw-path-card">{inner}</a>
          ) : (
            <Link key={path.label} to={path.to} className="wtuw-path-card">{inner}</Link>
          );
        })}
      </div>
    </section>
  );
}
