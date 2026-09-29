import { ExternalLink } from 'lucide-react';

export default function AstraShowcase() {
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
          href="https://astra-demo.icyground-ce9cbed9.westeurope.azurecontainerapps.io/"
          target="_blank"
          rel="noopener noreferrer"
          aria-describedby="astra-link-note"
        >
          Explore Astra demos <ExternalLink size={16} aria-hidden="true" />
        </a>
        <span id="astra-link-note">Opens in a new tab</span>
      </div>
    </section>
  );
}
