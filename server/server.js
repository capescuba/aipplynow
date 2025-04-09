const CONFIG = require("./config/startup_properties.js");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const linkedinApi = require("./api/linkedin.js");
const STATE = "GUEST";
const app = express();
const PORT = process.env.PORT || 3000;
const User = require("./data objects/user.js");
const DB = require("./db/db.js");
const Resumehandler = require("./resume-handler.js");
const resumeModule = require("./api/resume-manager.js");
const staticPath = path.resolve(__dirname, '..', 'client', 'build');
const clientHome = path.resolve(__dirname, '..', 'client', 'build', 'index.html');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 10 } // Limit to 10MB
});

// Middleware to verify and decode JWT
function decodeJWT(req, res, next) {
  const internalCall = next == null;
  const token = req.cookies.token;

  if (!token) {
    if (internalCall) {
      return false;
    } else {
      return res.status(401).send("Access Denied: No Token Provided!");
    }
  }

  try {
    const decoded = jwt.verify(token, CONFIG.properties.JWT_PASSWORD);
    req.user = decoded; // Attach decoded payload (email) to request
    if (internalCall) {
      return true;
    } else {
      next();
    }
  } catch (err) {
    if (internalCall) {
      return false;
    } else {
      res.status(400).send("Invalid Token");
    }
  }
}

// Initialize server and middleware
async function startServer() {
  // Initialize startup properties
  await CONFIG.init();
  console.log("Initialized config:", CONFIG.properties);

  app.use(express.static(staticPath));

  app.use(
    session({
      secret: "yourSecretKey",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  app.use(cookieParser());
  app.use(express.json()); // Add this to parse JSON bodies

  defineRoutes();

  const server = app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
    console.log("Current config:", CONFIG.properties);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    switch (error.code) {
      case 'EACCES':
        console.error(`Port ${PORT} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

async function defineRoutes() {
  // Static routes
  app.get("/", (req, res) => res.sendFile(clientHome));
  app.get("/login", (req, res) => res.sendFile(clientHome));

  // API routes
  app.get("/api/config", async (req, res) => {
    const isLoggedIn = decodeJWT(req, res, null);
    if (isLoggedIn) {
      try {
        const user = await DB.getUserByEmail(req.user.email);
        req.session.userInfo = user || null;
        res.send({
          clientId: CONFIG.properties.CLIENT_ID,
          redirectUri: linkedinApi.REDIRECT_URI,
          isLoggedIn: !!user,
          userInfo: req.session.userInfo,
        });
      } catch (error) {
        res.status(500).send("Error fetching user");
      }
    } else {
      res.send({
        clientId: CONFIG.properties.CLIENT_ID,
        redirectUri: linkedinApi.REDIRECT_URI,
        isLoggedIn: false,
      });
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    const { code, state } = req.query;
    if (state !== STATE) return res.status(400).send("State mismatch error.");
    try {
      const accessToken = await linkedinApi.getAccessToken(code);
      const userInfo = await linkedinApi.getUserInfo(accessToken);
      const token = jwt.sign({ email: userInfo.email }, CONFIG.properties.JWT_PASSWORD, { expiresIn: "1h" });
      const user = User.fromJSON(userInfo);
      
      let existingUser = await DB.getUserByEmail(user.email);
      let userId;
      if (!existingUser) {
        userId = await DB.insertUser(user);
        await DB.addUserEmail(userId, user.email); // Add email to user_emails
      } else {
        userId = existingUser.user_id;
      }
      
      req.session.userInfo = userInfo;
      req.session.isLoggedIn = true;
      req.session.save((err) => {
        if (err) return res.status(500).send("Error saving session.");
        res.cookie("token", token, { maxAge: 900000, httpOnly: true });
        const origin = `${req.protocol}://${req.headers.host}`;
        res.send(`
          <html><body>
            <script>
              window.opener.postMessage({ type: "auth", code: "${code}", userInfo: ${JSON.stringify(userInfo)}, isLoggedIn: true }, "${origin}");
              setTimeout(() => window.close(), 100);
            </script>
          </body></html>
        `);
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching user information.");
    }
  });

  app.post("/api/users/me/resumes/:resume_id/parse", decodeJWT, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.resume_id);
      const userId = await DB.getUserIdByEmail(req.user.email);
      if (!userId) throw new Error("User not found");

      const resumeBuffer = await resumeModule.getResumeFile(userId, resumeId);
      if (!resumeBuffer) throw new Error("Resume not found");

      const data = await Resumehandler.parseResume(resumeBuffer, req.body.job_description);
      
      if (!data) {
        throw new Error("Failed to parse resume");
      }

      await DB.insertResumeAnalysis(data, userId);
      res.json({ resume_id: resumeId, data });
    } catch (error) {
      console.error("Error in resume parsing:", error);
      res.status(500).json({ error: "Failed to parse resume", message: error.message });
    }
  });

  app.get("/api/users/me/resumes", decodeJWT, async (req, res) => {
    try {
      const resumes = await DB.getResumesByEmail(req.user.email);
      res.send(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).send({ error: "Failed to fetch resumes", message: error.message });
    }
  });

  app.post("/api/users/me/resumes", decodeJWT, upload.single("resume"), async (req, res) => {
    try {
      const originalFileName = req.file.originalname;
      const userId = await DB.getUserIdByEmail(req.user.email);
      if (!userId) throw new Error("User not found");

      const resumeId = await resumeModule.uploadResume(
        req.file.buffer,
        userId,
        originalFileName
      );

      res.send({ resume_id: resumeId.toString() });
    } catch (error) {
      console.error("Error saving resume to S3:", error);
      res.status(500).send({ error: "Failed to save resume", message: error.message });
    }
  });

  app.get("/api/users/me/resumes/:resume_id/download", decodeJWT, async (req, res) => {
    try {
      const userId = await DB.getUserIdByEmail(req.user.email);
      if (!userId) {
        return res.status(404).send({ error: "User not found" });
      }
      
      const metadata = await DB.getResumeMetadata(req.params.resume_id, userId);
      if (!metadata) {
        return res.status(404).send({ error: "Resume not found" });
      }

      const resumeBuffer = await resumeModule.getResumeFile(userId, req.params.resume_id);
      if (!resumeBuffer) {
        return res.status(404).send({ error: "Resume file not found" });
      }
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${metadata.original_name}"`);
      res.setHeader("Content-Length", resumeBuffer.length);
      
      // Send the buffer directly
      res.end(resumeBuffer);
      
    } catch (error) {
      console.error("Error downloading resume:", error);
      if (!res.headersSent) {
        res.status(500).send({ error: "Failed to download resume", message: error.message });
      }
    }
  });

  app.delete("/api/users/me/resumes/:resume_id", decodeJWT, async (req, res) => {
    try {
      const userId = await DB.getUserIdByEmail(req.user.email);
      if (!userId) throw new Error("User not found");
      
      await resumeModule.deleteResume(req.params.resume_id, userId);
      res.send({ success: true });
    } catch (error) {
      console.error("Error deleting resume:", error);
      res.status(500).send({ error: "Failed to delete resume", message: error.message });
    }
  });

  app.get("/api/users/me", decodeJWT, async (req, res) => {
    try {
      const user = await DB.getUserByEmail(req.user.email);
      if (!user) return res.status(404).send("User not found");
      res.json(user);
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).send("Error fetching user info");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.clearCookie("token");
      res.send({ success: true });
    });
  });

  // Catch-all for React app
  app.get("*", (req, res) => res.sendFile(clientHome));
}

// Initialize configuration and start server
(async function () {
  startServer();
})();