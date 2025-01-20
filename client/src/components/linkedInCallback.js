import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function LinkedInCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  //const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  //alert("LinkedInCallback");
  //alert("LinkedInCallback location.search: " + location.search);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    //alert("LinkedInCallback urlParams: " + urlParams);
    //alert("LinkedInCallback code: " + code);
    //alert("LinkedInCallback error: " + error);

    if (code) {
      console.log("Authorization code: ", code);
      // Exchange code for access token here
      //localStorage.setItem("isLoggedIn", true); 
      //setIsLoggedIn(true);
      window.opener.postMessage({ type: "auth", code }, "*"); 
      window.close();
      //navigate("/");
    }
    if (error) {
      console.error("Error: ", error);
      navigate("/");
    }
  }, [location, navigate]);

  return <div>Processing...</div>;
}

export default LinkedInCallback;
