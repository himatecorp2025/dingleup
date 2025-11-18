-- Enable realtime for questions table to sync like counts instantly
ALTER PUBLICATION supabase_realtime ADD TABLE questions;