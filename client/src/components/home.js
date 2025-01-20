import React from "react";
import { Button, Container, Typography } from "@mui/material";

function Home({ onLogout }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("userInfo") === "true"
  );

  return (
    <Container>
      <image src="" />
      <Typography variant="h4" gutterBottom>
        Welcome to the Landing Page
      </Typography>
      <Button variant="contained" onClick={onLogout}>
        Logout
      </Button>
    </Container>
  );
}

export default Home;
