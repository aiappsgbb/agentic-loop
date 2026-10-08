import { useCallback, useState, type ReactNode } from 'react';
import { WorkshopContext, newWorkshopDraft, type WorkshopDraft } from './WorkshopContext';
import workshopBriefs from '../data/workshop-briefs.json';

export default function WorkshopProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, WorkshopDraft>>(() => ({
    customer: newWorkshopDraft(workshopBriefs[Math.floor(Math.random() * workshopBriefs.length)]),
  }));
  const update = useCallback((key: string, draft: WorkshopDraft) => {
    setDrafts(previous => ({ ...previous, [key]: draft }));
  }, []);
  return <WorkshopContext value={{ drafts, update }}>{children}</WorkshopContext>;
}
