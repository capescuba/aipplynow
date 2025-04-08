// App.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import "./App.css";
import LinkedInCallback from "./components/linkedInCallback";
import Home from "./components/home";
import Session from "./libs/session";

const SESSION_TIMEOUT = 120000;

const matrixTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0D0D0D", paper: "#1A1A1A" },
    primary: { main: "#00CC00" },
    text: { primary: "#00FF00", secondary: "#B3B3B3" },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0D0D0D",
          boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)",
          overflow: "visible",
          width: "100%",
          maxWidth: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:hover": { boxShadow: "0 0 5px rgba(0, 255, 0, 0.5)" },
        },
      },
    },
  },
});

const vanillaTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#f5f5f5", paper: "#ffffff" },
    primary: { main: "#1976d2" },
    text: { primary: "#000000", secondary: "#666666" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1976d2",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          overflow: "visible",
          width: "100%",
          maxWidth: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:hover": { boxShadow: "0 0 5px rgba(0,0,0,0.2)" },
        },
      },
    },
  },
});

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

      ctx.fillStyle = "rgba(0, 204, 0, 0.5)"; // Darker green (#00CC00) with 50% opacity
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
        opacity: 0.4, // Reduced opacity
      }}
    />
  );
}

function App({ currentTheme, toggleTheme }) {
  const [configData, setConfigData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState({
    isLoggedIn: sessionStorage.getItem("isLoggedIn") === "true",
    userInfo: JSON.parse(Session.getSessionStorageWithTimeout("userInfo") || "{}"),
  });
  const navigate = useNavigate();

  const handleLogin = (code, userInfo, isLoggedIn) => {
    console.log("Received code:", code);
    if (userInfo && isLoggedIn) {
      setAuthState({ isLoggedIn: true, userInfo });
      Session.setSessionStorageWithTimeout("userInfo", JSON.stringify(userInfo), SESSION_TIMEOUT);
      Session.setSessionStorageWithTimeout("isLoggedIn", "true", SESSION_TIMEOUT);
    }
    navigate("/");
  };

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
        const response = await fetch("/api/config");
        if (!response.ok) throw new Error("Network response was not ok");
        const jsonData = await response.json();
        setConfigData(jsonData);
        setAuthState({
          isLoggedIn: jsonData.isLoggedIn,
          userInfo: jsonData.userInfo || {},
        });
        Session.setSessionStorageWithTimeout("userInfo", JSON.stringify(jsonData.userInfo), SESSION_TIMEOUT);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="App">Loading...</div>;
  if (error) return <div className="App">Error: {error}</div>;

  console.log("App - Rendering, isLoggedIn:", authState.isLoggedIn);
  return (
    <div className={`App ${currentTheme === "matrix" ? "matrix-theme" : ""}`}>
      {currentTheme === "matrix" && <MatrixBackground />}
      <CssBaseline />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onLogout={handleLogout}
              userInfo={authState.userInfo}
              isLoggedIn={authState.isLoggedIn}
              clientId={configData.clientId}
              redirectUri={configData.redirectUri}
              scope="openid profile email"
              state="GUEST"
              onLoginSuccess={handleLogin}
              currentTheme={currentTheme}
              toggleTheme={toggleTheme}
            />
          }
        />
        <Route path="/callback" element={<LinkedInCallback />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  const [currentTheme, setCurrentTheme] = useState("vanilla");
  const theme = currentTheme === "matrix" ? matrixTheme : vanillaTheme;

  const toggleTheme = () => {
    console.log("Toggling theme from", currentTheme, "to", currentTheme === "matrix" ? "vanilla" : "matrix");
    setCurrentTheme(currentTheme === "matrix" ? "vanilla" : "matrix");
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <App currentTheme={currentTheme} toggleTheme={toggleTheme} />
      </Router>
    </ThemeProvider>
  );
}