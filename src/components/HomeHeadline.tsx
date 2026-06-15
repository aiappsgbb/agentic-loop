import { Sparkles } from 'lucide-react';

export default function HomeHeadline() {
  return (
    <section className="hero">
      <div className="hero-eyebrow"><Sparkles size={14} /> The agentic production gap</div>
      <h1>
        Stop shipping agent demos.
        <span className="gradient-text"> Start running production agents.</span>
        <span className="sparkle" aria-hidden />
      </h1>
      <p className="lede">
        Copilot made the pilot fast. The hard part is turning that pilot into a governed,
        observable, evaluated system the business can trust and IT can evolve.
      </p>
      <div className="hero-statements" aria-label="Problem and solution statement">
        <div className="hero-statement problem">
          <span className="hero-statement-kicker">Problem</span>
          <h2>Pilots are cheap. Ungoverned production is expensive.</h2>
          <p>
            Agents either stay trapped in developer-led experiments, or spread through the business
            faster than security, identity, evals, and cost controls can keep up.
          </p>
        </div>
        <div className="hero-statement solution">
          <span className="hero-statement-kicker">Solution</span>
          <h2>Standardize the path from idea to pilot to production.</h2>
          <p>
            Agentic Loop combines GitHub Copilot SDK for execution, SKILLs for specialization,
            and Microsoft Foundry for governed runtime, models, evals, and measurable scale.
          </p>
        </div>
      </div>
    </section>
  );
}
