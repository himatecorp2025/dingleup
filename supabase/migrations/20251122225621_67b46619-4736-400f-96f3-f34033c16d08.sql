-- Remove old load testing tables (not needed for K6-based testing)
DROP TABLE IF EXISTS load_test_bottlenecks CASCADE;
DROP TABLE IF EXISTS load_test_results CASCADE;
DROP TABLE IF EXISTS load_test_optimizations CASCADE;