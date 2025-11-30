-- Add day_of_week column to daily_prize_table
ALTER TABLE public.daily_prize_table 
ADD COLUMN IF NOT EXISTS day_of_week INTEGER NOT NULL DEFAULT 1;

-- Add constraint for day_of_week (1-7)
ALTER TABLE public.daily_prize_table 
ADD CONSTRAINT day_of_week_range CHECK (day_of_week >= 1 AND day_of_week <= 7);

-- Make rank + day_of_week unique
ALTER TABLE public.daily_prize_table
DROP CONSTRAINT IF EXISTS daily_prize_table_pkey;

ALTER TABLE public.daily_prize_table
ADD CONSTRAINT daily_prize_table_pkey PRIMARY KEY (rank, day_of_week);

-- Clear existing data
DELETE FROM public.daily_prize_table;

-- Insert Monday rewards (8% day, day_of_week=1)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 2400, 48, 1),
(2, 1680, 34, 1),
(3, 1200, 24, 1),
(4, 720, 14, 1),
(5, 600, 12, 1),
(6, 480, 10, 1),
(7, 360, 7, 1),
(8, 288, 6, 1),
(9, 240, 5, 1),
(10, 192, 4, 1);

-- Insert Tuesday rewards (12% day, day_of_week=2)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 3600, 72, 2),
(2, 2520, 50, 2),
(3, 1800, 36, 2),
(4, 1080, 22, 2),
(5, 900, 18, 2),
(6, 720, 14, 2),
(7, 540, 11, 2),
(8, 432, 9, 2),
(9, 360, 7, 2),
(10, 288, 6, 2);

-- Insert Wednesday rewards (18% day, day_of_week=3)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 5400, 108, 3),
(2, 3780, 76, 3),
(3, 2700, 54, 3),
(4, 1620, 32, 3),
(5, 1350, 27, 3),
(6, 1080, 22, 3),
(7, 810, 16, 3),
(8, 648, 13, 3),
(9, 540, 11, 3),
(10, 432, 9, 3);

-- Insert Thursday rewards (25% day, day_of_week=4)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 7500, 150, 4),
(2, 5250, 105, 4),
(3, 3750, 75, 4),
(4, 2250, 45, 4),
(5, 1875, 38, 4),
(6, 1500, 30, 4),
(7, 1125, 23, 4),
(8, 900, 18, 4),
(9, 750, 15, 4),
(10, 600, 12, 4);

-- Insert Friday rewards (35% day, day_of_week=5)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 10500, 210, 5),
(2, 7350, 147, 5),
(3, 5250, 105, 5),
(4, 3150, 63, 5),
(5, 2625, 53, 5),
(6, 2100, 42, 5),
(7, 1575, 32, 5),
(8, 1260, 25, 5),
(9, 1050, 21, 5),
(10, 840, 17, 5);

-- Insert Saturday rewards (50% day, day_of_week=6)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 15000, 300, 6),
(2, 10500, 210, 6),
(3, 7500, 150, 6),
(4, 4500, 90, 6),
(5, 3750, 75, 6),
(6, 3000, 60, 6),
(7, 2250, 45, 6),
(8, 1800, 36, 6),
(9, 1500, 30, 6),
(10, 1200, 24, 6);

-- Insert Sunday rewards (Jackpot, TOP 25, day_of_week=7)
INSERT INTO public.daily_prize_table (rank, gold, lives, day_of_week) VALUES
(1, 30000, 600, 7),
(2, 21000, 420, 7),
(3, 15000, 300, 7),
(4, 9000, 180, 7),
(5, 7500, 150, 7),
(6, 6000, 120, 7),
(7, 4500, 90, 7),
(8, 3600, 72, 7),
(9, 3000, 60, 7),
(10, 2400, 48, 7),
(11, 2000, 40, 7),
(12, 1800, 36, 7),
(13, 1600, 32, 7),
(14, 1400, 28, 7),
(15, 1200, 24, 7),
(16, 1000, 20, 7),
(17, 800, 16, 7),
(18, 700, 14, 7),
(19, 600, 12, 7),
(20, 500, 10, 7),
(21, 400, 8, 7),
(22, 360, 7, 7),
(23, 320, 6, 7),
(24, 280, 6, 7),
(25, 240, 5, 7);

-- Add comment
COMMENT ON COLUMN public.daily_prize_table.day_of_week IS 'Day of week: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday';