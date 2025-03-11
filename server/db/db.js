// dbModule.js

const mariadb = require("mariadb");
const dbconfig = require("./dbconfig.json");

const pool = mariadb.createPool({
  host: dbconfig.host,
  user: dbconfig.user,
  password: dbconfig.password,
  database: dbconfig.database,
});

async function getTableData(tableName) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM ${tableName}`);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.end();
  }
}

async function getUserByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT * FROM users WHERE email = ?";
    const rows = await conn.query(query, [email]);
    if (rows.length > 0) {
      const user = rows[0];
      console.log(`Found user: ${user.given_name} ${user.family_name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Email Verified: ${user.email_verified}`);
      console.log(`Locale: ${user.country}, ${user.language}`);
      console.log(`Profile Picture URL: ${user.picture}`);
      return user;
    } else {
      console.log("No user found with this email.");
      return null;
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  } finally {
    if (conn) conn.end();
  }
}
async function insertUser(user) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = ` INSERT INTO users (sub, email_verified, name, country, language, given_name, family_name, email, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `;
    const values = [
      user.sub,
      user.email_verified,
      user.name,
      user.locale.country,
      user.locale.language,
      user.given_name,
      user.family_name,
      user.email,
      user.picture,
    ];
    await conn.query(query, values);
    console.log("User inserted successfully");
  } catch (err) {
    console.error("Error inserting user:", err);
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
  getTableData,
  getUserByEmail,
  insertUser,
  insertResumeAnalysis
};
