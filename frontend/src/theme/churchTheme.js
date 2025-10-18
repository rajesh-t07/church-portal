// Church Portal Theme Configuration
export const churchTheme = {
  // Brand Colors - Church inspired palette
  colors: {
    primary: {
      main: '#2c3e50', // Deep slate blue
      light: '#34495e',
      dark: '#1a252f',
      gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
    },
    secondary: {
      main: '#667eea', // Soft blue
      light: '#764ba2',
      dark: '#5a67d8',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    accent: {
      gold: '#f39c12', // Church gold
      emerald: '#27ae60', // Success green
      crimson: '#e74c3c', // Error red
      azure: '#3498db' // Info blue
    },
    background: {
      primary: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      secondary: '#f8f9fa',
      paper: '#ffffff',
      muted: 'rgba(255,255,255,0.9)'
    },
    text: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      muted: '#95a5a6',
      inverse: '#ffffff'
    },
    border: {
      light: '#e9ecef',
      medium: '#dee2e6',
      dark: '#ced4da'
    },
    status: {
      success: '#d4edda',
      successText: '#155724',
      error: '#f8d7da',
      errorText: '#721c24',
      warning: '#fff3cd',
      warningText: '#856404',
      info: '#d1ecf1',
      infoText: '#0c5460'
    }
  },

  // Typography
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    headings: {
      h1: { fontSize: '2.5rem', fontWeight: '300', lineHeight: '1.2' },
      h2: { fontSize: '2rem', fontWeight: '400', lineHeight: '1.3' },
      h3: { fontSize: '1.5rem', fontWeight: '500', lineHeight: '1.4' },
      h4: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.4' },
      h5: { fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.5' },
      h6: { fontSize: '1rem', fontWeight: '700', lineHeight: '1.5' }
    },
    body: {
      large: { fontSize: '1.125rem', lineHeight: '1.6' },
      medium: { fontSize: '1rem', lineHeight: '1.5' },
      small: { fontSize: '0.875rem', lineHeight: '1.4' },
      caption: { fontSize: '0.75rem', lineHeight: '1.3' }
    }
  },

  // Spacing System
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem'     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    lg: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
    xl: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
    '2xl': '0 25px 50px rgba(0,0,0,0.25)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    focus: '0 0 0 3px rgba(102, 126, 234, 0.5)'
  },

  // Component Styles
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
        }
      },
      secondary: {
        background: '#ffffff',
        color: '#667eea',
        border: '1px solid #667eea',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        ':hover': {
          background: '#667eea',
          color: '#ffffff',
          transform: 'translateY(-1px)'
        }
      },
      success: {
        background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
        color: '#ffffff'
      },
      danger: {
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        color: '#ffffff'
      }
    },
    card: {
      background: '#ffffff',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
      border: '1px solid rgba(255,255,255,0.18)',
      transition: 'all 0.3s ease'
    },
    input: {
      background: '#ffffff',
      border: '1px solid #dee2e6',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease',
      ':focus': {
        borderColor: '#667eea',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
      }
    },
    navigation: {
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      padding: '1rem 0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    '2xl': '1400px'
  }
};

// Helper functions for theme usage
export const getColor = (colorPath) => {
  return colorPath.split('.').reduce((obj, key) => obj[key], churchTheme.colors);
};

export const getSpacing = (size) => {
  return churchTheme.spacing[size] || size;
};

export const getShadow = (size) => {
  return churchTheme.shadows[size] || churchTheme.shadows.md;
};

// Church-specific brand elements
export const churchBranding = {
  name: "Atlanta Little Flock Church",
  motto: "Fear Not, little flock",
  logo: "⛪",
  logoCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#2c3e50',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1.1',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  }
};

export default churchTheme;