import ScenariosGallery from '../components/ScenariosGallery';

export default function Scenarios() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Scenarios</div>
        <h1>Patterns proven in production.</h1>
        <p className="lede">
          Browse end-to-end agentic blueprints — each one ships with a reference repo, Foundry deployment, and an evaluation harness so you can fork, adapt, and ship in a single sprint.
        </p>
      </div>
      <ScenariosGallery showExplore={false} />
    </>
  );
}
