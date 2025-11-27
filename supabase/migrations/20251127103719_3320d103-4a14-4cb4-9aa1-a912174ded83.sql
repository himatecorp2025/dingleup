-- Update Play Now button translations to uppercase
UPDATE translations SET
  hu = 'JÁTSZ MOST!',
  en = 'PLAY NOW!'
WHERE key = 'dashboard.play_now';

-- Update Start Game button translations to uppercase
UPDATE translations SET
  hu = 'JÁTSZ MOST!',
  en = 'PLAY NOW!'
WHERE key = 'landing.hero.cta_start_game';