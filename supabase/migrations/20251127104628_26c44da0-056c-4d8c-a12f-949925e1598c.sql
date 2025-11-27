-- Add missing admin translation keys
INSERT INTO translations (key, hu, en) VALUES
('admin.username_cooldown', '7 naponta módosítható. Még {days} nap van hátra.', 'Can be changed every 7 days. {days} days remaining.'),
('admin.already_admin', '{username} már rendelkezik admin jogosultsággal', '{username} already has admin privileges'),
('admin.grant_success', 'Admin jogosultság sikeresen megadva: {username}', 'Admin privileges successfully granted to {username}'),
('admin.grant_error', 'Hiba történt az admin jogosultság megadásakor', 'Error occurred while granting admin privileges'),
('admin.pools.created', '✓ {count} medence létrehozva!', '✓ {count} pools created!'),
('admin.pools.created_desc', '{topics} témakör, {questions} kérdés/témakör/medence', '{topics} topics, {questions} questions/topic/pool'),
('admin.pools.error', 'Hiba: {message}', 'Error: {message}')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;