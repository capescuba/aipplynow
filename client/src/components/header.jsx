// Header.js
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import { styled } from "@mui/system";
import { LinkedIn } from "react-linkedin-login-oauth2";
import linkedin from "react-linkedin-login-oauth2/assets/linkedin.png";

// Styled components
const Root = styled("div")({
  flexGrow: 1,
});

const MenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
  color: "#00FF00",
}));

const Title = styled(Typography)({
  whiteSpace: "nowrap",
});

const Profile = styled(Avatar)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  cursor: "pointer",
  border: "1px solid #00CC00",
  "&:hover": {
    boxShadow: "0 0 5px #00FF00",
  },
}));

const Header = ({
  userInfo,
  isLoggedIn,
  clientId,
  redirectUri,
  scope,
  state,
  onLoginSuccess,
  onLogout,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    onLogout();
    handleClose();
  };

  console.log("Header - isLoggedIn:", isLoggedIn);
  console.log("Header - userInfo:", userInfo);
  console.log("Header - Rendering right side:", isLoggedIn ? "Logged In" : "Logged Out");

  return (
    <Root>
      <AppBar
        position="fixed"
        sx={{
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1200,
          backgroundColor: "#0D0D0D",
          borderBottom: "1px solid #00CC00",
          overflowX: "visible",
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "nowrap",
            width: "100%",
          }}
        >
          {/* Left Side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              maxWidth: "50%",
            }}
          >
            <MenuButton edge="start" aria-label="home">
              <HomeIcon />
            </MenuButton>
            <Title variant="h4">Neo Resume</Title>
          </div>

          {/* Right Side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexShrink: 0,
              flexGrow: 1,
              minWidth: "300px",
              maxWidth: "50%",
              paddingRight: "16px",
              overflow: "visible",
            }}
          >
            {isLoggedIn ? (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#00FF00",
                    marginRight: "16px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "none",
                    visibility: "visible",
                  }}
                >
                  Welcome {userInfo?.name || "User"}
                </Typography>
                <IconButton
                  aria-label="notifications"
                  sx={{ color: "#00FF00", margin: "0 8px", visibility: "visible" }}
                >
                  <NotificationsIcon />
                </IconButton>
                <IconButton
                  aria-label="settings"
                  sx={{ color: "#00FF00", margin: "0 8px", visibility: "visible" }}
                >
                  <SettingsIcon />
                </IconButton>
                <Profile
                  alt="Profile Picture"
                  src={userInfo?.picture || ""}
                  onClick={handleMenu}
                  sx={{ visibility: "visible" }}
                />
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    sx: {
                      backgroundColor: "#1A1A1A",
                      color: "#00FF00",
                      border: "1px solid #00CC00",
                    },
                  }}
                >
                  <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <LinkedIn
                clientId={clientId}
                redirectUri={redirectUri}
                scope={scope}
                state={state}
                onSuccess={(code) => {
                  console.log("LinkedIn Success Code:", code);
                  onLoginSuccess(code);
                }}
                onError={(error) => {
                  console.log("LinkedIn Error:", error);
                }}
              >
                {({ linkedInLogin }) => (
                  <img
                    onClick={linkedInLogin}
                    src={linkedin}
                    alt="Sign in with LinkedIn"
                    style={{
                      maxWidth: "180px",
                      cursor: "pointer",
                      filter: "drop-shadow(0 0 3px #00FF00)",
                      visibility: "visible",
                    }}
                  />
                )}
              </LinkedIn>
            )}
          </div>
        </Toolbar>
      </AppBar>
    </Root>
  );
};

export default Header;