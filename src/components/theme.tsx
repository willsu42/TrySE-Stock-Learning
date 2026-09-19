import React, { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { Locale } from '../domain/types';

const english = {
  ink: '#172D2A',
  muted: '#65756F',
  accent: '#186B52',
  accentSoft: '#DDF3E8',
  highlight: '#DBF483',
  cream: '#F6F7F2',
  line: '#E1E7DF',
  white: '#FFFFFF',
  danger: '#AD4141',
  amber: '#8A5B1A',
  positive: '#186B52',
  negative: '#AD4141',
  surface: '#FCFDF9',
  secondary: '#EFF3EB',
  soft: '#EEF2E6',
  plain: '#EEF1EB',
  inputBorder: '#C7D5CD',
  inputBackground: '#FAFCF9',
  placeholder: '#8A9891',
  heroMuted: '#BDCFC6',
  track: '#ECF0E8',
};
type Palette = typeof english;
const chinese: Palette = {
  ink: '#202B42',
  muted: '#667085',
  accent: '#3558A2',
  accentSoft: '#E7EDFA',
  highlight: '#C7D7FF',
  cream: '#F5F6FA',
  line: '#DFE3EC',
  white: '#FFFFFF',
  danger: '#AD4141',
  amber: '#8A5B1A',
  positive: '#B33D48',
  negative: '#23734F',
  surface: '#FCFCFE',
  secondary: '#EDF0F7',
  soft: '#EDF0F8',
  plain: '#EEF0F5',
  inputBorder: '#C9CFDC',
  inputBackground: '#FAFBFE',
  placeholder: '#778296',
  heroMuted: '#C6CEE0',
  track: '#E7EAF2',
};
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      padding: 22,
      gap: 14,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    between: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    column: { gap: 20 },
    eyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.7,
      textTransform: 'uppercase',
    },
    h1: { color: colors.ink, fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
    h2: { color: colors.ink, fontSize: 21, lineHeight: 28, fontWeight: '600', letterSpacing: -0.3 },
    h3: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '600' },
    text: { color: colors.ink, fontSize: 14, lineHeight: 22 },
    muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
    metric: { color: colors.ink, fontSize: 28, fontWeight: '600', letterSpacing: -0.8 },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.ink,
      backgroundColor: colors.inputBackground,
      minHeight: 48,
    },
  });

const themes = {
  en: { colors: english, styles: createStyles(english) },
  'zh-TW': { colors: chinese, styles: createStyles(chinese) },
};
const ThemeContext = createContext(themes.en);
export function ThemeProvider({ locale, children }: React.PropsWithChildren<{ locale: Locale }>) {
  return <ThemeContext.Provider value={themes[locale]}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
