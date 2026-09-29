import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { STAGES, type StageDestination } from '../data/stages';

export function StageLink({ d, className, children }: { d: StageDestination; className?: string; children?: ReactNode }) {
  const content = children ?? <>{d.label} {d.external ? <ExternalLink size={13} /> : <ArrowRight size={13} />}</>;
  if (d.external) {
    return <a href={d.to} className={className} target="_blank" rel="noreferrer">{content}</a>;
  }
  return <Link to={d.to} className={className}>{content}</Link>;
}

export default function StageLoop() {
  return (
    <section className="stage-loop" id="stages" aria-label="Showcase, Build, Productionise">
      <div className="stage-loop-grid">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <article key={stage.id} className={`stage-card stage-${stage.id}`}>
              <div className="stage-card-top">
                <span className="stage-step">{stage.step}</span>
                <span className="stage-icon"><Icon size={20} /></span>
              </div>
              <h2 className="stage-name">{stage.name}</h2>
              <span className="stage-audience">{stage.audience}</span>
              <p className="stage-headline">{stage.headline}</p>
              <p className="stage-outcome">{stage.outcome}</p>
              <ul className="stage-dest-list">
                {stage.destinations.slice(0, 3).map(d => (
                  <li key={d.label}>
                    <StageLink d={d} className="stage-dest-link" />
                  </li>
                ))}
              </ul>
              <div className="stage-card-actions">
                <StageLink d={stage.primary} className="stage-cta" />
                <Link to={stage.route} className="stage-more">
                  Everything in {stage.name} <ArrowRight size={13} />
                </Link>
              </div>
              {i < STAGES.length - 1 && <span className="stage-connector" aria-hidden><ArrowRight size={16} /></span>}
            </article>
          );
        })}
      </div>
      <p className="stage-loop-note">
        <RefreshCw size={14} /> It's a loop: evaluation and telemetry from production feed the next demo and the next build.
      </p>
    </section>
  );
}
