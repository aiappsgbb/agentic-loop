import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import './styles/app.css';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
