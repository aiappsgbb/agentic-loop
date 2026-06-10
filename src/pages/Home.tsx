import HomeHeadline from '../components/HomeHeadline';
import WhatToUseWhen from '../components/WhatToUseWhen';
import KratosBanner from '../components/KratosBanner';
import ScenariosGallery from '../components/ScenariosGallery';
import GreenfieldBuilder from '../components/GreenfieldBuilder';

export default function Home() {
  return (
    <>
      <HomeHeadline />
      <WhatToUseWhen />
      <KratosBanner />
      <ScenariosGallery />
      <GreenfieldBuilder />
    </>
  );
}
