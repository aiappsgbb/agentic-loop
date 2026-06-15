import ArchitectureStrip from '../../components/ArchitectureStrip';

export default function PlatformOverview() {
  return (
    <>
      <div className="page-head platform-overview-head">
        <div className="page-eyebrow">Platform · Overview</div>
        <h1>The reference architecture for the Agentic Loop.</h1>
        <p className="lede">
          Show how Agentic Loops turn skills and tools into business action, then map each capability to the Azure services that make it secure, observable, governed, and scalable.
        </p>
      </div>

      <ArchitectureStrip variant="full" />
    </>
  );
}
