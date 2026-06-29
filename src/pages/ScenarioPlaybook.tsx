import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, BookOpen, PlayCircle, ArrowRight } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import scenarios from '../data/scenarios.json';
import { playbooksForScenario, playbookHasDeck, type Scenario } from '../data/links';
import GreenfieldBuilder from '../components/GreenfieldBuilder';
import { asset } from '../data/asset';

function resolveImage(src: string) {
  return asset(src);
}

export default function ScenarioPlaybook() {
  const { id } = useParams();
  const scenario = useMemo(() => (scenarios as Scenario[]).find(s => s.id === id), [id]);
  useEffect(() => {
    document.title = scenario ? `${scenario.name} · Agentic Loop` : 'Scenario not found · Agentic Loop';
  }, [scenario]);
  if (!scenario) {
    return (
      <div className="page-head">
        <Link to="/scenarios" className="back-link"><ArrowLeft size={14} /> Back to scenarios</Link>
        <h1>Scenario not found</h1>
      </div>
    );
  }
  const relatedPlaybooks = playbooksForScenario(scenario);

  return (
    <>
      <div className="scenario-detail-topbar">
        <Link to="/scenarios" className="playbook-back" aria-label="Back to scenarios">
          <ArrowLeft size={16} /> <span>Scenarios</span>
        </Link>
        <ShareButton title={scenario.name} />
      </div>
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
          <img src={resolveImage(scenario.image)} alt={scenario.name} loading="lazy" />
        </div>
      </div>

      <section className="scenario-bridge">
        <div className="scenario-bridge-card built-from">
          <div className="scenario-bridge-head">
            <BookOpen size={16} />
            <div>
              <h2>Built from these playbooks</h2>
              <p>This vertical outcome is assembled from horizontal patterns. Master each one on its own.</p>
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
        <div className="scenario-bridge-card scenario-demo">
          <div className="scenario-bridge-head">
            <PlayCircle size={16} />
            <div>
              <h2>Watch the demo</h2>
              <p>See the {scenario.name} agent in action for {scenario.industry}.</p>
            </div>
          </div>
          <div className="scenario-demo-video">
            <video
              controls
              poster={resolveImage(scenario.image)}
              src={scenario.videoFileName ? asset(`videos/${scenario.videoFileName}`) : undefined}
            >
              Your browser does not support the video tag.
            </video>
            {!scenario.videoFileName && <span className="scenario-demo-badge">Coming soon</span>}
          </div>
        </div>
      </section>

      <GreenfieldBuilder
        key={scenario.id}
        scenario={scenario}
        eyebrow="Agentic Launchpad"
        heading={`Build "${scenario.name}" with Copilot.`}
        intro={
          <>
            Your prompt is pre-seeded from this scenario — adjust the capabilities and building blocks,
            then click <strong>Make it real</strong> to go from idea to a deployed agentic solution.
          </>
        }
      />
    </>
  );
}
