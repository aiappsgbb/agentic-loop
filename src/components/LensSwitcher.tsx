import { NavLink } from 'react-router-dom';
import { Building2, Boxes } from 'lucide-react';

const LENSES = [
  { to: '/scenarios', label: 'Industry', icon: Building2 },
  { to: '/playbooks', label: 'Capability', icon: Boxes },
];

export default function LensSwitcher() {
  return (
    <div className="lens-switcher" role="navigation" aria-label="Browse by">
      <span className="lens-switcher-label">Browse by</span>
      <div className="lens-switcher-options">
        {LENSES.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `lens-option ${isActive ? 'active' : ''}`}
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
