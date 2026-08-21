import ScenariosGallery from '../components/ScenariosGallery';
import LensSwitcher from '../components/LensSwitcher';

export default function Scenarios() {
  return (
    <>
      <div className="page-head">
        <LensSwitcher />
        <h1>Start from a business problem.</h1>
        <p className="lede">
          Pick a use case from your industry, copy the prompt, and the loop builds it. Every scenario ships a paste-ready prompt plus the architecture patterns behind it.
        </p>
      </div>
      <ScenariosGallery browse showExplore={false} />
    </>
  );
}
