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
    conn = await pool.getConnection();
    const query = "SELECT * FROM resumes WHERE resume_id = ? AND user_id = ?";
    const rows = await conn.query(query, [resumeId, userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching resume metadata:", err);
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
      SELECT LinkedInClientId, LinkedInClientSecret, JwtPassword, XaiApiKey
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
async function insertResumeAnalysis(analysisData, userEmail = null) {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const query = `
      INSERT INTO resume_analysis (
        user_email,
        ats_score,
        skills,
        total_experience_years,
        relevant_experience,
        education,
        certifications,
        breakdown_skills,
        breakdown_experience,
        breakdown_edu_certs,
        breakdown_formatting,
        suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userEmail,
      analysisData.ats_score,
      JSON.stringify(analysisData.data.skills),
      analysisData.data.total_experience_years,
      JSON.stringify(analysisData.data.relevant_experience),
      JSON.stringify(analysisData.data.education),
      JSON.stringify(analysisData.data.certifications),
      analysisData.breakdown.skills,
      analysisData.breakdown.experience,
      analysisData.breakdown.education_certifications,
      analysisData.breakdown.formatting,
      JSON.stringify(analysisData.improvement_suggestions)
    ];

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