import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { CssBaseline } from "@mui/material";
import "./App.css";
import LinkedInCallback from "./components/linkedInCallback";
import Home from "./components/home";
import Session from "./libs/session";

const SESSION_TIMEOUT = 120000;

function App() {
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
      const response = await fetch("/api/logout");
      if (!response.ok) throw new Error("Logout failed");
      Session.setSessionStorageWithTimeout("isLoggedIn", false, SESSION_TIMEOUT);
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
      console.log("App - Message received:", event.data);
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "auth") {
        handleLogin(event.data.code, event.data.userInfo, event.data.isLoggedIn);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log("App - Rendering, isLoggedIn:", authState.isLoggedIn);
  return (
    <div className="App">
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
  return (
    <Router>
      <App />
    </Router>
  );
}