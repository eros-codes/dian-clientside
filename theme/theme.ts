"use client";

import { createTheme } from "@mui/material/styles";
import colors, { hexToRgba } from '../client-colors';
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

const baseTheme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.teal,
      light: colors.tealLight,
      dark: colors.tealDark,
    },
    error: {
      main: colors.danger,
      light: colors.dangerLight,
      dark: colors.dangerDark,
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
      dark: colors.warningDark,
    },
    success: {
      main: colors.success,
      light: colors.successLight,
      dark: colors.successDark,
    },
    grey: {
      50: colors.gray50,
      100: colors.gray100,
      200: colors.gray200,
      300: colors.gray300,
      400: colors.gray400,
      500: colors.gray500,
      600: colors.gray600,
      700: colors.gray700,
      800: colors.gray800,
      900: colors.gray900,
    },
    background: {
      default: colors.paper,
      paper: colors.paper,
    },
  },
  typography: {
    fontFamily: "Vazirmatn, system-ui, -apple-system, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export const theme = createTheme(baseTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: "rtl",
          fontFamily: "Vazirmatn, system-ui, -apple-system, sans-serif",
          // prefer CSS variable so runtime changes to --page-background and --foreground take effect
          backgroundColor: `var(--page-background, ${colors.pageBackground})`,
          color: `var(--foreground, ${colors.gray900})`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // ensure MUI outlined inputs follow our CSS vars at runtime
          backgroundColor: `var(--input-bg, ${colors.inputBg})`,
          color: `var(--input-text, ${colors.inputText})`,
          // explicitly keep border radius so the notched outline inherits it
          borderRadius: 8,
        },
        notchedOutline: {
          borderColor: `var(--input-border, ${colors.inputBorder})`,
          // ensure the outline corners stay rounded when overridden by global CSS
          borderRadius: 8,
        },
        input: {
          '&::placeholder': {
            color: `var(--input-placeholder, ${colors.inputPlaceholder})`,
          },
        },
        // focused state: use CSS var but provide a subtle rgba fallback using hexToRgba
        // note: the global CSS rules are the primary source; these are helpful in SSR
        // and for components that get inline styling from MUI theme.
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          /* don't render a focus ring from MUI theme; keep border none */
          border: 'none',
          borderColor: 'transparent',
          boxShadow: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          backgroundColor: `var(--input-bg, ${colors.inputBg})`,
          color: `var(--input-text, ${colors.inputText})`,
        },
      },
    },
  },
});

// RTL cache for Emotion
export const rtlCache = {
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
};
