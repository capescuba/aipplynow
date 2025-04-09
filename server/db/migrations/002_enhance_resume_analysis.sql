-- Add new columns for enhanced analysis
ALTER TABLE resume_analysis
ADD COLUMN breakdown_keyword_optimization DECIMAL(5,2) DEFAULT 0,
ADD COLUMN missing_keywords_json JSON DEFAULT NULL,
ADD COLUMN improvement_suggestions_critical_json JSON DEFAULT NULL,
ADD COLUMN improvement_suggestions_recommended_json JSON DEFAULT NULL,
ADD COLUMN improvement_suggestions_advanced_json JSON DEFAULT NULL;

-- Rename existing columns to match new schema
ALTER TABLE resume_analysis
CHANGE COLUMN skills_json skills_json JSON DEFAULT NULL COMMENT 'Array of skill objects with name, confidence, and relevance',
CHANGE COLUMN relevant_experience_json relevant_experience_json JSON DEFAULT NULL COMMENT 'Object with roles array and improvement areas',
CHANGE COLUMN improvement_suggestions_json improvement_suggestions_json JSON DEFAULT NULL COMMENT 'Legacy column - to be migrated'; 