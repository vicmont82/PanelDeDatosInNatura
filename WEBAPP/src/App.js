import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import MainPanel from './components/MainPanel';
import logo from './assets/logo-marfrig.png';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';

const theme = createTheme({
  typography: {
    fontFamily: 'Fira Sans Condensed, sans-serif',
  },
});


function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <AppBar position="static">
          <Toolbar>
            <Box display="flex" alignItems="center">
              <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
              <Typography variant="h6" component="div">
                Panel de Datos In Natura
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <MainPanel />
      </div>
    </ThemeProvider>
  );
}

export default App;
