import { ArrowRight } from 'lucide-react';

export default function HomeHeadline() {
  return (
    <section className="hero">
      <h1>
        Ship your ideas with the <span className="gradient-text">Agentic Loop</span>
        <span className="sparkle" aria-hidden />
      </h1>
      <p className="lede">
        Build, Run and Scale AI apps &amp; agents with GitHub Copilot + Microsoft Foundry<br />
        <ArrowRight size={16} className="lede-arrow" aria-hidden /> in one continuous loop.
      </p>
    </section>
  );
}
