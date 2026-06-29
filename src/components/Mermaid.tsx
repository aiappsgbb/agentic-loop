import { useEffect, useId, useRef, useState } from 'react';

function readTheme(): 'dark' | 'default' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'default' : 'dark';
}

/** Renders a Mermaid diagram from its source, re-rendering on theme changes. */
export default function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const id = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'default'>(readTheme);
  const [error, setError] = useState<string | null>(null);

  // Track light/dark theme toggles on the document root.
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // (Re)render whenever the chart source or theme changes. Mermaid is loaded
  // lazily so it only ships with the playbook route, not the whole app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'strict' });
        const { svg } = await mermaid.render(`${id}-${theme}`, chart);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, theme, id]);

  if (error) {
    return (
      <pre className="md-code mermaid-error">
        <code>{`${error}\n\n${chart}`}</code>
      </pre>
    );
  }

  return <div className="mermaid-diagram" ref={ref} role="img" aria-label="Diagram" />;
}
