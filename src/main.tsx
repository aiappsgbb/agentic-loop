import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Scenarios from './pages/Scenarios';
import Playbooks from './pages/Playbooks';
import PlaybookPage from './pages/PlaybookPage';
import SkillsCatalog from './pages/SkillsCatalog';
import ScenarioPlaybook from './pages/ScenarioPlaybook';
import Kratos from './pages/Kratos';
import { ThemeProvider } from './components/ThemeProvider';
import AgenticLoopConcept from './pages/concepts/AgenticLoop';
import Agents from './pages/concepts/Agents';
import Skills from './pages/concepts/Skills';
import Tools from './pages/concepts/Tools';
import PlatformOverview from './pages/concepts/PlatformOverview';
import Foundry from './pages/concepts/Foundry';
import Azure from './pages/concepts/Azure';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="scenarios" element={<Scenarios />} />
            <Route path="scenarios/:id" element={<ScenarioPlaybook />} />
            <Route path="playbooks" element={<Playbooks />} />
            <Route path="playbooks/:slug" element={<PlaybookPage />} />
            <Route path="skills" element={<SkillsCatalog />} />
            <Route path="reference/kratos" element={<Kratos />} />
            <Route path="kratos" element={<Navigate to="/reference/kratos" replace />} />
            <Route path="concepts">
              <Route index element={<Navigate to="agentic-loop" replace />} />
              <Route path="agentic-loop" element={<AgenticLoopConcept />} />
              <Route path="agents" element={<Agents />} />
              <Route path="skills" element={<Skills />} />
              <Route path="tools" element={<Tools />} />
              <Route path="platform">
                <Route index element={<PlatformOverview />} />
                <Route path="overview" element={<PlatformOverview />} />
                <Route path="foundry" element={<Foundry />} />
                <Route path="azure" element={<Azure />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
