import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

function LinkedInCallback() {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (code) {
      console.log("LinkedInCallback - Code:", code);
      window.opener.postMessage({ type: "auth", code }, window.location.origin);
      setTimeout(() => window.close(), 100);
    } else if (error) {
      console.error("LinkedInCallback - Error:", error);
      window.opener.postMessage({ type: "error", error }, window.location.origin);
      window.close();
    }
  }, [location]);

  return <div>Processing...</div>;
}

export default LinkedInCallback;