import React, { useState } from "react";
import { Button, Container, Typography, Stack } from "@mui/material";
import Header from "./header";
import Session from "../libs/session";
import PDFHandler from "./pdfHandler"

function PDFPreview() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
}

function Home({ onLogout }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Session.getSessionStorageWithTimeout("isLoggedIn") === "true"
  );

  const UserInfo =
    JSON.parse(Session.getSessionStorageWithTimeout("userInfo")) || {};

  return (
    <Container>
      <Header userInfo={UserInfo} />

      <Typography variant="h4" gutterBottom>
        Welcome to the Landing Page
      </Typography>

      <Button variant="contained" onClick={onLogout}>
        Logout
      </Button>
      <PDFHandler />
      
    </Container>
  );
}

export default Home;
