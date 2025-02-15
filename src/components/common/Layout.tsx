import React, { ReactNode } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DEFAULT_THEME } from '../../utils/constants';

const theme = createTheme({
  palette: {
    background: {
      default: DEFAULT_THEME.colors.background,
    },
    primary: {
      main: DEFAULT_THEME.colors.interactive,
    },
    secondary: {
      main: DEFAULT_THEME.colors.secondary,
    },
    text: {
      primary: DEFAULT_THEME.colors.text,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: DEFAULT_THEME.colors.background,
        },
      },
    },
  },
});

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
} 