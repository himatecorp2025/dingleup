export interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const tutorialSteps = {
  dashboard: [
    {
      target: '[data-tutorial="profile-header"]',
      title: 'Profilod és státuszod',
      description: 'Itt látod, mennyi életed és aranyérméd van. Az életek 12 percenként újratöltődnek.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="daily-gift"]',
      title: 'Napi jutalom',
      description: 'Napi belépésedért ajándékot kapsz! Minél több napot gyűjtesz egymás után, annál nagyobb jutalmakat kapsz.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="play-button"]',
      title: 'Játék indítása',
      description: 'Válaszd ki a témakört és kezdj el játszani! Minden helyes válaszért aranyérméket és pontokat kapsz.',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="booster-button"]',
      title: 'Speed Booster',
      description: 'A Speed Boosterek felgyorsítják az életek újratöltését és növelik a maximális életszámot!',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="bottom-nav"]',
      title: 'Navigáció',
      description: 'Innen éred el a boltot, chatet és profilodat. Bármikor visszatérhetsz a főoldalra.',
      position: 'top' as const
    }
  ],
  shop: [
    {
      target: '[data-tutorial="genius-section"]',
      title: 'Genius előfizetés',
      description: 'Vásárolj Genius előfizetést – dupla jutalom és extra kedvezmények minden vásárlásra!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="boosters-section"]',
      title: 'Speed Boosterek',
      description: 'Gyorsítsd a játékot boosterekkel! Különböző sebességű csomagok közül választhatsz.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="coins-section"]',
      title: 'Aranyérmék vásárlása',
      description: 'Ha elfogyott az aranyad, itt pótolhatod. Válaszd ki a számodra megfelelő csomagot!',
      position: 'bottom' as const
    }
  ],
  chat: [
    {
      target: '[data-tutorial="friends-menu"]',
      title: 'Barátok menü',
      description: 'Innen nyithatod meg az ismerőseid listáját és kezelheted a barátkéréseket.',
      position: 'right' as const
    },
    {
      target: '[data-tutorial="search-friends"]',
      title: 'Ismerősök keresése',
      description: 'Keress és jelölj be új barátokat a felhasználónév vagy e-mail cím alapján.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="threads-list"]',
      title: 'Beszélgetések',
      description: 'Itt látod a korábbi üzeneteket és beszélgetéseket. Kattints egy beszélgetésre a megnyitásához.',
      position: 'right' as const
    }
  ],
  profile: [
    {
      target: '[data-tutorial="profile-pic"]',
      title: 'Profilkép',
      description: 'Tölts fel képet magadról, hogy barátaid könnyebben megismerjenek!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="settings"]',
      title: 'Beállítások',
      description: 'Itt kezelheted a fiókod adatait, hangbeállításokat és egyéb preferenciákat.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="stats"]',
      title: 'Statisztikák',
      description: 'Nézd meg a játék előrehaladásodat, pontjaidat és ranglistahelyezésedet!',
      position: 'top' as const
    }
  ],
  play: [
    {
      target: '[data-tutorial="question"]',
      title: 'Kérdés',
      description: 'Itt látod az aktuális kérdést. Olvasd el figyelmesen, mielőtt válaszolsz!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="answers"]',
      title: 'Válaszlehetőségek',
      description: 'Válaszd ki a helyes választ! Minden helyes válaszért aranyérméket és pontokat kapsz.',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="helpers"]',
      title: 'Segítségek',
      description: 'Használd a segítségeket, ha elakadtál! 50-50, időmegállítás és kérdés csere állnak rendelkezésedre.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="swipe-gesture"]',
      title: 'Navigáció',
      description: 'Felfelé görgetve továbblépés a következő kérdéshez, lefelé görgetve kilépés a játékból.',
      position: 'center' as const
    }
  ],
  landing: [
    {
      target: '[data-tutorial="hero"]',
      title: 'Üdvözlünk!',
      description: 'Ismerj meg minket és tudj meg többet arról, hogyan működik a DingleUP!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="features"]',
      title: 'Funkciók',
      description: 'Fedezd fel a játék összes funkcióját – kvízek, ranglista, jutalmak és még sok más!',
      position: 'bottom' as const
    }
  ],
  topics: [
    {
      target: '[data-tutorial="volume-slider"]',
      title: 'Hangerő beállítás',
      description: 'Itt állíthatod a játék hangerejét. A beállítás megmarad a játék közben is.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="mute-button"]',
      title: 'Némítás',
      description: 'Gyors némítás egy kattintással. Használd, ha pillanatnyilag nem szeretnél hangot hallani.',
      position: 'bottom' as const
    }
  ]
};
