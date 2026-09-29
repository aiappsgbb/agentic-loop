import { Link } from 'react-router-dom';
import { ASTRA_DEMOS_URL } from '../data/destinations';
import type { StageId } from '../data/stages';

interface Row {
  stage: StageId;
  stageLabel: string;
  name: string;
  to: string;
  external?: boolean;
  what: string;
  who: string;
  code: string;
  deploy: string;
}

const ROWS: Row[] = [
  {
    stage: 'showcase',
    stageLabel: 'Showcase',
    name: 'Astra demos',
    to: ASTRA_DEMOS_URL,
    external: true,
    what: 'Polished industry demos on synthetic data',
    who: 'Sellers in customer meetings',
    code: 'None',
    deploy: 'No, demo only',
  },
  {
    stage: 'build',
    stageLabel: 'Build',
    name: 'Playbooks & scenarios',
    to: '/build',
    what: 'Step-by-step guides and prompts GitHub Copilot follows to build your agent',
    who: 'SEs, workshops, builders',
    code: 'Copilot writes it',
    deploy: 'To your subscription, for pilots',
  },
  {
    stage: 'productionise',
    stageLabel: 'Productionise',
    name: 'Kratos',
    to: '/reference/kratos',
    what: 'A production-shaped app: one agent, many skills, Entra sign-in, Cosmos DB, tracing',
    who: 'Teams that want a base to fork',
    code: 'Fork and extend',
    deploy: 'Yes, with azd up',
  },
  {
    stage: 'productionise',
    stageLabel: 'Productionise',
    name: 'Idea to production',
    to: '/playbooks/threadlight-pipeline',
    what: 'The full pipeline: governance, evals, red-teaming, cost model, compliance pack',
    who: 'Pilots heading to an architecture review',
    code: 'Copilot writes it',
    deploy: 'Yes, in the customer tenant',
  },
];

export default function StageCompare() {
  return (
    <details className="wtuw-compare">
      <summary>Astra demos, playbooks, Kratos or Idea to production: which one do I use?</summary>
      <div className="wtuw-compare-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Option</th>
              <th scope="col">What you get</th>
              <th scope="col">Best for</th>
              <th scope="col">Code</th>
              <th scope="col">Deploy to a customer?</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.name}>
                <td><span className={`stage-pill stage-${r.stage}`}>{r.stageLabel}</span></td>
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
  );
}
