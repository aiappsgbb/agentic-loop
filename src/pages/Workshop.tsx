import { useSearchParams } from 'react-router-dom';
import GreenfieldBuilder from '../components/GreenfieldBuilder';
import { scenarios } from '../data/catalog';

export default function Workshop() {
  const [params] = useSearchParams();
  const scenario = scenarios.find(s => s.id === params.get('scenario'));
  return <GreenfieldBuilder key={scenario?.id ?? params.get('guide') ?? 'customer'} scenario={scenario} guideSlug={params.get('guide') ?? undefined} />;
}
