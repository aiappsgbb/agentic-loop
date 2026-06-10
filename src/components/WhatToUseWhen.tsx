import { Link } from 'react-router-dom';
import { Hammer, Rocket, Layers, BookOpen, Sparkles, ArrowRight, ArrowUpRight } from 'lucide-react';

const BUILD_PATHS = [
  { label: 'Scenarios', sub: 'Pre-defined, industry-proven blueprints', to: '/scenarios', icon: Layers, hash: false },
  { label: 'Playbooks', sub: 'Reusable techniques to compose', to: '/playbooks', icon: BookOpen, hash: false },
  { label: 'Build from scratch', sub: 'Custom — describe it, Copilot scaffolds it', to: '#prompt', icon: Sparkles, hash: true },
];

export default function WhatToUseWhen() {
  return (
    <section className="wtuw">
      <div className="wtuw-head">
        <div className="section-eyebrow">Find your starting point</div>
        <h2>What to use when</h2>
        <p>Two ways in: build &amp; run your own solution, or experiment instantly with a ready-to-use one.</p>
      </div>

      <div className="wtuw-duo">
        <div className="wtuw-choice build">
          <div className="wtuw-choice-head">
            <div className="wtuw-choice-ic"><Hammer size={20} /></div>
            <div>
              <h3>Build &amp; run your own</h3>
              <p>Pre-defined or fully custom solutions you deploy yourself with GitHub Copilot + Microsoft Foundry.</p>
            </div>
          </div>
          <div className="wtuw-choice-paths">
            {BUILD_PATHS.map(p => {
              const Icon = p.icon;
              const inner = (
                <>
                  <Icon size={16} className="wtuw-path-ic" />
                  <span className="wtuw-path-text">
                    <span className="wtuw-path-label">{p.label}</span>
                    <span className="wtuw-path-sub">{p.sub}</span>
                  </span>
                  <ArrowRight size={14} className="wtuw-path-go" />
                </>
              );
              return p.hash ? (
                <a key={p.label} href={p.to} className="wtuw-path">{inner}</a>
              ) : (
                <Link key={p.label} to={p.to} className="wtuw-path">{inner}</Link>
              );
            })}
          </div>
        </div>

        <Link to="/kratos" className="wtuw-choice ready">
          <div className="wtuw-choice-head">
            <div className="wtuw-choice-ic"><Rocket size={20} /></div>
            <div>
              <h3>Ready to use — Kratos <span className="wtuw-badge">Live</span></h3>
              <p>A prebuilt reference agent for demo, experiment, and prototype. No build, no setup — just try it.</p>
            </div>
          </div>
          <div className="wtuw-ready-tags">
            <span>Demo</span>
            <span>Experiment</span>
            <span>Prototype</span>
          </div>
          <span className="wtuw-choice-cta">
            Open Kratos <ArrowUpRight size={15} />
          </span>
        </Link>
      </div>
    </section>
  );
}
