// Header.js
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { spacing } from "../themes";

function Header({
  userInfo,
  isLoggedIn,
  clientId,
  redirectUri,
  scope,
  state,
  onLoginSuccess,
  onLogout,
  currentTheme,
  toggleTheme,
}) {
  console.log("Header component rendering with props:", {
    isLoggedIn,
    currentTheme,
    hasUserInfo: !!userInfo,
    hasClientId: !!clientId
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    const linkedInUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    window.open(linkedInUrl, "_blank");
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontFamily: currentTheme === "matrix" ? '"Roboto Mono", monospace' : "inherit",
            color: currentTheme === "matrix" ? "#00FF00" : theme.palette.text.primary,
          }}
        >
          AIpplyNow
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <Tooltip title={`Switch to ${currentTheme === "matrix" ? "modern" : "matrix"} theme`}>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              sx={{
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "rotate(180deg)",
                },
              }}
            >
              {currentTheme === "matrix" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {isLoggedIn ? (
            <>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenu}
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit"
                >
                  {userInfo?.picture ? (
                    <Avatar
                      src={userInfo.picture}
                      alt={userInfo.name}
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
              </Tooltip>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {userInfo?.name || "User"}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={handleLogin}
              startIcon={<LoginIcon />}
              sx={{
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {isMobile ? "Login" : "Login with LinkedIn"}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;