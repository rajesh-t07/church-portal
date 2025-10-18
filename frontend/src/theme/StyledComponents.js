import { churchTheme, churchBranding } from './churchTheme';

// Reusable styled components and utilities
export const StyledComponents = {
  // Page Layout
  PageContainer: {
    minHeight: '100vh',
    background: churchTheme.colors.background.primary,
    fontFamily: churchTheme.typography.fontFamily
  },

  ContentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: churchTheme.spacing.xl
  },

  // Header Components
  ChurchHeader: {
    background: churchTheme.colors.primary.gradient,
    padding: `${churchTheme.spacing.xl} 0`,
    boxShadow: churchTheme.shadows.lg,
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },

  ChurchHeaderContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `0 ${churchTheme.spacing.xl}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  ChurchBranding: {
    display: 'flex',
    alignItems: 'center',
    gap: churchTheme.spacing.lg
  },

  ChurchLogo: {
    ...churchBranding.logoCircle
  },

  ChurchInfo: {
    color: churchTheme.colors.text.inverse
  },

  ChurchName: {
    margin: 0,
    fontSize: churchTheme.typography.headings.h3.fontSize,
    fontWeight: churchTheme.typography.headings.h3.fontWeight,
    color: churchTheme.colors.text.inverse
  },

  ChurchMotto: {
    margin: 0,
    fontSize: churchTheme.typography.body.small.fontSize,
    color: '#bdc3c7',
    fontStyle: 'italic'
  },

  // Card Components
  Card: {
    ...churchTheme.components.card,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: churchTheme.shadows.lg
    }
  },

  WelcomeCard: {
    ...churchTheme.components.card,
    textAlign: 'center',
    marginBottom: churchTheme.spacing.xl,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
    backdropFilter: 'blur(10px)'
  },

  // Dashboard Grid
  DashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: churchTheme.spacing.xl,
    marginBottom: churchTheme.spacing['2xl']
  },

  DashboardCard: {
    ...churchTheme.components.card,
    minHeight: '200px',
    height: 'auto',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    border: `1px solid ${churchTheme.colors.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: churchTheme.shadows.xl
    }
  },

  // Form Components
  FormContainer: {
    ...churchTheme.components.card,
    maxWidth: '800px',
    margin: '0 auto'
  },

  FormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: churchTheme.spacing.lg,
    marginBottom: churchTheme.spacing.lg
  },

  FormGroup: {
    marginBottom: churchTheme.spacing.lg
  },

  Label: {
    display: 'block',
    marginBottom: churchTheme.spacing.sm,
    fontWeight: '600',
    color: churchTheme.colors.text.primary,
    fontSize: churchTheme.typography.body.small.fontSize
  },

  Input: {
    ...churchTheme.components.input,
    width: '100%',
    boxSizing: 'border-box'
  },

  TextArea: {
    ...churchTheme.components.input,
    width: '100%',
    resize: 'vertical',
    minHeight: '80px',
    boxSizing: 'border-box'
  },

  Select: {
    ...churchTheme.components.input,
    width: '100%',
    boxSizing: 'border-box',
    background: churchTheme.colors.background.paper
  },

  // Button Components
  Button: {
    ...churchTheme.components.button.primary
  },

  ButtonSecondary: {
    ...churchTheme.components.button.secondary
  },

  ButtonSuccess: {
    ...churchTheme.components.button.primary,
    ...churchTheme.components.button.success
  },

  ButtonDanger: {
    ...churchTheme.components.button.primary,
    ...churchTheme.components.button.danger
  },

  ButtonSmall: {
    padding: `${churchTheme.spacing.sm} ${churchTheme.spacing.md}`,
    fontSize: churchTheme.typography.body.small.fontSize
  },

  // Table Components
  Table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: `1px solid ${churchTheme.colors.border.medium}`,
    borderRadius: churchTheme.borderRadius.md,
    overflow: 'hidden',
    fontSize: churchTheme.typography.body.small.fontSize,
    boxShadow: churchTheme.shadows.sm
  },

  TableHeader: {
    background: churchTheme.colors.background.secondary,
    fontWeight: '600',
    color: churchTheme.colors.text.primary
  },

  TableHeaderCell: {
    padding: churchTheme.spacing.md,
    textAlign: 'left',
    borderBottom: `1px solid ${churchTheme.colors.border.medium}`,
    borderRight: `1px solid ${churchTheme.colors.border.medium}`
  },

  TableCell: {
    padding: churchTheme.spacing.md,
    borderBottom: `1px solid ${churchTheme.colors.border.light}`,
    borderRight: `1px solid ${churchTheme.colors.border.light}`
  },

  TableRowEven: {
    background: churchTheme.colors.background.paper
  },

  TableRowOdd: {
    background: '#f9f9f9'
  },

  // Navigation Components
  Navigation: {
    ...churchTheme.components.navigation
  },

  NavLink: {
    color: churchTheme.colors.text.inverse,
    textDecoration: 'none',
    padding: `${churchTheme.spacing.sm} ${churchTheme.spacing.md}`,
    borderRadius: churchTheme.borderRadius.md,
    fontSize: churchTheme.typography.body.small.fontSize,
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: churchTheme.spacing.sm,
    transition: 'all 0.2s ease',
    border: '1px solid transparent'
  },

  NavLinkActive: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)'
  },

  // Status Components
  StatusBadge: {
    padding: `${churchTheme.spacing.xs} ${churchTheme.spacing.sm}`,
    borderRadius: churchTheme.borderRadius.full,
    fontSize: churchTheme.typography.body.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    display: 'inline-block'
  },

  StatusSuccess: {
    background: churchTheme.colors.status.success,
    color: churchTheme.colors.status.successText,
    border: `1px solid #c3e6cb`
  },

  StatusError: {
    background: churchTheme.colors.status.error,
    color: churchTheme.colors.status.errorText,
    border: `1px solid #f5c6cb`
  },

  StatusWarning: {
    background: churchTheme.colors.status.warning,
    color: churchTheme.colors.status.warningText,
    border: `1px solid #ffeaa7`
  },

  StatusInfo: {
    background: churchTheme.colors.status.info,
    color: churchTheme.colors.status.infoText,
    border: `1px solid #bee5eb`
  },

  // Alert Components
  Alert: {
    padding: `${churchTheme.spacing.md} ${churchTheme.spacing.lg}`,
    borderRadius: churchTheme.borderRadius.md,
    marginBottom: churchTheme.spacing.lg,
    fontSize: churchTheme.typography.body.small.fontSize,
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: churchTheme.spacing.sm
  },

  AlertSuccess: {
    background: churchTheme.colors.status.success,
    color: churchTheme.colors.status.successText,
    border: `1px solid #c3e6cb`
  },

  AlertError: {
    background: churchTheme.colors.status.error,
    color: churchTheme.colors.status.errorText,
    border: `1px solid #f5c6cb`
  },

  AlertWarning: {
    background: churchTheme.colors.status.warning,
    color: churchTheme.colors.status.warningText,
    border: `1px solid #ffeaa7`
  },

  AlertInfo: {
    background: churchTheme.colors.status.info,
    color: churchTheme.colors.status.infoText,
    border: `1px solid #bee5eb`
  },

  // Loading Component
  LoadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: churchTheme.colors.background.primary
  },

  LoadingText: {
    fontSize: churchTheme.typography.body.large.fontSize,
    color: churchTheme.colors.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: churchTheme.spacing.md
  },

  // Icon Components
  Icon: {
    width: '20px',
    height: '20px',
    display: 'inline-block'
  },

  IconLarge: {
    width: '24px',
    height: '24px'
  },

  // Utility Classes
  TextCenter: {
    textAlign: 'center'
  },

  TextLeft: {
    textAlign: 'left'
  },

  TextRight: {
    textAlign: 'right'
  },

  FlexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  FlexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  FlexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },

  MarginBottom: {
    marginBottom: churchTheme.spacing.lg
  },

  MarginTop: {
    marginTop: churchTheme.spacing.lg
  },

  PaddingAll: {
    padding: churchTheme.spacing.lg
  }
};

// Icon SVG Components
export const Icons = {
  Dashboard: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),

  DollarSign: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),

  FileText: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  ),

  BarChart: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),

  Users: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),

  CreditCard: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),

  CheckSquare: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9,11 12,14 22,4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),

  LogOut: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),

  Activity: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  ),

  HelpCircle: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),

  Archive: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  )
};

export default StyledComponents;