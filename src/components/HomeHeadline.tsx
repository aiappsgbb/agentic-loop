import { Infinity as InfinityIcon } from 'lucide-react';

export default function HomeHeadline() {
  return (
    <section className="hero hero-compact">
      <div className="hero-eyebrow"><InfinityIcon size={14} /> Agentic Loop</div>
      <h1>
        Showcase. Build.
        <span className="gradient-text"> Productionise.</span>
      </h1>
      <p className="lede">
        One starting point for agents on Microsoft Foundry: show a customer a live industry demo, build
        their version with GitHub Copilot, then take it to production on Azure with governance and evals
        built in. Pick the stage you're at.
      </p>
    </section>
  );
}
