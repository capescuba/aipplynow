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
const staticPath = path.resolve(__dirname, '..', 'client', 'build');
const clientHome = path.resolve(__dirname, '..', 'client', 'build', 'index.html');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // Stores file in memory as a Buffer
  limits: { fileSize: 1024 * 1024 * 10 } // Limit to 10MB
});

// Middleware to verify and decode JWT
function decodeJWT(req, res, next) {
  const internalCall = next == null;

  const token = req.cookies.token; // Get token from cookies

  if (!token) {
    if (internalCall) {
      return false;
    } else {
      return res.status(401).send("Access Denied: No Token Provided!");
    }
  }

  try {
    const decoded = jwt.verify(token, CONFIG.properties.JWT_PASSWORD);
    req.user = decoded; // Attach decoded payload to the request object
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
function startServer() {
  // Serve the React app
  app.use(express.static(staticPath));

  // Configure session middleware
  app.use(
    session({
      secret: "yourSecretKey",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  app.use(cookieParser());

  // Define routes
  defineRoutes();

  // Start the server
  app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Define application routes
async function defineRoutes() {
  // Public route (No JWT check)
  app.get("/", function (req, res) {
    //res.sendFile(path.join(__dirname + "client\build\index.html"));
    res.sendFile(clientHome);
  });

  // Login route (No JWT check)
  app.get("/login", function (req, res) {
    //res.sendFile(path.join(__dirname + "../client/build/index.html"));
    res.sendFile(clientHome);
  });

  // API Config route (No JWT check)
  app.get("/api/config", function (req, res) {
    const isLoggedIn = decodeJWT(req, res, null);
    if (isLoggedIn) {
      DB.getUserByEmail(req.user.email)
        .then((user) => {
          if (user) {
            req.session.userInfo = user;
          } else {
            isLoggedIn = false;
            req.session.userInfo = null;
          }
        })
        .finally(() => {
          res.send({
            clientId: CONFIG.properties.CLIENT_ID,
            redirectUri: linkedinApi.REDIRECT_URI,
            isLoggedIn: isLoggedIn,
            userInfo: req.session.userInfo
          });
        });
    } else {
      res.send({
        clientId: CONFIG.properties.CLIENT_ID,
        redirectUri: linkedinApi.REDIRECT_URI,
        isLoggedIn: isLoggedIn,
      });
    }
  });

  // Protected route (JWT check)
  app.post("/resume/parse", decodeJWT, upload.single('resume'), async function (req, res) {
    data = await Resumehandler.parseResume(req.file.buffer, req.body.job_desc );
    
    res.send(data);

    
        
    //res.send(
    //  `Hello ${req.user.email}, you have access to this protected route!`
    //);
  });

  // Callback route
  app.get("/callback", async function (req, res) {
    const { code, state } = req.query;
    if (state !== STATE) {
      return res.status(400).send("State mismatch error.");
    }

    try {
      const accessToken = await linkedinApi.getAccessToken(code);
      const userInfo = await linkedinApi.getUserInfo(accessToken);
      console.log(`User info: ${JSON.stringify(userInfo)}`);

      const token = jwt.sign(
        { email: userInfo.email },
        CONFIG.properties.JWT_PASSWORD,
        { expiresIn: "1h" }
      );

      const user = User.fromJSON(userInfo);
      if ((await DB.getUserByEmail(user.email)) == null) {
        await DB.insertUser(user);
      }

      req.session.userInfo = userInfo;
      req.session.isLoggedIn = true;
      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Error saving session.");
        }
        console.log("Session saved:", req.session);
        res.cookie("token", token, { maxAge: 900000, httpOnly: true });
        res.sendFile(clientHome);
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching user information.");
    }
  });

  // Route to handle POST request
  app.get("/api/user/login", decodeJWT, function (req, res) {
    res.json(req.session.userInfo);
  });

  // Catch-all route to serve React app
  app.get("*", function (req, res) {
    res.sendFile(clientHome);
  });
}

// Initialize configuration and start server
(async function () {
  CONFIG.init();
  startServer();
})();
