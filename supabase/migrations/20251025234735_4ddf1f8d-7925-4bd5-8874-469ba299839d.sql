-- Move admin_stats_summary to internal schema to restrict Data API access
-- This prevents the materialized view from being publicly accessible

-- Create internal schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS internal;

-- Move the materialized view to the internal schema
ALTER MATERIALIZED VIEW public.admin_stats_summary SET SCHEMA internal;