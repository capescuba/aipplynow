import React from "react";
import { Button, Container, Typography } from "@mui/material";
import Header from "./header";
import PDFHandler from "./pdfHandler";

function Home({ onLogout, userInfo, isLoggedIn, clientId, redirectUri, scope, state, onLoginSuccess }) {
  return (
    <Container>
      <Header 
        userInfo={userInfo} 
        isLoggedIn={isLoggedIn} 
        clientId={clientId}
        redirectUri={redirectUri}
        scope={scope}
        state={state}
        onLoginSuccess={onLoginSuccess}
      />

      {isLoggedIn && (
        <>
          <Typography variant="h4" gutterBottom>
            Welcome to the Landing Page
          </Typography>
          <Button variant="contained" onClick={onLogout}>
            Logout
          </Button>
          <PDFHandler />
        </>
      )}
    </Container>
  );
}

export default Home;