import { NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, Layers, BookOpen, Sparkles, Bot, Wrench, Workflow,
  ChevronRight, PanelLeftClose, PanelLeft, Sun, Moon, Monitor, Infinity as InfinityIcon, Library, Cpu, Lightbulb, Compass, Rocket
} from 'lucide-react';
import { type ThemePref } from './ThemeContext';
import { useTheme } from './useTheme';
import { asset } from '../data/asset';

interface Props { collapsed: boolean; onToggle: () => void; }

export default function Sidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const conceptsActive = location.pathname.startsWith('/concepts') && !location.pathname.startsWith('/concepts/platform');
  const platformActive = location.pathname.startsWith('/concepts/platform');
  const [conceptsOpen, setConceptsOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(true);
  const conceptsExpanded = conceptsOpen || conceptsActive;
  const platformExpanded = platformOpen || platformActive;
  const { pref, setPref } = useTheme();

  const themeOptions: { value: ThemePref; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <aside className="sidebar">
      <Link to="/" className="brand" aria-label="Agentic Loop home">
        <div className="brand-mark"><InfinityIcon size={20} strokeWidth={2.5} /></div>
        {!collapsed && <span className="brand-text">Agentic Loop</span>}
      </Link>

      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home className="icon" size={18} />
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/kratos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Rocket className="icon" size={18} />
          <span className="nav-label">Kratos</span>
          <span className="nav-badge">Live</span>
        </NavLink>

        <div className="nav-section-title">Build</div>
        <NavLink to="/playbooks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen className="icon" size={18} />
          <span className="nav-label">Playbooks</span>
        </NavLink>
        <NavLink to="/skills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Library className="icon" size={18} />
          <span className="nav-label">Skills catalog</span>
        </NavLink>
        <NavLink to="/scenarios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Layers className="icon" size={18} />
          <span className="nav-label">Industry scenarios</span>
        </NavLink>

        <div className="nav-section-title">Learn</div>
        <div
          className={`nav-item ${conceptsActive ? 'active' : ''} ${conceptsExpanded ? 'open' : ''}`}
          onClick={() => setConceptsOpen(v => !v)}
          role="button"
        >
          <Lightbulb className="icon" size={18} />
          <span className="nav-label">Concepts</span>
          <ChevronRight className="chev" size={14} />
        </div>
        {conceptsExpanded && !collapsed && (
          <div className="sub-nav">
            <NavLink to="/concepts/agentic-loop" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Workflow className="icon" size={16} />
              <span className="nav-label">Agentic Loop</span>
            </NavLink>
            <NavLink to="/concepts/agents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Bot className="icon" size={16} />
              <span className="nav-label">Agents</span>
            </NavLink>
            <NavLink to="/concepts/skills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Sparkles className="icon" size={16} />
              <span className="nav-label">Skills</span>
            </NavLink>
            <NavLink to="/concepts/tools" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Wrench className="icon" size={16} />
              <span className="nav-label">Tools</span>
            </NavLink>
          </div>
        )}

        <div
          className={`nav-item ${platformActive ? 'active' : ''} ${platformExpanded ? 'open' : ''}`}
          onClick={() => setPlatformOpen(v => !v)}
          role="button"
        >
          <Cpu className="icon" size={18} />
          <span className="nav-label">Platform</span>
          <ChevronRight className="chev" size={14} />
        </div>
        {platformExpanded && !collapsed && (
          <div className="sub-nav">
            <NavLink
              to="/concepts/platform"
              end
              className={({ isActive }) => `nav-item ${isActive || location.pathname === '/concepts/platform/overview' ? 'active' : ''}`}
            >
              <Compass className="icon" size={16} />
              <span className="nav-label">Overview</span>
            </NavLink>
            <NavLink to="/concepts/platform/foundry" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <img src={asset('/Foundry.svg')} alt="" className="icon nav-asset" />
              <span className="nav-label">Foundry</span>
            </NavLink>
            <NavLink to="/concepts/platform/azure" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <img src={asset('/Azure.svg')} alt="" className="icon nav-asset" />
              <span className="nav-label">Azure</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="footer-row">
            <div className="theme-switch" role="radiogroup" aria-label="Theme">
              {themeOptions.map(opt => {
                const Icon = opt.icon;
                const active = pref === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={`theme-opt ${active ? 'active' : ''}`}
                    onClick={() => setPref(opt.value)}
                    title={opt.label}
                    aria-label={opt.label}
                    aria-pressed={active}
                  >
                    <Icon size={14} />
                    <span className="nav-label theme-opt-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="collapse-btn footer-collapse"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        ) : (
          <button
            className="collapse-btn footer-collapse is-expand"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}
        {!collapsed && <span className="nav-label footer-credit">Made with ❤️ by AI Apps GBB's - EMEA</span>}
      </div>
    </aside>
  );
}
