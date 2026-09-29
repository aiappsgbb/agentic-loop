import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { STAGES, type StageId } from '../data/stages';

export default function StageStepper({ current }: { current: StageId }) {
  return (
    <nav className="stage-stepper" aria-label="Agentic Loop stages">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const active = s.id === current;
        return (
          <span key={s.id} className="stage-stepper-item">
            <Link
              to={s.route}
              className={`stage-stepper-link stage-${s.id} ${active ? 'active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="stage-stepper-step">{s.step}</span>
              <Icon size={14} />
              {s.name}
            </Link>
            {i < STAGES.length - 1 && <ChevronRight size={14} className="stage-stepper-sep" aria-hidden />}
          </span>
        );
      })}
    </nav>
  );
}
