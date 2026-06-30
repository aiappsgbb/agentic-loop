import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import './styles/app.css';

const BASE_TITLE = 'Agentic Loop';
const TITLES: Record<string, string> = {
  '/': 'Agentic Loop · Build with Copilot, run with Foundry',
  '/scenarios': 'Industry scenarios',
  '/playbooks': 'Playbooks',
  '/skills': 'Skills catalog',
  '/kratos': 'Kratos',
  '/concepts/agentic-loop': 'The Agentic Loop',
  '/concepts/agents': 'Agents',
  '/concepts/skills': 'Skills',
  '/concepts/tools': 'Tools',
  '/concepts/agent-harness': 'Agent Harness',
  '/concepts/platform': 'Platform overview',
  '/concepts/platform/overview': 'Platform overview',
  '/concepts/platform/foundry': 'Microsoft Foundry',
  '/concepts/platform/azure': 'Azure',
};

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on every navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Set a per-route document title for known static routes. Dynamic detail
  // pages set their own title via useEffect, so we skip unknown paths here.
  useEffect(() => {
    const title = TITLES[location.pathname];
    if (title) {
      document.title = title === TITLES['/'] ? title : `${title} · ${BASE_TITLE}`;
    }
  }, [location.pathname]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <button
        className="mobile-menu-btn"
        type="button"
        onClick={() => setMobileOpen(v => !v)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
      </button>
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
