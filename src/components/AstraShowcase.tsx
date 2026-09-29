import { ArrowRight } from 'lucide-react';
import { getAstraUrl } from '../data/astra';
import { useTheme } from './useTheme';

export default function AstraShowcase() {
  const { resolved } = useTheme();
  return (
    <section className="astra-showcase" aria-labelledby="astra-title">
      <div className="astra-showcase-copy">
        <h2 id="astra-title">GPT-6 Astra <span>on Azure</span></h2>
        <p>
          Explore interactive demos for relationship management, adaptive lending,
          and supply chain.
        </p>
        <p className="astra-showcase-note">Built with Microsoft Foundry. Uses synthetic business data.</p>
      </div>
      <div className="astra-showcase-action">
        <a
          className="astra-showcase-link"
          href={getAstraUrl(resolved)}
        >
          Explore Astra demos <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
