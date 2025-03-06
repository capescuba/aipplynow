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
import Session from "./libs/session";
const SESSION_TIMEOUT = 120000;

function App() {
  const [configData, setConfigData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("isLoggedIn") === "true"
  );

  const handleLogin = async () => {

    //alert("handle login getCookie document.cookie = " + document.cookie); 
    //const token = Session.getCookie("token");
    //alert("handleLogin  updated- token: " + token);
    
    try {

      const response = await fetch("/api/user/login");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
  
      // Set user data in local storage or session state
      Session.setSessionStorageWithTimeout('isLoggedIn', true, SESSION_TIMEOUT); 
      Session.setSessionStorageWithTimeout('userInfo', JSON.stringify(data), SESSION_TIMEOUT); 
      setIsLoggedIn(true);
  
      // Additional logic after successful login
      console.log('User Info:', data);
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };
  

  const handleLogout = () => {
    Session.setSessionStorageWithTimeout("isLoggedIn", false, SESSION_TIMEOUT);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin === window.location.origin) {
        if (event.data.type === "auth" && event.data.code) {
          handleLogin(event.data.code);
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
        setIsLoggedIn(jsonData.isLoggedIn);
        Session.setSessionStorageWithTimeout('userInfo', JSON.stringify(jsonData.userInfo), SESSION_TIMEOUT); 
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
