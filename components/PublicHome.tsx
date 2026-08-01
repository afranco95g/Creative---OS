'use client';

import { PublicHeader } from './public/PublicHeader';
import { HeroPublic } from './public/HeroPublic';
import { LatestStoriesSection } from './public/LatestStoriesSection';
import { EcosystemSection } from './public/EcosystemSection';

interface PublicHomeProps {
  hasUser: boolean;
  userName?: string;
  onEnterStudio: () => void;
  onStart: () => void;
}

export function PublicHome({
  hasUser,
  userName,
  onEnterStudio,
  onStart,
}: PublicHomeProps) {
  function handleEnter() {
    if (hasUser) {
      onEnterStudio();
    } else {
      onStart();
    }
  }

  function scrollToStories() {
    const section = document.getElementById('historias');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <PublicHeader
        hasUser={hasUser}
        userName={userName}
        onEnter={handleEnter}
      />

      <HeroPublic
        onExplore={scrollToStories}
        onLearnMore={() => {}}
      />

      <LatestStoriesSection />

      <EcosystemSection />
    </main>
  );
}