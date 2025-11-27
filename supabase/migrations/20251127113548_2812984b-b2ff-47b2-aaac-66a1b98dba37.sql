-- Add remaining translation keys for admin pages

INSERT INTO public.translations (key, hu, en) VALUES
-- AdminDashboard revenue tab
('admin.dashboard.revenue_title', 'Teljes árbevétel', 'Total Revenue'),
('admin.dashboard.revenue_country', 'Ország', 'Country'),
('admin.dashboard.revenue_user_count', 'Felhasználók száma', 'User Count'),
('admin.dashboard.revenue_avg_spend', 'Átlagos költés', 'Average Spend'),
('admin.dashboard.revenue_flag', 'Zászló', 'Flag'),
('admin.dashboard.country_hungary', 'Magyarország', 'Hungary'),
('admin.dashboard.country_england', 'Anglia', 'England'),
('admin.dashboard.country_austria', 'Ausztria', 'Austria'),

-- AdminDashboard payouts tab
('admin.dashboard.payouts_title', 'Nyeremény kifizetések', 'Prize Payouts')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();