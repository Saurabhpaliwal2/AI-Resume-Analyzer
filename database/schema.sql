CREATE DATABASE IF NOT EXISTS resume_analyzer;
USE resume_analyzer;

-- ---------------------------------------------------------
-- Table structure for users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Demo User Data (Password: password123)
-- ---------------------------------------------------------
-- This allows you to login immediately without registering.
-- Hashed using BCrypt.
INSERT IGNORE INTO users (email, name, password) 
VALUES ('demo@example.com', 'Demo User', '$2a$10$vI8A7sznS37zHshWAt.LRe5.S5J0n0LhJ7aP92xV5/8Fmsz0zHqGO');

-- ---------------------------------------------------------
-- Table structure for analysis_result
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    resume_name VARCHAR(255),
    job_description TEXT,
    skill_match_percentage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- Table structure for collections (Hibernate managed)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_result_matched_skills (
    analysis_result_id BIGINT NOT NULL,
    matched_skills VARCHAR(255),
    FOREIGN KEY (analysis_result_id) REFERENCES analysis_result(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_result_missing_skills (
    analysis_result_id BIGINT NOT NULL,
    missing_skills VARCHAR(255),
    FOREIGN KEY (analysis_result_id) REFERENCES analysis_result(id) ON DELETE CASCADE
);
