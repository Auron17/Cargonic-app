export const colors = {
  // Brand Highway Blue
  primary: '#2457F5',
  primaryDark: '#1A44C8',
  primaryLight: '#E3EAFE',
  primary50: '#F2F5FF',

  // Safety Amber / Bidding & Urgency
  accent: '#F97316',
  accentDark: '#EA580C',
  accentLight: '#FFEDD5',
  accent50: '#FFF7ED',

  // Deep Industrial Slate scale
  slate950: '#020617',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  // Surfaces & Backgrounds
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceBorder: '#E8EBF0',
  borderStrong: '#CBD5E1',

  // Feedback Colors
  success: '#10B981',
  successDark: '#059669',
  successLight: '#D1FAE5',
  success50: '#ECFDF5',

  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerLight: '#FEE2E2',
  danger50: '#FEF2F2',

  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#FEF3C7',
  warning50: '#FFFBEB',

  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#6B7686',
  textLight: '#8C96A5',
  textWhite: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
} as const;

/** Ilovaning to'q fon rangi (splash, balans kartasi, faol reys) */
export const ink = {
  900: '#0E1A2B',
  800: '#172538',
  700: '#22324A',
  muted: '#93A1B5',
} as const;

export const typography = {
  titleHero: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  bodyLead: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  micro: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
} as const;
