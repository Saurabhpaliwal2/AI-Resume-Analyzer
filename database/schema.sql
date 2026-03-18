CREATE DATABASE IF NOT EXISTS resume_analyzer;

USE resume_analyzer;

-- Hibernate will automatically create the tables, 
-- but here is the manual schema for reference:

-- CREATE TABLE analysis_result (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     resume_name TEXT,
--     skill_match_percentage INT
-- );

-- CREATE TABLE analysis_result_missing_skills (
--     analysis_result_id BIGINT,
--     missing_skills VARCHAR(255)
-- );

-- ... etc.
