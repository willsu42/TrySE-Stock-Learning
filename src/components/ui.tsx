import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { Currency, Locale } from '../domain/types';
export const colors = {
  ink: '#172D2A',
  muted: '#65756F',
  green: '#186B52',
  mint: '#DDF3E8',
  lime: '#DBF483',
  cream: '#F6F7F2',
  line: '#E1E7DF',
  white: '#FFFFFF',
  red: '#AD4141',
  amber: '#8A5B1A',
};
export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 22,
    gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  column: { gap: 20 },
  eyebrow: {
    color: colors.green,
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
    borderColor: '#C7D5CD',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#FAFCF9',
    minHeight: 48,
  },
});
export function Label({ children, style }: React.PropsWithChildren<{ style?: TextStyle }>) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Badge({
  children,
  tone = 'green',
}: React.PropsWithChildren<{ tone?: 'green' | 'amber' | 'plain' }>) {
  return (
    <View
      style={{
        backgroundColor: tone === 'amber' ? '#FFF2D7' : tone === 'plain' ? '#EEF1EB' : colors.mint,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 7,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: tone === 'amber' ? colors.amber : colors.green,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary = false,
  small = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  small?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? '#EFF3EB' : colors.green,
        borderRadius: 11,
        paddingHorizontal: small ? 13 : 19,
        paddingVertical: small ? 10 : 14,
        minHeight: 44,
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? colors.ink : colors.white,
          fontSize: small ? 12 : 14,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  numeric = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        placeholder={placeholder}
        placeholderTextColor="#8A9891"
        style={styles.input}
      />
    </View>
  );
}
export function money(value: number, currency: Currency, locale: Locale, decimals = true): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: decimals ? 2 : 0,
  }).format(value / 100);
}
export function LineChart({
  values,
  height = 140,
  color = colors.green,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  if (!values.length) return null;
  const min = Math.min(...values),
    max = Math.max(...values),
    span = Math.max(max - min, 1);
  const points = values
    .map(
      (value, index) =>
        `${10 + (index * 580) / Math.max(values.length - 1, 1)},${height - 15 - ((value - min) / span) * (height - 30)}`,
    )
    .join(' ');
  const last = values[values.length - 1]!;
  return (
    <View
      accessibilityLabel={`Price chart, ${values.length} observations`}
      accessibilityRole="image"
    >
      <Svg width="100%" height={height} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none">
        {[0.2, 0.5, 0.8].map((y) => (
          <Line
            key={y}
            x1="0"
            y1={height * y}
            x2="600"
            y2={height * y}
            stroke={colors.line}
            strokeDasharray="4 6"
          />
        ))}
        <Path
          d={`M 10 ${height} L ${points.replace(/ /g, ' L ')} L 590 ${height} Z`}
          fill={color}
          opacity={0.055}
        />
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <Circle
          cx="590"
          cy={height - 15 - ((last - min) / span) * (height - 30)}
          r="4"
          fill={color}
        />
      </Svg>
    </View>
  );
}
export function Icon({
  name,
  size = 21,
  color = colors.muted,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const paths: Record<string, string> = {
    home: 'M3 10L12 3l9 7v11h-6v-7H9v7H3Z',
    learn: 'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16',
    trade: 'M3 20h18M5 15l5-5 4 3 7-9M16 4h5v5',
    lab: 'M9 3h6M10 3v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M8 14h8',
    library: 'M4 4h5v17H4ZM10 4h5v17h-5ZM17 4l4 1-3 16-4-1Z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    check: 'M4 12l5 5L20 6',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={paths[name] ?? paths.home}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export const errorText = (code: string, locale: Locale): string => {
  const errors: Record<string, [string, string]> = {
    INVALID_QUANTITY: ['Enter a positive whole number of shares.', '請輸入正整數股數。'],
    INSUFFICIENT_CASH: ['Not enough practice cash for this order.', '模擬現金不足，無法成交。'],
    INSUFFICIENT_SHARES: ['You cannot sell more shares than you own.', '賣出股數不能超過持股。'],
    INVALID_PRICE: [
      'Enter a positive price with up to two decimals.',
      '請輸入大於零、最多兩位小數的價格。',
    ],
    DUPLICATE_ORDER: ['This order has already been submitted.', '這筆訂單已送出。'],
    WRONG_MARKET: ['This instrument belongs to a different wallet.', '此股票屬於另一個帳戶。'],
    SCENARIO_ENDED: ['You have reached the end of this scenario.', '已到達情境終點。'],
    MISSING_PRICE: [
      'A required price is missing. The session was not advanced.',
      '缺少必要價格，未推進交易日。',
    ],
    STALE_QUOTE: ['The price does not match this replay session.', '報價與目前回放不符。'],
  };
  return (
    errors[code]?.[locale === 'en' ? 0 : 1] ??
    (locale === 'en' ? `Could not save this change. ${code}` : `無法儲存這次變更。${code}`)
  );
};
