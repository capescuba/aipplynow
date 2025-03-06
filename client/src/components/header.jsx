import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled, textAlign } from '@mui/system';
import { createTheme, ThemeProvider } from '@mui/material/styles';


const theme = createTheme({
  spacing: 8, // Adjust the spacing value if necessary
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

const Header = ({ userInfo }) => {
  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <MenuButton edge="start" color="inherit" aria-label="home">
            <HomeIcon />
          </MenuButton>
          <Title variant="h4" sx={{textAlign: 'center', flexGrow: 1}}>
            AIpply Now
          </Title>
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
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
};

export default Header;
