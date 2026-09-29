import { useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Info, Presentation, Hammer } from 'lucide-react';
import StageStepper from '../components/StageStepper';
import { StageLink } from '../components/StageLoop';
import GreenfieldBuilder from '../components/GreenfieldBuilder';
import { STAGES, getStage, type StageId } from '../data/stages';
import { ASTRA_DEMOS, ASTRA_DEMOS_URL } from '../data/destinations';
import scenarios from '../data/scenarios.json';
import type { Scenario } from '../data/links';

const SCENARIO_NAMES = new Map((scenarios as Scenario[]).map(s => [s.id, s.name]));

function ShowcaseDemos() {
  return (
    <section className="concept-section">
      <div className="section-eyebrow">Astra industry demos</div>
      <h2>Show it, then build it</h2>
      <p className="lede">
        Each demo runs live on Microsoft Foundry. When the customer asks "can we have this?", the matching
        scenario hands the conversation to an engineer in the Build stage.
      </p>
      <div className="stage-demo-grid">
        {ASTRA_DEMOS.map(demo => {
          const scenarioId = demo.scenarioIds[0];
          return (
            <article key={demo.id} className="stage-demo-card">
              <span className="stage-demo-industry">{demo.industry}</span>
              <h3>{demo.name}</h3>
              <p>{demo.summary}</p>
              <div className="stage-demo-actions">
                <a href={ASTRA_DEMOS_URL} target="_blank" rel="noreferrer" className="stage-cta small">
                  <Presentation size={14} /> Show the demo <ExternalLink size={12} />
                </a>
                {scenarioId && (
                  <Link to={`/scenarios/${scenarioId}`} className="stage-demo-build">
                    <Hammer size={15} />
                    <span>
                      <strong>Build it for the customer</strong>
                      <span>{SCENARIO_NAMES.get(scenarioId) ?? 'Matching industry scenario'}</span>
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BuildPath() {
  const steps = [
    { n: '1', title: 'Run Getting started', desc: 'Get one agent running on Foundry so the workflow is familiar.', to: '/playbooks/getting-started' },
    { n: '2', title: 'Pick a scenario or a pattern', desc: 'Start from an industry use case, or the capability your solution needs.', to: '/scenarios' },
    { n: '3', title: 'Describe your own idea', desc: 'Use the Launchpad below to turn it into a spec and a Copilot prompt.', to: '/build#prompt' },
  ];
  return (
    <>
      <section className="concept-section">
        <div className="section-eyebrow">Workshop path</div>
        <h2>Three steps from zero to your own agent</h2>
        <ol className="stage-steps">
          {steps.map(s => (
            <li key={s.n}>
              <Link to={s.to} className="stage-step-card">
                <span className="stage-step-num">{s.n}</span>
                <span>
                  <strong>{s.title}</strong>
                  <span>{s.desc}</span>
                </span>
                <ArrowRight size={15} />
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <GreenfieldBuilder
        eyebrow="Build · Agentic Launchpad"
        heading="Have a concrete idea? Turn it into a Copilot-led build."
      />
    </>
  );
}

const READINESS = [
  { area: 'Identity & network', detail: 'Managed identity, Entra sign-in, private networking.', to: '/concepts/platform' },
  { area: 'Model governance', detail: 'Keyless, attributed model access through an AI gateway.', to: '/playbooks/citadel-governance-hub' },
  { area: 'Safety', detail: 'Content filters, prompt shields, policy boundaries.', to: '/playbooks/governance-safety-baseline' },
  { area: 'Evals & red-teaming', detail: 'Offline scenarios, continuous evaluation, adversarial scans.', to: '/playbooks/continuous-evaluation-loop' },
  { area: 'Observability & cost', detail: 'OpenTelemetry traces in Foundry; phased cost model.', to: '/playbooks/threadlight-pipeline' },
];

function ProductionReadiness() {
  return (
    <section className="concept-section">
      <div className="section-eyebrow">Production readiness</div>
      <h2>What changes between a pilot and production</h2>
      <div className="stage-readiness">
        {READINESS.map(r => (
          <Link key={r.area} to={r.to} className="stage-readiness-row">
            <strong>{r.area}</strong>
            <span>{r.detail}</span>
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>
    </section>
  );
}

const EXTRAS: Record<StageId, ComponentType> = {
  showcase: ShowcaseDemos,
  build: BuildPath,
  productionise: ProductionReadiness,
};

export default function StagePage({ id }: { id: StageId }) {
  const stage = getStage(id);
  const Icon = stage.icon;
  const Extra = EXTRAS[id];
  const idx = STAGES.findIndex(s => s.id === id);
  const next = STAGES[idx + 1];

  useEffect(() => {
    document.title = `${stage.name} · Agentic Loop`;
  }, [stage.name]);

  return (
    <div className={`stage-page stage-${stage.id}`}>
      <StageStepper current={id} />

      <div className="page-head stage-page-head">
        <div className="page-eyebrow"><Icon size={14} /> Stage {stage.step} · {stage.name}</div>
        <h1>{stage.headline}</h1>
        <p className="lede">{stage.outcome}</p>
        <div className="stage-page-meta">
          <span className="stage-audience">For {stage.audience}</span>
          <StageLink d={stage.primary} className="stage-cta" />
        </div>
      </div>

      <div className="stage-dest-grid">
        {stage.destinations.map(d => (
          <StageLink key={d.label} d={d} className="stage-dest-card">
            <span className="stage-dest-card-head">
              <strong>{d.label}</strong>
              {d.badge && <span className="stage-dest-badge">{d.badge}</span>}
            </span>
            <span className="stage-dest-card-desc">{d.desc}</span>
            <span className="stage-dest-card-go">
              {d.external ? <>Open <ExternalLink size={12} /></> : <>Go <ArrowRight size={12} /></>}
            </span>
          </StageLink>
        ))}
      </div>

      <div className="stage-boundary">
        <Info size={16} />
        <p>{stage.boundary}</p>
      </div>

      <Extra />

      {next ? (
        <Link to={next.route} className="stage-next">
          <span className="stage-next-label">Next stage · {next.step}</span>
          <span className="stage-next-name">{next.name}: {next.headline}</span>
          <ArrowRight size={18} />
        </Link>
      ) : (
        <Link to="/showcase" className="stage-next">
          <span className="stage-next-label">Close the loop</span>
          <span className="stage-next-name">Turn what you shipped into the next customer demo.</span>
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
