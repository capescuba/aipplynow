import React from "react";
import { LinkedIn } from "react-linkedin-login-oauth2";
import linkedin from "react-linkedin-login-oauth2/assets/linkedin.png";

const LinkedInPage = ({ clientId, redirectUri, scope, state }) => {
  return (
    <LinkedIn
      clientId={clientId}
      redirectUri={redirectUri}
      //redirectUri="http://localhost:3000/callback"
      scope={scope}
      state={state}
      onSuccess={(code) => {
        console.log(code);
        alert(code);
        window.close();
      }}
      onError={(error) => {
        console.log(error);
      }}
    >
      {({ linkedInLogin }) => (
        <img
          onClick={linkedInLogin}
          src={linkedin}
          alt="Sign in with Linked In"
          style={{ maxWidth: "180px", cursor: "pointer" }}
        />
      )}
    </LinkedIn>
  );
};

export default LinkedInPage;
