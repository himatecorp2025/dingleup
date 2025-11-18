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
      title: 'Üdvözlünk a DingleUP-ban! 👋',
      description: 'Ez a főoldalad, ahol minden fontos információt megtalálsz. Kezdjük a profiloddal: itt látod az életek és aranyérmék számát.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="profile-header"]',
      title: 'Életek rendszere ❤️',
      description: 'Minden játékhoz 1 élet kell. Az életek automatikusan újratöltődnek 12 percenként. Maximum 5 életed lehet egyszerre.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="profile-header"]',
      title: 'Aranyérmék 🪙',
      description: 'Helyes válaszokért aranyérméket kapsz. Ezekkel vásárolhatsz a boltban extra életeket, boostereket és prémium funkciókat.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="daily-gift"]',
      title: 'Napi belépési jutalom 🎁',
      description: 'Minden nap, amikor bejelentkezel, értékes ajándékokat kapsz! Minél több napot gyűjtesz egymás után, annál nagyobb jutalmak várnak rád.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="play-button"]',
      title: 'PLAY NOW - Játék indítása 🎮',
      description: 'Ezzel a gombbal indíthatod el a játékot. Először válassz témakört, majd válaszolj 15 kérdésre. Minden kérdésre 10 másodperced van!',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="booster-button"]',
      title: 'Speed Booster ⚡',
      description: 'A Speed Boosterek felgyorsítják az életek újratöltését és növelik a maximális életszámodat. Különböző sebességű boosterek közül választhatsz!',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="booster-button"]',
      title: 'Booster aktiválás',
      description: 'A boostereket a boltban vásárolhatod meg. Miután megvetted, ide kattintva aktiválhatod őket. Az aktív booster időtartama alatt gyorsabban töltődnek az életeid.',
      position: 'top' as const
    },
    {
      target: '.leaderboard-carousel',
      title: 'Ranglista 🏆',
      description: 'Itt látod a legjobb játékosokat. Minden helyes válasz pontot ér, és minél több pontot szerzel, annál előrébb kerülsz a ranglistán!',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="bottom-nav"]',
      title: 'Navigációs menü',
      description: 'Az alsó menüsávból érheted el a főbb funkciókat: Főoldal (Dashboard), Bolt, Chat (barátokkal való csevegés), és Profil.',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="bottom-nav"]',
      title: 'Készen állsz! 🎉',
      description: 'Most már tudod, hogyan működik minden! Nyomd meg a PLAY NOW gombot, és kezdd el a játékot. Sok sikert! 🚀',
      position: 'top' as const
    }
  ],
  chat: [
    {
      target: '.chat-container',
      title: 'Chat és Barátok 💬',
      description: 'Itt tudsz csevegni más játékosokkal! Kereshetsz barátokat, küldhetsz üzeneteket, képeket és fájlokat is. Nézzük meg, hogyan működik!',
      position: 'center' as const
    },
    {
      target: '[data-tutorial="friends-menu"]',
      title: 'Barátok hexagon menü',
      description: 'Felül látod a barátaidat hexagon keretekben. Kattints egy hexagonra, és máris megnyílik a beszélgetés vele!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="search-friends"]',
      title: 'Új barátok keresése 🔍',
      description: 'A keresés gombbal új játékosokat találhatsz. Kereshetsz felhasználónév vagy e-mail cím alapján, és elküldhetsz nekik barátkérést.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="search-friends"]',
      title: 'Barátkérések kezelése',
      description: 'Ha valaki küldött neked barátkérést, itt fogadhatod el vagy utasíthatod el. Miután elfogadtad, azonnal írhattok egymásnak!',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="threads-list"]',
      title: 'Beszélgetések listája',
      description: 'Itt látod az összes beszélgetésedet. A legfrissebb üzenetek felül jelennek meg. Kattints egy beszélgetésre a megnyitásához.',
      position: 'right' as const
    },
    {
      target: '[data-tutorial="threads-list"]',
      title: 'Üzenetek küldése 📨',
      description: 'Egy beszélgetésben írhatsz szöveges üzeneteket, küldhetsz képeket, emoji-kat és fájlokat is. Az üzenetek azonnal megjelennek mindkét félnél!',
      position: 'right' as const
    },
    {
      target: '[data-tutorial="threads-list"]',
      title: 'Online státusz 🟢',
      description: 'Látod, hogy barátaid éppen online vannak-e. A zöld pont azt jelenti, hogy aktív, míg a szürke pont azt, hogy offline.',
      position: 'right' as const
    },
    {
      target: '.chat-container',
      title: 'Kész vagy! 🎉',
      description: 'Most már tudod, hogyan használd a chatet! Keress barátokat, és kezdj el beszélgetni velük. Jó csevegést! 💬',
      position: 'center' as const
    }
  ],
  profile: [
    {
      target: '.profile-container',
      title: 'Profilod 👤',
      description: 'Ez a profiloldalad, ahol kezelheted a fiókodat, megtekintheted statisztikáidat és beállításokat változtathatsz. Kezdjük!',
      position: 'center' as const
    },
    {
      target: '[data-tutorial="profile-pic"]',
      title: 'Profilkép beállítása 📸',
      description: 'Kattints a profilképedre, és tölts fel egy képet magadról! Ez segít, hogy barátaid könnyebben megismerjenek a játékban.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="stats"]',
      title: 'Játékstatisztikák 📊',
      description: 'Itt látod a fontosabb statisztikáidat: összes játék száma, helyes válaszok aránya, megszerzett pontok és ranglistahelyezésed.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="booster-section"]',
      title: 'Aktív boosterek ⚡',
      description: 'Ebben a blokkban látod az aktív boostereidet. Ha nincs aktív booster, itt tudsz újat vásárolni a boltból.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="settings"]',
      title: 'Fiók beállításai ⚙️',
      description: 'Itt változtathatod meg a felhasználónevedet, e-mail címedet és egyéb fiók információkat. Az adataid biztonságosan vannak tárolva.',
      position: 'bottom' as const
    },
    {
      target: '.background-music-control',
      title: 'Háttérzene beállítás 🎵',
      description: 'Kapcsold ki/be a háttérzenét, és állítsd be a hangerőt a csúszkával. A beállításaid mentésre kerülnek.',
      position: 'top' as const
    },
    {
      target: '[data-tutorial="logout"]',
      title: 'Kijelentkezés',
      description: 'Ha kilépnél a fiókodból, használd ezt a gombot. A haladásod és statisztikáid elmentődnek, és újra bejelentkezéskor visszatöltődnek.',
      position: 'top' as const
    },
    {
      target: '.profile-container',
      title: 'Készen vagy! 🎉',
      description: 'Most már ismered a profiloldalad! Bármikor visszatérhetsz ide a beállítások módosításához. Jó játékot! 🚀',
      position: 'center' as const
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
      description: 'Használd a segítségeket, ha elakadtál! 1/3, időmegállítás és kérdés csere állnak rendelkezésedre.',
      position: 'bottom' as const
    },
    {
      target: '[data-tutorial="swipe-gesture"]',
      title: 'Navigáció',
      description: 'Felfelé görgetve továbblépés a következő kérdéshez, lefelé görgetve kilépés a játékból.',
      position: 'center' as const
    }
  ],
  topics: [
    {
      target: '.category-selector',
      title: 'Játékszabályok 📜',
      description: 'Üdvözlünk a játékban! Most elmagyarázzuk, hogyan működik minden. Figyelj oda!',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Témakörök 🎯',
      description: 'Először válassz témakört! 4 kategória közül választhatsz: Egészség & Fitnesz, Történelem & Technológia, Kultúra & Lifestyle, vagy Pénzügy & Önismeret.',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Kérdések száma ❓',
      description: 'Minden játékban 15 kérdést kapsz. A kérdések véletlenszerűen választódnak ki a választott témakörből.',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Időkorlát ⏱️',
      description: 'Minden kérdésre 10 másodperced van válaszolni! Ha lejár az idő, a kérdés helytelennek számít.',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Pontszámítás 💯',
      description: 'Helyes válaszért pontokat és aranyérméket kapsz. Minél gyorsabban válaszolsz, annál több pontot szerzel! A maximális pontszám kérdésenként: 100.',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Életek ❤️',
      description: 'Minden játék 1 életbe kerül. Ha elfogytak az életeid, várj 12 percet, vagy vásárolj újakat a boltban. A boosterek felgyorsítják az életek újratöltődését!',
      position: 'center' as const
    },
    {
      target: '.category-selector',
      title: 'Ranglista 🏆',
      description: 'Minden pontod számít a ranglistán! A legjobb játékosok a héten extra jutalmakat kapnak. Törekedj a legjobb helyezésre!',
      position: 'center' as const
    },
    {
      target: '.music-controls',
      title: 'Zene és hangerő 🎵',
      description: 'Itt alul kapcsolhatod ki/be a játék zenéjét, és állíthatod a hangerőt. A beállításod mentésre kerül.',
      position: 'top' as const
    },
    {
      target: '.category-selector',
      title: 'Készen állsz! 🚀',
      description: 'Most már ismered a szabályokat! Válassz témakört, és kezdd el a játékot. Sok sikert és jó szórakozást! 🎉',
      position: 'center' as const
    }
  ]
};
