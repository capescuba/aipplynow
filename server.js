const CONFIG = require("./config/startupProperties.js");
const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
const linkedinApi = require("./api/linkedin.js");
const STATE = "GUEST";
const UserState = [];

function startServer() {
  // Serve the React app
  app.use(express.static(path.join(__dirname, "client/build")));

  // Configure session middleware
  app.use(
    session({
      secret: "yourSecretKey",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  // Root Route
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  });

  app.get("/api/config", (req, res) => {
    res.send({
      clientId: CONFIG.properties.CLIENT_ID,
      redirectUri: linkedinApi.REDIRECT_URI,
    });
  });

  //app.get("/login", (req, res) => {
  //const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinApi.CLIENT_ID}&redirect_uri=${linkedinApi.REDIRECT_URI}&state=${STATE}&scope=r_liteprofile%20r_emailaddress%20openid`;
  //const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CONFIG.properties.CLIENT_ID}&redirect_uri=${linkedinApi.REDIRECT_URI}&state=${STATE}&scope=openid%20profile%20email`;

  //res.redirect(linkedinAuthUrl);
  //res.send('Redirecting to LinkedIn...');
  //});

  // Login Route
  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  });

  app.get("/callback", async (req, res) => {
   
    const { code, state } = req.query;
    if (state !== STATE) {
      return res.status(400).send("State mismatch error.");
    }
    try {
      const accessToken = await linkedinApi.getAccessToken(code);
      const userInfo = await linkedinApi.getUserInfo(accessToken);
      console.log(`User info: ${JSON.stringify(userInfo)}`);
      //res.send(`User info: ${JSON.stringify(userInfo)}`);
      //res.sendFile(path.join(__dirname + '/client/build/index.html'));
      //res.cookie('userInfo', JSON.stringify(userInfo));
      UserState.push(userInfo);
      UserState.push({ isLoggedIn: true });
   

      

      
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching user information.");
    }
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

(async () => {
  CONFIG.init();
  startServer();
})();
