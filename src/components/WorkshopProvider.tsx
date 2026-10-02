import { useCallback, useState, type ReactNode } from 'react';
import { WorkshopContext, type WorkshopDraft } from './WorkshopContext';

export default function WorkshopProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, WorkshopDraft>>({});
  const update = useCallback((key: string, draft: WorkshopDraft) => {
    setDrafts(previous => ({ ...previous, [key]: draft }));
  }, []);
  return <WorkshopContext value={{ drafts, update }}>{children}</WorkshopContext>;
}
