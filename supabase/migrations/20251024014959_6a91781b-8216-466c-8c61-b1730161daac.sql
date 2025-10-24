-- Enable realtime for game analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_help_usage;