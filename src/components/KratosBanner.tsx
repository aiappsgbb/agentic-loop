import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';

export default function KratosBanner() {
  return (
    <section className="kratos-banner">
      <div className="kratos-banner-mark"><Rocket size={20} /></div>
      <div className="kratos-banner-body">
        <span className="kratos-banner-eyebrow">Reference app</span>
        <h3>See the Agentic Loop running end to end with Kratos</h3>
        <p>One agent, swappable MCP skills, Copilot SDK + Foundry — a production-shaped blueprint to learn from.</p>
      </div>
      <Link to="/kratos" className="kratos-banner-cta">
        Explore Kratos <ArrowRight size={15} />
      </Link>
    </section>
  );
}
