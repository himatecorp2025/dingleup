-- Add Daily Winners Dialog dynamic button translation keys

-- dailyWinners.claimReward
INSERT INTO translations (id, key, hu, en, created_at, updated_at)
VALUES (gen_random_uuid(), 'dailyWinners.claimReward', 'Átveszem a jutalmamat', 'Claim my reward', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET hu = EXCLUDED.hu, en = EXCLUDED.en, updated_at = NOW();

-- dailyWinners.congratulate
INSERT INTO translations (id, key, hu, en, created_at, updated_at)
VALUES (gen_random_uuid(), 'dailyWinners.congratulate', 'Gratulálok', 'Congratulations', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET hu = EXCLUDED.hu, en = EXCLUDED.en, updated_at = NOW();

-- dailyWinners.claimSuccess
INSERT INTO translations (id, key, hu, en, created_at, updated_at)
VALUES (gen_random_uuid(), 'dailyWinners.claimSuccess', 'Jutalom átvéve!', 'Reward claimed!', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET hu = EXCLUDED.hu, en = EXCLUDED.en, updated_at = NOW();

-- dailyWinners.claimError
INSERT INTO translations (id, key, hu, en, created_at, updated_at)
VALUES (gen_random_uuid(), 'dailyWinners.claimError', 'Hiba történt a jutalom átvételekor', 'Failed to claim reward', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET hu = EXCLUDED.hu, en = EXCLUDED.en, updated_at = NOW();