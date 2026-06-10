import ScenariosGallery from '../components/ScenariosGallery';
import { Link } from 'react-router-dom';

export default function Scenarios() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Scenarios · the WHAT</div>
        <h1>Start from a proven outcome.</h1>
        <p className="lede">
          Scenarios are vertical, industry-shaped blueprints — each one ships with a reference repo, Foundry deployment, and an evaluation harness so you can fork, adapt, and ship in a single sprint. Every scenario is assembled from reusable <Link to="/playbooks">Playbooks</Link>. Pick a scenario when you know the <em>outcome</em> you want.
        </p>
      </div>
      <ScenariosGallery showExplore={false} />
    </>
  );
}
