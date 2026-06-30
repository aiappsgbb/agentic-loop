import { StrictMode, Suspense, lazy, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

// Route-based code splitting: only Home ships in the initial bundle; every
// other route (and heavy deps like react-markdown / mermaid / highlight.js)
// loads on demand.
const Scenarios = lazy(() => import('./pages/Scenarios'));
const ScenarioPlaybook = lazy(() => import('./pages/ScenarioPlaybook'));
const Playbooks = lazy(() => import('./pages/Playbooks'));
const PlaybookPage = lazy(() => import('./pages/PlaybookPage'));
const SkillsCatalog = lazy(() => import('./pages/SkillsCatalog'));
const SkillDetail = lazy(() => import('./pages/SkillDetail'));
const Kratos = lazy(() => import('./pages/Kratos'));
const AgenticLoopConcept = lazy(() => import('./pages/concepts/AgenticLoop'));
const Agents = lazy(() => import('./pages/concepts/Agents'));
const Skills = lazy(() => import('./pages/concepts/Skills'));
const Tools = lazy(() => import('./pages/concepts/Tools'));
const AgentHarness = lazy(() => import('./pages/concepts/AgentHarness'));
const PlatformOverview = lazy(() => import('./pages/concepts/PlatformOverview'));
const Foundry = lazy(() => import('./pages/concepts/Foundry'));
const Azure = lazy(() => import('./pages/concepts/Azure'));
const NotFound = lazy(() => import('./pages/NotFound'));

function lazyRoute(node: ReactNode) {
  return <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">Loading…</div>}>{node}</Suspense>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="scenarios" element={lazyRoute(<Scenarios />)} />
            <Route path="scenarios/:id" element={lazyRoute(<ScenarioPlaybook />)} />
            <Route path="playbooks" element={lazyRoute(<Playbooks />)} />
            <Route path="playbooks/:slug" element={lazyRoute(<PlaybookPage />)} />
            <Route path="skills" element={lazyRoute(<SkillsCatalog />)} />
            <Route path="skills/:name" element={lazyRoute(<SkillDetail />)} />
            <Route path="kratos" element={lazyRoute(<Kratos />)} />
            <Route path="concepts">
              <Route index element={<Navigate to="agentic-loop" replace />} />
              <Route path="agentic-loop" element={lazyRoute(<AgenticLoopConcept />)} />
              <Route path="agents" element={lazyRoute(<Agents />)} />
              <Route path="skills" element={lazyRoute(<Skills />)} />
              <Route path="tools" element={lazyRoute(<Tools />)} />
              <Route path="agent-harness" element={lazyRoute(<AgentHarness />)} />
              <Route path="platform">
                <Route index element={lazyRoute(<PlatformOverview />)} />
                <Route path="overview" element={lazyRoute(<PlatformOverview />)} />
                <Route path="foundry" element={lazyRoute(<Foundry />)} />
                <Route path="azure" element={lazyRoute(<Azure />)} />
              </Route>
            </Route>
            <Route path="*" element={lazyRoute(<NotFound />)} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
