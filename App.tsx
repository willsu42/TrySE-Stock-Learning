import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/storage/state';
import { Badge, Button, ThemeProvider, errorText, Icon, useTheme } from './src/components/ui';
import { Home, Tab } from './src/screens/Home';
import { Learn } from './src/screens/Learn';
import { Trade } from './src/screens/Trade';
import { Lab } from './src/screens/Lab';
import { Library } from './src/screens/Library';

const nav: { id: Tab; en: string; zh: string }[] = [
  { id: 'home', en: 'Overview', zh: '總覽' },
  { id: 'learn', en: 'Learn', zh: '學習' },
  { id: 'trade', en: 'Practice', zh: '練習' },
  { id: 'lab', en: 'Forecast lab', zh: '實驗室' },
  { id: 'library', en: 'Resources', zh: '資源' },
];
function Shell() {
  const { colors, styles: s } = useTheme();
  const local = createLocalStyles(colors);
  const { state, busy, error, clearError, update } = useStore(),
    { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('home');
  const scroll = useRef<ScrollView>(null);
  const wide = width >= 980;
  if (!state)
    return (
      <SafeAreaView style={[local.loading]}>
        {busy ? <ActivityIndicator color={colors.accent} /> : null}
        <Text style={s.h2}>
          {busy ? 'Preparing your learning space…' : 'Could not open your learning space'}
        </Text>
        <Text style={s.muted}>{error ?? '正在準備你的學習空間…'}</Text>
        {!busy && (
          <Text style={s.muted}>
            Your saved data has not been reset. Reload to retry. / 已保留儲存資料，請重新開啟再試。
          </Text>
        )}
      </SafeAreaView>
    );
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh);
  const navigate = (next: Tab) => {
    setTab(next);
    clearError();
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const navigation = (vertical: boolean) => (
    <View style={vertical ? { gap: 7 } : { flexDirection: 'row', justifyContent: 'space-around' }}>
      {nav.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === item.id }}
          accessibilityLabel={l === 'en' ? item.en : item.zh}
          onPress={() => navigate(item.id)}
          style={({ pressed }) => ({
            flexDirection: vertical ? 'row' : 'column',
            alignItems: 'center',
            gap: vertical ? 13 : 4,
            paddingVertical: vertical ? 14 : 10,
            paddingHorizontal: vertical ? 16 : 4,
            borderRadius: 12,
            backgroundColor: vertical && tab === item.id ? colors.accentSoft : 'transparent',
            opacity: pressed ? 0.65 : 1,
            minWidth: vertical ? undefined : 55,
          })}
        >
          <Icon
            name={item.id}
            color={tab === item.id ? colors.accent : colors.muted}
            size={vertical ? 21 : 20}
          />
          <Text
            style={{
              color: tab === item.id ? colors.accent : colors.muted,
              fontSize: vertical ? 14 : 10,
              fontWeight: tab === item.id ? '700' : '500',
            }}
          >
            {l === 'en' ? item.en : item.zh}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'bottom']} style={local.root}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {wide && (
          <View style={local.sidebar}>
            <View style={[s.row, { paddingHorizontal: 12, marginBottom: 38 }]}>
              <View style={local.logo}>
                <Icon name="trade" color="white" size={24} />
              </View>
              <View>
                <Text style={local.brand}>TrySE</Text>
                <Text style={[s.muted, { fontSize: 10, letterSpacing: 1.3 }]}>STOCK LEARNING</Text>
              </View>
            </View>
            {navigation(true)}
            <View style={{ flex: 1 }} />
            <View style={{ padding: 16, backgroundColor: colors.soft, borderRadius: 16, gap: 8 }}>
              <Icon name="learn" color={colors.accent} />
              <Text style={s.h3}>{t('Progress over perfection.', '進步比完美更重要。')}</Text>
              <Text style={s.muted}>
                {t('A little learning makes a difference.', '一點一滴的學習，都有意義。')}
              </Text>
            </View>
            <Text style={[s.muted, { fontSize: 10, padding: 12 }]}>TRYSE · EARLY BUILD 0.1</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={[local.header, { paddingHorizontal: wide ? 36 : 18 }]}>
            <View style={s.row}>
              {!wide && (
                <>
                  <View style={[local.logo, { width: 32, height: 32 }]}>
                    <Icon name="trade" color="white" size={20} />
                  </View>
                  <Text style={[local.brand, { fontSize: 22 }]}>TrySE</Text>
                </>
              )}
              {wide && (
                <Text style={s.muted}>
                  {t('Your space to learn, practice, and grow.', '在這裡學習、練習與成長。')}
                </Text>
              )}
            </View>
            <View style={s.row}>
              {wide && <Badge tone="plain">{t('OFFLINE PRACTICE', '離線練習')}</Badge>}
              <Button
                title={l === 'en' ? '繁體中文' : 'English'}
                secondary
                small
                disabled={busy}
                onPress={() =>
                  void update((old) => ({ ...old, locale: old.locale === 'en' ? 'zh-TW' : 'en' }))
                }
              />
            </View>
          </View>
          <ScrollView
            ref={scroll}
            contentContainerStyle={{
              padding: wide ? 36 : 18,
              paddingBottom: 40,
              alignItems: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: '100%', maxWidth: 1120, gap: 20 }}>
              {error && (
                <View
                  accessibilityRole="alert"
                  style={{ padding: 18, backgroundColor: '#FFF0EB', borderRadius: 12, gap: 10 }}
                >
                  <Text style={{ color: colors.danger }}>{errorText(error, l)}</Text>
                  <Button title={t('Dismiss', '關閉')} secondary small onPress={clearError} />
                </View>
              )}
              {tab === 'home' ? (
                <Home navigate={navigate} />
              ) : tab === 'learn' ? (
                <Learn navigate={navigate} />
              ) : tab === 'trade' ? (
                <Trade />
              ) : tab === 'lab' ? (
                <Lab />
              ) : (
                <Library />
              )}
              <Text style={[s.muted, { fontSize: 11, marginTop: 10, textAlign: 'center' }]}>
                {t(
                  'Made for learning. All trades use practice funds.',
                  '為學習而設計。所有交易使用模擬資金。',
                )}
              </Text>
            </View>
          </ScrollView>
          {!wide && <View style={local.bottom}>{navigation(false)}</View>}
        </View>
      </View>
    </SafeAreaView>
  );
}
function LocalizedShell() {
  const { state } = useStore();
  return (
    <ThemeProvider locale={state?.locale ?? 'zh-TW'}>
      <Shell />
    </ThemeProvider>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <LocalizedShell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
const createLocalStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.cream },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
      gap: 20,
      backgroundColor: colors.cream,
    },
    sidebar: {
      width: 232,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderColor: colors.line,
      padding: 22,
      paddingTop: 34,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -1.1 },
    header: {
      minHeight: 80,
      borderBottomWidth: 1,
      borderColor: colors.line,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
    },
    bottom: {
      paddingTop: 4,
      borderTopWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.white,
      paddingBottom: Platform.OS === 'web' ? 8 : 0,
    },
  });
