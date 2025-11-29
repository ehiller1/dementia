/**
 * Branding Configuration
 * 
 * Centralized branding constants extracted from Index.css and App.css
 * for consistent application across UI components.
 */

export const brandColors = {
  // Primary brand color - Green
  primary: 'hsl(142, 100%, 35%)',
  primaryForeground: 'hsl(0, 0%, 98%)',
  
  // Background - Pure White
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(240, 10%, 3.9%)',
  
  // Cards and popovers
  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(240, 10%, 3.9%)',
  
  // Secondary
  secondary: 'hsl(240, 4.8%, 95.9%)',
  secondaryForeground: 'hsl(240, 5.9%, 10%)',
  
  // Muted
  muted: 'hsl(240, 4.8%, 95.9%)',
  mutedForeground: 'hsl(240, 3.8%, 46.1%)',
  
  // Accent
  accent: 'hsl(240, 4.8%, 95.9%)',
  accentForeground: 'hsl(240, 5.9%, 10%)',
  
  // Semantic colors
  destructive: 'hsl(4, 92%, 49%)',
  destructiveForeground: 'hsl(0, 0%, 98%)',
  warning: 'hsl(31, 100%, 50%)',
  warningForeground: 'hsl(0, 0%, 98%)',
  info: 'hsl(199, 100%, 50%)',
  infoForeground: 'hsl(0, 0%, 98%)',
  success: 'hsl(142, 100%, 35%)',
  successForeground: 'hsl(0, 0%, 98%)',
  
  // Border and inputs
  border: 'hsl(240, 5.9%, 90%)',
  input: 'hsl(240, 5.9%, 90%)',
  ring: 'hsl(240, 5.9%, 10%)',
} as const;

export const brandTypography = {
  fontFamily: "'Archivo', sans-serif",
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const brandSpacing = {
  radius: '0.75rem',
} as const;

export const brandAnimations = {
  fadeIn: 'fadeIn 0.6s ease-out forwards',
  slideUp: 'slideUp 0.5s ease-out forwards',
  scaleIn: 'scaleIn 0.4s ease-out forwards',
} as const;

/**
 * Apply branding to component inline styles
 */
export function getBrandStyle(type: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'card') {
  switch (type) {
    case 'primary':
      return {
        backgroundColor: brandColors.primary,
        color: brandColors.primaryForeground,
        fontFamily: brandTypography.fontFamily,
      };
    case 'secondary':
      return {
        backgroundColor: brandColors.secondary,
        color: brandColors.secondaryForeground,
        fontFamily: brandTypography.fontFamily,
      };
    case 'success':
      return {
        backgroundColor: brandColors.success,
        color: brandColors.successForeground,
        fontFamily: brandTypography.fontFamily,
      };
    case 'warning':
      return {
        backgroundColor: brandColors.warning,
        color: brandColors.warningForeground,
        fontFamily: brandTypography.fontFamily,
      };
    case 'destructive':
      return {
        backgroundColor: brandColors.destructive,
        color: brandColors.destructiveForeground,
        fontFamily: brandTypography.fontFamily,
      };
    case 'card':
      return {
        backgroundColor: brandColors.card,
        color: brandColors.cardForeground,
        border: `1px solid ${brandColors.border}`,
        borderRadius: brandSpacing.radius,
        fontFamily: brandTypography.fontFamily,
      };
    default:
      return {};
  }
}

/**
 * CSS class name builder with branding
 */
export function brandClass(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Status color mapping for consistent status indicators
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    success: brandColors.success,
    completed: brandColors.success,
    active: brandColors.info,
    running: brandColors.info,
    pending: brandColors.warning,
    warning: brandColors.warning,
    error: brandColors.destructive,
    failed: brandColors.destructive,
    blocked: brandColors.destructive,
  };
  
  return statusMap[status.toLowerCase()] || brandColors.muted;
}

/**
 * Badge variant styles
 */
export function getBadgeStyle(variant: 'default' | 'success' | 'warning' | 'destructive' | 'info') {
  const variants = {
    default: {
      backgroundColor: brandColors.secondary,
      color: brandColors.secondaryForeground,
    },
    success: {
      backgroundColor: brandColors.success,
      color: brandColors.successForeground,
    },
    warning: {
      backgroundColor: brandColors.warning,
      color: brandColors.warningForeground,
    },
    destructive: {
      backgroundColor: brandColors.destructive,
      color: brandColors.destructiveForeground,
    },
    info: {
      backgroundColor: brandColors.info,
      color: brandColors.infoForeground,
    },
  };
  
  return variants[variant];
}
