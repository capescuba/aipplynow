-- Create a temporary table to store existing values
CREATE TEMPORARY TABLE temp_config AS SELECT * FROM config;

-- Drop the config table if it exists to ensure clean structure
DROP TABLE IF EXISTS config;

-- Create the config table with the correct structure
CREATE TABLE config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    LinkedInClientId VARCHAR(255) DEFAULT '',
    LinkedInClientSecret VARCHAR(255) DEFAULT '',
    JwtPassword VARCHAR(255) DEFAULT '',
    XaiApiKey VARCHAR(255) DEFAULT '',
    AWSAccessKeyId VARCHAR(255) DEFAULT '',
    AWSSecretAccessKey VARCHAR(255) DEFAULT ''
);

-- Copy existing values back, preserving all columns
INSERT INTO config (id, LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey, AWSAccessKeyId, AWSSecretAccessKey)
SELECT id, LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey, 
       COALESCE(AWSAccessKeyId, '<AWS_ACCESS_KEY_ID>'),
       COALESCE(AWSSecretAccessKey, '<AWS_SECRET_ACCESS_KEY>')
FROM temp_config;

-- Drop the temporary table
DROP TEMPORARY TABLE IF EXISTS temp_config;

-- If no rows exist, insert a default row
INSERT IGNORE INTO config (LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey, AWSAccessKeyId, AWSSecretAccessKey)
VALUES ('', '', '', '', '<AWS_ACCESS_KEY_ID>', '<AWS_SECRET_ACCESS_KEY>');

-- Check if id column exists
SET @idExists = (SELECT COUNT(*) 
                 FROM information_schema.columns 
                 WHERE table_schema = 'aipplynow' 
                 AND table_name = 'config' 
                 AND column_name = 'id');

-- If id column doesn't exist, add it
SET @addIdColumn = IF(@idExists = 0,
    'ALTER TABLE config ADD COLUMN id INT PRIMARY KEY AUTO_INCREMENT FIRST',
    'SELECT 1'
);
PREPARE addIdColumnStmt FROM @addIdColumn;
EXECUTE addIdColumnStmt;
DEALLOCATE PREPARE addIdColumnStmt;

-- Insert or update AWS credentials
INSERT INTO config (LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey, AWSAccessKeyId, AWSSecretAccessKey)
VALUES ('', '', '', '', '<AWS_ACCESS_KEY_ID>', '<AWS_SECRET_ACCESS_KEY>')
ON DUPLICATE KEY UPDATE
    AWSAccessKeyId = VALUES(AWSAccessKeyId),
    AWSSecretAccessKey = VALUES(AWSSecretAccessKey);

-- Add AWS credential columns if they don't exist
SET @dbname = 'aipplynow';
SET @tablename = 'config';
SET @columnname = 'AWSAccessKeyId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE config ADD COLUMN AWSAccessKeyId VARCHAR(255)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'AWSSecretAccessKey';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE config ADD COLUMN AWSSecretAccessKey VARCHAR(255)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check if config table has any rows
SET @rowCount = (SELECT COUNT(*) FROM config);

-- Update AWS credentials for the first row
UPDATE config 
SET AWSAccessKeyId = '<AWS_ACCESS_KEY_ID>',
    AWSSecretAccessKey = '<AWS_SECRET_ACCESS_KEY>'
WHERE id = 1; 