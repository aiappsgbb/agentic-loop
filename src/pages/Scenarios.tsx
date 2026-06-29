import ScenariosGallery from '../components/ScenariosGallery';
import { Link } from 'react-router-dom';

export default function Scenarios() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Scenarios · the WHAT</div>
        <h1>Start from a vertical use case.</h1>
        <p className="lede">
          Scenarios are vertical, industry-shaped blueprints. Every scenario is assembled from reusable <Link to="/playbooks">Playbooks</Link>.
        </p>
      </div>
      <ScenariosGallery browse showExplore={false} />
    </>
  );
}
