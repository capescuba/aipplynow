// dbModule.js
const mariadb = require("mariadb");
const dbconfig = require("./dbconfig.json");

const pool = mariadb.createPool({
  host: dbconfig.host,
  user: dbconfig.user,
  password: dbconfig.password,
  database: dbconfig.database,
});

async function getUserByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT u.*, ue.email
      FROM users u
      JOIN user_emails ue ON u.user_id = ue.user_id
      WHERE ue.email = ?
    `;
    const rows = await conn.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function insertUser(user) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      INSERT INTO users (sub, email_verified, name, country, language, given_name, family_name, picture)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user.sub,
      user.email_verified,
      user.name,
      user.locale.country,
      user.locale.language,
      user.given_name,
      user.family_name,
      user.picture,
    ];
    const result = await conn.query(query, values);
    return result.insertId; // Return user_id
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function addUserEmail(userId, email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "INSERT INTO user_emails (user_id, email) VALUES (?, ?)";
    const result = await conn.query(query, [userId, email]);
    return result.insertId;
  } catch (err) {
    console.error("Error adding user email:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function getUserIdByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT user_id FROM user_emails WHERE email = ?";
    const rows = await conn.query(query, [email]);
    return rows.length > 0 ? rows[0].user_id : null;
  } catch (err) {
    console.error("Error fetching user_id by email:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function insertResumeMetadata(metadata) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      INSERT INTO resumes (
        resume_id,
        user_id,
        s3_key,
        original_name,
        upload_date,
        s3_url
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      metadata.resume_id,
      metadata.user_id,
      metadata.s3_key,
      metadata.original_name,
      metadata.upload_date,
      metadata.s3_url,
    ];
    await conn.query(query, values);
  } catch (err) {
    console.error("Error storing resume metadata:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function getResumeMetadata(resumeId, userId) {
  let conn;
  try {
    console.log(`[DEBUG] DB: Getting resume metadata for resumeId: ${resumeId}, userId: ${userId}`);
    console.log(`[DEBUG] DB: Query parameters - resumeId type: ${typeof resumeId}, userId type: ${typeof userId}`);
    
    conn = await pool.getConnection();
    const query = "SELECT * FROM resumes WHERE resume_id = ? AND user_id = ?";
    console.log(`[DEBUG] DB: Executing query: ${query} with params: [${resumeId}, ${userId}]`);
    
    const rows = await conn.query(query, [parseInt(resumeId), userId]);
    console.log('[DEBUG] DB: Query result:', rows);
    
    if (rows.length > 0) {
      // Convert snake_case to camelCase for consistency
      const resume = rows[0];
      console.log('[DEBUG] DB: Found resume with s3_key:', resume.s3_key);
      return {
        ...resume,
        s3Key: resume.s3_key, // Map s3_key to s3Key
        originalName: resume.original_name,
        uploadDate: resume.upload_date,
        s3Url: resume.s3_url
      };
    }
    console.log('[DEBUG] DB: No resume found in database');
    return null;
  } catch (err) {
    console.error("[DEBUG] DB: Error fetching resume metadata:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function getResumesByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT r.*
      FROM resumes r
      JOIN user_emails ue ON r.user_id = ue.user_id
      WHERE ue.email = ?
    `;
    const rows = await conn.query(query, [email]);
    return rows;
  } catch (err) {
    console.error("Error fetching user resumes:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function deleteResumeMetadata(resumeId, userId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "DELETE FROM resumes WHERE resume_id = ? AND user_id = ?";
    await conn.query(query, [resumeId, userId]);
  } catch (err) {
    console.error("Error deleting resume metadata:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function getConfig() {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey,
             AwsAccessKeyId, AwsSecretAccessKey, AwsRegion, AwsBucketName
      FROM config
      LIMIT 1
    `;
    const rows = await conn.query(query);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching config:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

// Updated function without table creation
async function insertResumeAnalysis(analysisData, userId) {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const query = `
      INSERT INTO resume_analysis (
        user_id,
        ats_score,
        skills_json,
        total_experience_years,
        relevant_experience_json,
        education_json,
        certifications_json,
        breakdown_skills,
        breakdown_experience,
        breakdown_education_certifications,
        breakdown_formatting,
        improvement_suggestions_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Log the analysis data structure
    console.log('Analysis data before DB insert:', JSON.stringify(analysisData, null, 2));

    const values = [
      userId,
      analysisData.ats_score || 0,
      JSON.stringify(analysisData.skills || []),
      analysisData.total_experience_years || 0,
      JSON.stringify(analysisData.relevant_experience || []),
      JSON.stringify(analysisData.education || []),
      JSON.stringify(analysisData.certifications || []),
      analysisData.breakdown?.skills || 0,
      analysisData.breakdown?.experience || 0,
      analysisData.breakdown?.education_certifications || 0,
      analysisData.breakdown?.formatting || 0,
      JSON.stringify(analysisData.improvement_suggestions || [])
    ];

    // Log the values being inserted
    console.log('Values being inserted:', values);

    const result = await conn.query(query, values);
    console.log("Resume analysis stored successfully with ID:", result.insertId);
    return result.insertId;
  } catch (err) {
    console.error("Error storing resume analysis:", err);
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

module.exports = {
  
  getUserByEmail,
  insertUser,
  getConfig,
  insertResumeMetadata,
  getResumeMetadata,
  getResumesByEmail,
  deleteResumeMetadata,
  addUserEmail,
  getUserIdByEmail,
  insertResumeAnalysis
};