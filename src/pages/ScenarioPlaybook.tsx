import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hammer, Cloud, TrendingUp, CheckCircle2, ExternalLink, BookOpen, Rocket, ArrowRight } from 'lucide-react';
import scenarios from '../data/scenarios.json';
import { playbooksForScenario, playbookHasDeck } from '../data/links';

interface Scenario {
  id: string; name: string; industry: string; description: string; image: string; tags: string[]; link?: string;
}

function resolveImage(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  return '/' + src;
}

interface Chapter {
  id: 'build' | 'run' | 'scale';
  title: string;
  intro: string;
  icon: typeof Hammer;
  steps: { title: string; detail: string }[];
}

function buildChapters(s: Scenario): Chapter[] {
  return [
    {
      id: 'build',
      title: 'Build',
      icon: Hammer,
      intro: `Use GitHub Copilot to scaffold the ${s.name.toLowerCase()} agent with the skills, tools, and evals it needs.`,
      steps: [
        { title: 'Clone the reference repo', detail: `gh repo fork agentic-loop/${s.id} --clone — opens a Copilot-ready workspace with agent.yaml, skills/, and evals/.` },
        { title: 'Describe the agent in agents.md', detail: `Capture the goals, KPIs, guardrails, and the ${s.tags.join(', ')} capabilities the agent must own. Copilot uses this as the source of truth.` },
        { title: 'Generate skills with Copilot Chat', detail: `Prompt Copilot to author each skill from agents.md — prompts, tool bindings, and unit evals are generated together so every capability ships testable.` },
        { title: 'Wire tools and knowledge', detail: `Register MCP / OpenAPI tools and connect grounded knowledge (SharePoint, Fabric, Blob, web) via the Foundry connectors catalog.` },
        { title: 'Run the offline eval suite', detail: `npm run eval — the harness runs golden conversations, scores them with judge models, and posts the report to your PR.` },
      ],
    },
    {
      id: 'run',
      title: 'Run',
      icon: Cloud,
      intro: 'Promote the agent to Microsoft Foundry with vetted defaults for identity, networking, and observability.',
      steps: [
        { title: 'Provision the Foundry project', detail: `az foundry project create --name ${s.id} --location eastus2 — sets up the model catalog, content safety, and OpenTelemetry exporters.` },
        { title: 'Deploy the agent', detail: `az foundry agent deploy --file agent.yaml — Foundry handles model routing, retries, rate limits, and managed identity.` },
        { title: 'Enable governance', detail: 'Bind your Entra groups, apply policy packs, and turn on jailbreak shields and PII redaction for every tool call.' },
        { title: 'Connect to the channel', detail: `Expose the agent via Teams, Web Chat, or REST. Foundry SDKs handle session, memory, and human hand-offs.` },
        { title: 'Watch the live dashboard', detail: 'Open the Foundry portal to see traces, eval scores, latency, and cost in real time — filtered to this scenario.' },
      ],
    },
    {
      id: 'scale',
      title: 'Scale',
      icon: TrendingUp,
      intro: 'Close the loop: turn production signals into the next iteration — automatically.',
      steps: [
        { title: 'Turn on continuous evaluation', detail: 'Foundry samples live traces, scores them against your eval set, and trends quality, safety, and cost across versions.' },
        { title: 'Curate datasets from production', detail: 'Promote interesting traces into versioned datasets — golden, regression, red-team — that gate future deployments.' },
        { title: 'Optimize prompts automatically', detail: 'The prompt optimizer proposes new variants from production failures and opens a Copilot PR with the diff and eval evidence.' },
        { title: 'Roll out safely', detail: 'Use canary deployments and traffic splitting in Foundry; promote when the new version beats the baseline on every guardrail.' },
        { title: 'Federate to new teams', detail: `Publish the ${s.name} agent and its skills to your internal catalog so other teams can fork and adapt with one command.` },
      ],
    },
  ];
}

export default function ScenarioPlaybook() {
  const { id } = useParams();
  const scenario = useMemo(() => (scenarios as Scenario[]).find(s => s.id === id), [id]);
  if (!scenario) {
    return (
      <div className="page-head">
        <Link to="/scenarios" className="back-link"><ArrowLeft size={14} /> Back to scenarios</Link>
        <h1>Scenario not found</h1>
      </div>
    );
  }
  const chapters = buildChapters(scenario);
  const relatedPlaybooks = playbooksForScenario(scenario);

  return (
    <>
      <Link to="/scenarios" className="back-link"><ArrowLeft size={14} /> Back to scenarios</Link>
      <div className="playbook-hero">
        <div className="playbook-hero-body">
          <div className="page-eyebrow">{scenario.industry} · Scenario</div>
          <h1>{scenario.name}</h1>
          <p className="lede">{scenario.description}</p>
          <div className="scenario-tags" style={{ marginTop: 14 }}>
            {scenario.tags.map(t => <span key={t} className="scenario-tag">{t}</span>)}
          </div>
          {scenario.link && (
            <a
              className="playbook-learn-more"
              href={scenario.link}
              target="_blank"
              rel="noreferrer"
            >
              Learn more about this scenario <ExternalLink size={14} />
            </a>
          )}
        </div>
        <div className="playbook-hero-img">
          <img src={resolveImage(scenario.image)} alt={scenario.name} />
        </div>
      </div>

      <section className="scenario-bridge">
        <div className="scenario-bridge-card built-from">
          <div className="scenario-bridge-head">
            <BookOpen size={16} />
            <div>
              <h2>Built from these playbooks</h2>
              <p>This vertical outcome is assembled from horizontal techniques. Master each one on its own.</p>
            </div>
          </div>
          <div className="scenario-bridge-links">
            {relatedPlaybooks.map(p => (
              playbookHasDeck(p.slug) ? (
                <Link key={p.slug} to={`/playbooks/${p.slug}`} className="scenario-bridge-pill">
                  {p.name} <ArrowRight size={13} />
                </Link>
              ) : (
                <Link key={p.slug} to="/playbooks" className="scenario-bridge-pill">
                  {p.name} <ArrowRight size={13} />
                </Link>
              )
            ))}
          </div>
        </div>
        <div className="scenario-bridge-card try-live">
          <div className="scenario-bridge-head">
            <Rocket size={16} />
            <div>
              <h2>Prefer to try it live first?</h2>
              <p>Experience a prebuilt agent in Kratos before you build your own version.</p>
            </div>
          </div>
          <Link to="/kratos" className="scenario-bridge-cta">
            Try live in Kratos <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {chapters.map(c => {
        const Icon = c.icon;
        return (
          <section key={c.id} className="chapter">
            <header className="chapter-head">
              <div className="chapter-ic"><Icon size={20} /></div>
              <div>
                <div className="chapter-eyebrow">Chapter · {c.id}</div>
                <h2>{c.title}</h2>
                <p>{c.intro}</p>
              </div>
            </header>
            <ol className="chapter-steps">
              {c.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.detail}</p>
                  </div>
                  <CheckCircle2 className="step-check" size={18} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}
