// App.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider, Box, Typography } from "@mui/material";
import "./App.css";
import LinkedInCallback from "./components/linkedInCallback";
import Home from "./components/home";
import Help from "./components/help";
import Session from "./libs/session";
import { modernTheme, matrixTheme } from "./themes";
import DebugPanel from "./components/DebugPanel";
import { withStateTracking } from "./libs/withStateTracking";
import { useTrackedState } from "./libs/useTrackedState";

const SESSION_TIMEOUT = 120000;

// Wrap components with state tracking
const TrackedHome = withStateTracking(Home);
const TrackedHelp = withStateTracking(Help);
const TrackedLinkedInCallback = withStateTracking(LinkedInCallback);

function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(13, 13, 13, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 204, 0, 0.5)";
      ctx.font = `${fontSize}px "Roboto Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += Math.random() * 0.25 + 0.25;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops.length = Math.floor(canvas.width / fontSize);
      drops.fill(1);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        opacity: 0.4,
      }}
    />
  );
}

function AppContent({ currentTheme, toggleTheme }) {
  const [configData, setConfigData] = useTrackedState("", "AppContent", "configData");
  const [loading, setLoading] = useTrackedState(true, "AppContent", "loading");
  const [error, setError] = useTrackedState(null, "AppContent", "error");
  const [authState, setAuthState] = useTrackedState({
    isLoggedIn: sessionStorage.getItem("isLoggedIn") === "true",
    userInfo: JSON.parse(Session.getSessionStorageWithTimeout("userInfo") || "{}"),
  }, "AppContent", "authState");
  const navigate = useNavigate();

  const handleLogin = useCallback((code, userInfo, isLoggedIn) => {
    console.log("Received code:", code);
    if (userInfo && isLoggedIn) {
      setAuthState({ isLoggedIn: true, userInfo });
      Session.setSessionStorageWithTimeout("userInfo", JSON.stringify(userInfo), SESSION_TIMEOUT);
      Session.setSessionStorageWithTimeout("isLoggedIn", "true", SESSION_TIMEOUT);
    }
    navigate("/");
  }, [navigate]);

  const handleLogout = async () => {
    try {
      console.log("Before logout - Cookies:", document.cookie);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      Session.setSessionStorageWithTimeout("isLoggedIn", "false", SESSION_TIMEOUT);
      Session.setSessionStorageWithTimeout("userInfo", "{}", SESSION_TIMEOUT);
      setAuthState({ isLoggedIn: false, userInfo: {} });
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("After logout - Cookies:", document.cookie);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "auth") {
        handleLogin(event.data.code, event.data.userInfo, event.data.isLoggedIn);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleLogin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching config data...");
        const response = await fetch("/api/config");
        console.log("Config response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Config fetch failed:", response.status, errorText);
          throw new Error(`Network response was not ok: ${response.status} ${errorText}`);
        }
        
        const jsonData = await response.json();
        console.log("Config data received:", jsonData);
        
        setConfigData(jsonData);
        setAuthState({
          isLoggedIn: jsonData.isLoggedIn,
          userInfo: jsonData.userInfo || {},
        });
        Session.setSessionStorageWithTimeout("userInfo", JSON.stringify(jsonData.userInfo), SESSION_TIMEOUT);
      } catch (err) {
        console.error("Error fetching config:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6">Loading...</Typography>
      <Typography variant="body2" color="text.secondary">
        Connecting to server...
      </Typography>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6" color="error">Error</Typography>
      <Typography variant="body1" color="error">
        {error}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please ensure the server is running and try again.
      </Typography>
    </Box>
  );

  console.log("App - Rendering, isLoggedIn:", authState.isLoggedIn);
  const theme = currentTheme === "matrix" ? matrixTheme : modernTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <Routes>
          <Route 
            path="/linkedin/callback" 
            element={
              <TrackedLinkedInCallback 
                onLoginSuccess={handleLogin}
                clientId={configData?.clientId}
                redirectUri={configData?.redirectUri}
              />
            } 
          />
          <Route path="/help" element={<TrackedHelp />} />
          <Route
            path="/"
            element={
              <TrackedHome
                onLogout={handleLogout}
                toggleTheme={toggleTheme}
                currentTheme={currentTheme}
                userInfo={authState.userInfo}
                isLoggedIn={authState.isLoggedIn}
                clientId={configData?.clientId}
                redirectUri={configData?.redirectUri}
                scope="openid profile email"
                state="GUEST"
                onLoginSuccess={handleLogin}
              />
            }
          />
        </Routes>
        <DebugPanel />
      </Box>
    </ThemeProvider>
  );
}

// Wrap AppContent with state tracking
const TrackedAppContent = withStateTracking(AppContent);

export default function AppWrapper() {
  const [currentTheme, setCurrentTheme] = useState("modern");

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === "matrix" ? "modern" : "matrix");
  };

  return (
    <Router>
      <TrackedAppContent currentTheme={currentTheme} toggleTheme={toggleTheme} />
    </Router>
  );
}