import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Presentation, Code2, Rocket, type LucideIcon } from 'lucide-react';
import { ASTRA_DEMOS_URL } from '../data/destinations';

interface Destination {
  label: string;
  to: string;
  external?: boolean;
}

interface Persona {
  who: string;
  goal: string;
  desc: string;
  icon: LucideIcon;
  primary: Destination;
  secondary: Destination[];
  note?: string;
}

const PERSONAS: Persona[] = [
  {
    who: 'Seller · SSP / AE',
    goal: 'Show a customer an agent today',
    desc: 'Open a ready-made industry demo and walk the customer through it. No code, no setup.',
    icon: Presentation,
    primary: { label: 'Open the Astra demos', to: ASTRA_DEMOS_URL, external: true },
    secondary: [{ label: 'Browse industry scenarios', to: '/scenarios' }],
    note: 'Demos use synthetic data. They are not meant to be deployed.',
  },
  {
    who: 'Solution engineer · Builder',
    goal: 'Build or customize an agent',
    desc: 'Follow a playbook with GitHub Copilot, run a technical workshop, or turn your own idea into a spec.',
    icon: Code2,
    primary: { label: 'Start with Getting started', to: '/playbooks/getting-started' },
    secondary: [
      { label: 'All playbooks', to: '/playbooks' },
      { label: 'Build from your idea', to: '#prompt' },
    ],
  },
  {
    who: 'Customer · Delivery team',
    goal: 'Start from something production-shaped',
    desc: 'Fork Kratos, a working app with auth, storage and tracing, or run the full idea-to-production pipeline.',
    icon: Rocket,
    primary: { label: 'Open Kratos', to: '/reference/kratos' },
    secondary: [{ label: 'Idea to production (Threadlight)', to: '/playbooks/threadlight-pipeline' }],
  },
];

interface Row {
  name: string;
  to: string;
  external?: boolean;
  what: string;
  who: string;
  code: string;
  deploy: string;
}

const COMPARISON: Row[] = [
  {
    name: 'Astra demos',
    to: ASTRA_DEMOS_URL,
    external: true,
    what: 'Polished industry demos on synthetic data',
    who: 'Sellers in customer meetings',
    code: 'None',
    deploy: 'No, demo only',
  },
  {
    name: 'Agentic Loop playbooks',
    to: '/playbooks',
    what: 'Step-by-step guides GitHub Copilot follows to build your agent',
    who: 'SEs, workshops, builders',
    code: 'Copilot writes it',
    deploy: 'Yes, with azd up',
  },
  {
    name: 'Kratos',
    to: '/reference/kratos',
    what: 'A working reference app: one agent, many skills, auth, storage, tracing',
    who: 'Teams that want a production-shaped base',
    code: 'Fork and extend',
    deploy: 'Yes',
  },
  {
    name: 'Idea to production',
    to: '/playbooks/threadlight-pipeline',
    what: 'The full pipeline: governance, evals, red-teaming, cost model, compliance pack',
    who: 'Pilots heading to an architecture review',
    code: 'Copilot writes it',
    deploy: 'Yes, in the customer tenant',
  },
];

function DestinationLink({ d, className }: { d: Destination; className: string }) {
  if (d.external) {
    return (
      <a href={d.to} className={className} target="_blank" rel="noreferrer">
        {d.label} <ExternalLink size={13} />
      </a>
    );
  }
  if (d.to.startsWith('#')) {
    return <a href={d.to} className={className}>{d.label} <ArrowRight size={13} /></a>;
  }
  return <Link to={d.to} className={className}>{d.label} <ArrowRight size={13} /></Link>;
}

export default function WhatToUseWhen() {
  return (
    <section className="wtuw" id="what-to-use-when">
      <div className="wtuw-head">
        <div className="section-eyebrow">Where to start</div>
        <h2>Pick the path that matches what you need to do.</h2>
      </div>

      <div className="wtuw-path-grid" aria-label="Start paths by persona">
        {PERSONAS.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.who} className="wtuw-path-card">
              <div className="wtuw-path-card-top">
                <span className="wtuw-path-number">{p.who}</span>
                <span className="wtuw-path-icon"><Icon size={18} /></span>
              </div>
              <h3>{p.goal}</h3>
              <p>{p.desc}</p>
              {p.note && <p className="wtuw-path-note">{p.note}</p>}
              <div className="wtuw-path-links">
                <DestinationLink d={p.primary} className="wtuw-path-primary" />
                {p.secondary.map(s => (
                  <DestinationLink key={s.label} d={s} className="wtuw-path-secondary" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <details className="wtuw-compare">
        <summary>Astra demos, playbooks, Kratos or Idea to production: which one do I use?</summary>
        <div className="wtuw-compare-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Option</th>
                <th scope="col">What you get</th>
                <th scope="col">Best for</th>
                <th scope="col">Code</th>
                <th scope="col">Deploy to a customer?</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(r => (
                <tr key={r.name}>
                  <th scope="row">
                    {r.external ? (
                      <a href={r.to} target="_blank" rel="noreferrer">{r.name}</a>
                    ) : (
                      <Link to={r.to}>{r.name}</Link>
                    )}
                  </th>
                  <td>{r.what}</td>
                  <td>{r.who}</td>
                  <td>{r.code}</td>
                  <td>{r.deploy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
