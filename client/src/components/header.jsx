import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/system';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LinkedIn } from "react-linkedin-login-oauth2";
import linkedin from "react-linkedin-login-oauth2/assets/linkedin.png";

const theme = createTheme({
  spacing: 8,
});

const Root = styled('div')(({ theme }) => ({
  flexGrow: 1,
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
}));

const Profile = styled(Avatar)(({ theme }) => ({
  marginLeft: theme.spacing(2),
}));

const Header = ({ userInfo, isLoggedIn, clientId, redirectUri, scope, state, onLoginSuccess }) => {
  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <MenuButton edge="start" color="inherit" aria-label="home">
            <HomeIcon />
          </MenuButton>
          <Title variant="h4" sx={{ textAlign: 'center', flexGrow: 1 }}>
            AIpply Now
          </Title>

          {isLoggedIn ? (
            <>
              <Typography variant="h7" component="div" sx={{ flexGrow: 1, textAlign: 'right' }}>
                Welcome {userInfo.name}
              </Typography>
              <IconButton color="inherit" aria-label="notifications">
                <NotificationsIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="settings">
                <SettingsIcon />
              </IconButton>
              <Profile alt="Profile Picture" src={userInfo.picture || ""} />
            </>
          ) : (
            <LinkedIn
              clientId={clientId}
              redirectUri={redirectUri}
              scope={scope}
              state={state}
              onSuccess={(code) => {
                console.log(code);
                onLoginSuccess(code); // Call the login success handler
              }}
              onError={(error) => {
                console.log(error);
              }}
            >
              {({ linkedInLogin }) => (
                <img
                  onClick={linkedInLogin}
                  src={linkedin}
                  alt="Sign in with LinkedIn"
                  style={{ maxWidth: "180px", cursor: "pointer" }}
                />
              )}
            </LinkedIn>
          )}
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
};

export default Header;