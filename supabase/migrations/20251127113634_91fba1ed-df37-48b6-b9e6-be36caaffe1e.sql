-- Add remaining AdminDashboard translation keys

INSERT INTO public.translations (key, hu, en) VALUES
-- AdminDashboard reports section
('admin.dashboard.attached_images', 'Csatolt képek', 'Attached Images'),
('admin.dashboard.screenshot', 'Képernyőkép', 'Screenshot'),
('admin.dashboard.open_image', 'Megnyitás', 'Open'),
('admin.dashboard.admin_note', 'Admin megjegyzés:', 'Admin Note:'),
('admin.dashboard.action_reviewing', 'Folyamatban', 'In Progress'),
('admin.dashboard.action_resolved', 'Megoldva', 'Resolved'),
('admin.dashboard.action_dismissed', 'Elutasítás', 'Dismiss'),
('admin.dashboard.no_dev_reports', 'Nincs fejlesztői jelentés', 'No development reports'),
('admin.dashboard.no_support_reports', 'Nincs felhasználói jelentés', 'No user reports')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();