-- Delete fake/test users and their related data
-- First delete from dependent tables, then from profiles

-- Delete from global_leaderboard
DELETE FROM global_leaderboard 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
);

-- Delete from game_results
DELETE FROM game_results 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
);

-- Delete from weekly_rankings
DELETE FROM weekly_rankings 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
);

-- Delete from invitations (as inviter or invited)
DELETE FROM invitations 
WHERE inviter_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
) OR invited_user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
);

-- Delete from user_boosters
DELETE FROM user_boosters 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN (
    'testmaster123@gmail.com',
    'test001@gmail.com',
    'haha@gmail.com',
    'valaki@gmail.com',
    'valaki1@gmail.com'
  )
);

-- Finally delete from profiles
DELETE FROM profiles 
WHERE email IN (
  'testmaster123@gmail.com',
  'test001@gmail.com',
  'haha@gmail.com',
  'valaki@gmail.com',
  'valaki1@gmail.com'
);

-- Delete from auth.users (this will cascade to profiles if foreign key is set up)
DELETE FROM auth.users 
WHERE email IN (
  'testmaster123@gmail.com',
  'test001@gmail.com',
  'haha@gmail.com',
  'valaki@gmail.com',
  'valaki1@gmail.com'
);