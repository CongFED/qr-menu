'use client';

import { createTheme } from '@mui/material/styles';

// ============================================================
// Suối Đá Hòn Giao - Custom Modern Material UI Theme
// Vibrant Coral Orange (#FF5B26) + Slate + Rounded Aesthetics
// ============================================================

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF5B26',
      light: '#FFF2ED',
      dark: '#E04817',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F172A',
      light: '#334155',
      dark: '#020617',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    success: {
      main: '#16A34A',
      light: '#DCFCE7',
      dark: '#15803D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      light: '#FFFBEB',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#FEF2F2',
      dark: '#DC2626',
    },
    divider: '#F1F5F9',
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 14px 0 rgba(255, 91, 38, 0.25)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
          color: '#FFFFFF',
          '&:hover': {
            background: 'linear-gradient(135deg, #E04817 0%, #D83B00 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid #F1F5F9',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 20,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
        },
        colorSuccess: {
          backgroundColor: '#16A34A',
          color: '#FFFFFF !important',
          fontWeight: 800,
          '& .MuiChip-label': {
            color: '#FFFFFF !important',
          },
          '& .MuiChip-icon': {
            color: '#FFFFFF !important',
          },
        },
      },
    },
  },
});
