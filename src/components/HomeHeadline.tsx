import { Link } from 'react-router-dom';
import { Infinity as InfinityIcon } from 'lucide-react';
import { ASTRA_DEMOS_URL } from '../data/destinations';

export default function HomeHeadline() {
  return (
    <section className="hero">
      <div className="hero-eyebrow"><InfinityIcon size={14} /> Start here</div>
      <h1>
        Build agents with GitHub Copilot.
        <span className="gradient-text"> Run them on Microsoft Foundry.</span>
        <span className="sparkle" aria-hidden />
      </h1>
      <p className="lede">
        Agentic Loop is how Microsoft takes an agent from idea to production on Azure. You describe
        what the agent should do; GitHub Copilot follows our playbooks and skills to write the agent,
        its tools and the Azure infrastructure, then deploys it with <code>azd up</code>.
      </p>
      <div className="hero-statements" aria-label="What Agentic Loop is and is not">
        <div className="hero-statement solution">
          <span className="hero-statement-kicker">What it is</span>
          <h2>A repeatable way to build your own agent.</h2>
          <p>
            Playbooks, skills and a reference architecture for Microsoft Foundry and Azure. You end up
            with code you own, deployed in your tenant, with evaluation and observability built in.
          </p>
        </div>
        <div className="hero-statement problem">
          <span className="hero-statement-kicker">What it is not</span>
          <h2>A demo you click through.</h2>
          <p>
            To show a customer something today, use the{' '}
            <a href={ASTRA_DEMOS_URL} target="_blank" rel="noreferrer">Astra industry demos</a>. To start
            from a working, production-shaped app, use <Link to="/reference/kratos">Kratos</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
