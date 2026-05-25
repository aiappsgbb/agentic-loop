import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ExternalLink, type LucideIcon } from 'lucide-react';

export interface PickerOption {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  link?: string;
}

interface Props {
  label: string;
  options: PickerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  triggerIcon?: LucideIcon;
}

export default function CapabilityPicker({ label, options, selected, onChange, triggerIcon: TriggerIcon }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  return (
    <div className="picker" ref={ref}>
      <button className="picker-btn" onClick={() => setOpen(v => !v)}>
        {TriggerIcon && <TriggerIcon size={15} />}
        <span>{label}</span>
        {selected.length > 0 ? (
          <span className="count">{selected.length}</span>
        ) : (
          <span className="label-muted">Any</span>
        )}
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div className="picker-menu" role="listbox">
          {options.map(opt => {
            const isSel = selected.includes(opt.id);
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                className={`picker-option ${isSel ? 'selected' : ''}`}
                onClick={() => toggle(opt.id)}
                role="option"
                aria-selected={isSel}
              >
                <div className="opt-icon"><Icon size={16} /></div>
                <div className="opt-body">
                  <span>{opt.label}</span>
                  {opt.description && <span className="opt-sub">{opt.description}</span>}
                </div>
                {opt.link && (
                  <Link
                    to={opt.link}
                    className="opt-link"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    title={`Learn about ${opt.label}`}
                    aria-label={`Learn about ${opt.label}`}
                  >
                    <ExternalLink size={13} />
                  </Link>
                )}
                <div className="check">{isSel && <Check size={12} />}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
