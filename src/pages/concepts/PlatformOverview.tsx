import ArchitectureStrip from '../../components/ArchitectureStrip';

export default function PlatformOverview() {
  return (
    <>
      <div className="page-head platform-overview-head">
        <div className="page-eyebrow">Platform · Reference Architecture</div>
        <h1>The reference architecture for the Agentic Loop.</h1>
        <p className="lede">
          The blueprint every Agentic Loop build starts from. It shows how skills and tools turn model calls into business action, then maps each capability to the Azure services that make it secure, observable, governed, and scalable.
        </p>
      </div>

      <ArchitectureStrip variant="full" />
    </>
  );
}
