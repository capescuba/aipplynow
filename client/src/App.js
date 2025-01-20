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

// Components
import LinkedInPage from "./components/linkedin";
import LinkedInCallback from "./components/linkedInCallback";
import Home from "./components/home";

function App() {
  const [configData, setConfigData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", true);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.setItem("isLoggedIn", false);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin === window.location.origin) {
        if (event.data.type === "auth" && event.data.code) {
          handleLogin();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/config");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const jsonData = await response.json();
        setConfigData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Router>
      <CssBaseline />
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Home onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/login"
            element={
              !isLoggedIn ? (
                <LinkedInPage
                  clientId={configData.clientId}
                  redirectUri={configData.redirectUri}
                  scope="openid profile email"
                  state="GUEST"
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/callback"
            element={<LinkedInCallback onLogin={handleLogin} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
