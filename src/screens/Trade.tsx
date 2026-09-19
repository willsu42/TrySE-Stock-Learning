import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Field, LineChart, money, useTheme } from '../components/ui';
import {
  candle,
  currentDate,
  dataset,
  instrumentById,
  instruments,
  pricesOn,
  replayDates,
  visibleHistory,
} from '../data/market';
import { advanceSession, executeOrder, newPortfolio, valuation } from '../domain/engine';
import { Market } from '../domain/types';
import { uniqueId, useStore } from '../storage/state';
export function Trade() {
  const { colors, styles: s } = useTheme();
  const { state, busy, update } = useStore();
  const [selected, setSelected] = useState('TW:2330'),
    [search, setSearch] = useState(''),
    [quantity, setQuantity] = useState('1'),
    [side, setSide] = useState<'buy' | 'sell'>('buy'),
    [receipt, setReceipt] = useState(false),
    [reset, setReset] = useState(false);
  const submitting = useRef(false);
  if (!state) return null;
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh),
    portfolio = state.portfolios[state.market],
    date = currentDate(portfolio);
  const stock =
    instrumentById[selected]?.market === state.market
      ? instrumentById[selected]!
      : instruments.find((i) => i.market === state.market)!;
  const row = candle(stock.id, date)!,
    history = visibleHistory(stock.id, date),
    metrics = valuation(portfolio, pricesOn(state.market, date));
  const position = portfolio.positions[stock.id] ?? { shares: 0, cost: 0 };
  const profitColor = (value: number) =>
    value > 0 ? colors.positive : value < 0 ? colors.negative : colors.muted;
  const profitMoney = (value: number) =>
    `${value > 0 ? '+' : ''}${money(value, portfolio.currency, l)}`;
  const number = /^\d+$/.test(quantity) ? Number(quantity) : NaN;
  const valid =
    Number.isSafeInteger(number) && number > 0 && Number.isSafeInteger(number * row.close);
  const changeMarket = (market: Market) => {
    setReceipt(false);
    setSearch('');
    void update((old) => ({ ...old, market }));
  };
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    const orderId = uniqueId();
    const success = await update((old) => ({
      ...old,
      portfolios: {
        ...old.portfolios,
        [old.market]: executeOrder(
          old.portfolios[old.market],
          { id: orderId, instrumentId: stock.id, side, quantity: number },
          { instrument: stock, date, price: row.close, datasetId: dataset.id },
          currentDate(old.portfolios[old.market]),
        ),
      },
    }));
    setReceipt(success);
    submitting.current = false;
  };
  return (
    <View style={s.column}>
      <View>
        <Text style={s.eyebrow}>{t('A PLACE TO PRACTICE', '安心練習的地方')}</Text>
        <Text style={[s.h1, { marginTop: 8 }]}>
          {t('Learn the market by doing.', '在交易練習中認識市場。')}
        </Text>
        <Text style={[s.muted, { marginTop: 8 }]}>
          {t(
            'Whole shares. Practice money. Every trade has a lesson.',
            '整股交易、模擬資金，每一筆交易都是練習。',
          )}
        </Text>
      </View>
      <View style={s.wrap}>
        <Button
          title={t('Taiwan · TWD', '台股 · TWD')}
          secondary={state.market !== 'TW'}
          disabled={busy}
          onPress={() => changeMarket('TW')}
        />
        <Button
          title={t('United States · USD', '美股 · USD')}
          secondary={state.market !== 'US'}
          disabled={busy}
          onPress={() => changeMarket('US')}
        />
      </View>
      <Card style={{ backgroundColor: '#FFF8E9' }}>
        <Badge tone="amber">
          {t('SYNTHETIC DEMO · NOT MARKET PRICES', '合成示範 · 非真實股價')}
        </Badge>
        <Text style={s.muted}>
          {t(
            'Fictional prices and weekday sessions. Immediate fills at the shown close; no fees or taxes. This is not a real market calendar.',
            '虛構價格與平日交易日。以畫面收盤價立即成交，不收費或稅。這不是真實交易日曆。',
          )}
        </Text>
      </Card>
      <View style={s.wrap}>
        {[
          [t('Cash available', '可用現金'), portfolio.cash],
          [t('Holdings value', '持股市值'), metrics.marketValue],
          [t('Total equity', '帳戶總值'), metrics.equity],
        ].map(([label, value]) => (
          <Card key={label} style={{ flex: 1, minWidth: 190 }}>
            <Text style={s.muted}>{label}</Text>
            <Text style={s.h2}>{money(Number(value), portfolio.currency, l)}</Text>
          </Card>
        ))}
      </View>
      <Card>
        <View style={[s.between, { flexWrap: 'wrap' }]}>
          <View style={{ gap: 4 }}>
            <Text style={s.h3}>
              {date} · {t('Session', '交易日')} {portfolio.day + 1}/{portfolio.length}
            </Text>
            <Text style={s.muted}>
              {t('Your chart only shows what is known so far.', '圖表只顯示目前已知的價格。')}
            </Text>
          </View>
          <Button
            title={
              portfolio.day === portfolio.length - 1
                ? t('Scenario complete', '情境已完成')
                : t('Next session →', '下一交易日 →')
            }
            disabled={busy || portfolio.day >= portfolio.length - 1}
            onPress={() => {
              setReceipt(false);
              void update((old) => {
                const p = old.portfolios[old.market],
                  nextDate = replayDates[old.market][p.day + 1]!;
                return {
                  ...old,
                  portfolios: {
                    ...old.portfolios,
                    [old.market]: advanceSession(
                      p,
                      replayDates[old.market],
                      pricesOn(old.market, nextDate),
                    ),
                  },
                };
              });
            }}
          />
        </View>
      </Card>
      <View style={s.wrap}>
        <Card style={{ flex: 1, minWidth: 260 }}>
          <Text style={s.h2}>{t('Explore stocks', '探索股票')}</Text>
          <Field
            label={t('Search name or ticker', '搜尋名稱或代碼')}
            value={search}
            onChange={setSearch}
          />
          {instruments
            .filter(
              (i) =>
                i.market === state.market &&
                `${i.symbol} ${i.name.en} ${i.name['zh-TW']}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .map((i) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${i.symbol} ${i.name[l]}`}
                key={i.id}
                onPress={() => {
                  setSelected(i.id);
                  setReceipt(false);
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: stock.id === i.id ? colors.accentSoft : 'transparent',
                  gap: 3,
                }}
              >
                <View style={s.between}>
                  <Text style={s.h3}>{i.symbol}</Text>
                  <Text style={[s.text, { fontVariant: ['tabular-nums'] }]}>
                    {money(candle(i.id, date)!.close, i.currency, l)}
                  </Text>
                </View>
                <Text style={s.muted}>{i.name[l]}</Text>
              </Pressable>
            ))}
        </Card>
        <View style={{ flex: 1.6, minWidth: 280, gap: 20 }}>
          <Card>
            <View style={s.between}>
              <View>
                <Text style={s.eyebrow}>
                  {stock.symbol} · {stock.currency}
                </Text>
                <Text style={[s.h2, { marginTop: 6 }]}>{stock.name[l]}</Text>
              </View>
              <Badge tone="plain">{stock.sector[l]}</Badge>
            </View>
            <Text style={s.metric}>{money(row.close, stock.currency, l)}</Text>
            <LineChart values={history.map((r) => r.close)} height={175} />
            <View style={s.between}>
              <Text style={s.muted}>{history[0]?.date}</Text>
              <Text style={s.muted}>{date}</Text>
            </View>
            <Text style={s.muted}>
              {t('Shares held', '持有股數')}: {position.shares} · {t('Book cost', '帳面成本')}:{' '}
              {money(position.cost, stock.currency, l)}
            </Text>
          </Card>
          <Card>
            <Text style={s.h2}>{t('Place a practice order', '下一筆模擬訂單')}</Text>
            <View style={s.wrap}>
              <Button
                title={t('Buy', '買進')}
                secondary={side !== 'buy'}
                onPress={() => {
                  setSide('buy');
                  setReceipt(false);
                }}
              />
              <Button
                title={t('Sell', '賣出')}
                secondary={side !== 'sell'}
                onPress={() => {
                  setSide('sell');
                  setReceipt(false);
                }}
              />
            </View>
            <Field
              label={t('Number of shares', '股數')}
              numeric
              value={quantity}
              onChange={(value) => {
                setQuantity(value);
                setReceipt(false);
              }}
            />
            <View style={s.between}>
              <Text style={s.muted}>{t('Order value', '交易金額')}</Text>
              <Text style={s.h3}>{valid ? money(number * row.close, stock.currency, l) : '—'}</Text>
            </View>
            <Button
              title={side === 'buy' ? t('Confirm buy', '確認買進') : t('Confirm sell', '確認賣出')}
              disabled={busy || !valid}
              onPress={() => void submit()}
            />
            {receipt && (
              <Text accessibilityRole="alert" style={{ color: colors.accent, fontWeight: '600' }}>
                {t('Order filled and saved to your ledger.', '已成交並儲存至交易紀錄。')}
              </Text>
            )}
          </Card>
        </View>
      </View>
      <Card>
        <Text style={s.h2}>{t('Your holdings', '你的持股')}</Text>
        <Text style={s.muted}>
          {t(
            'Profit/loss colors: green for gains, red for losses, gray for zero.',
            '損益顏色：紅色為獲利、綠色為虧損、灰色為零。',
          )}
        </Text>
        {Object.entries(portfolio.positions).filter(([, p]) => p.shares > 0).length === 0 ? (
          <Text style={s.muted}>
            {t(
              'Your wallet starts with cash. Buy a practice share to see a position here.',
              '帳戶從現金開始。買進模擬股票後，即可在此查看持股。',
            )}
          </Text>
        ) : (
          Object.entries(portfolio.positions)
            .filter(([, p]) => p.shares > 0)
            .map(([id, p]) => (
              <View
                key={id}
                style={[
                  s.between,
                  {
                    flexWrap: 'wrap',
                    borderBottomWidth: 1,
                    borderColor: colors.line,
                    paddingVertical: 10,
                  },
                ]}
              >
                <View>
                  <Text style={s.h3}>{instrumentById[id]!.name[l]}</Text>
                  <Text style={s.muted}>
                    {p.shares} {t('shares', '股')}
                  </Text>
                </View>
                <View>
                  <Text style={s.text}>
                    {money(p.shares * candle(id, date)!.close, portfolio.currency, l)}
                  </Text>
                  <Text
                    style={[
                      s.muted,
                      { color: profitColor(p.shares * candle(id, date)!.close - p.cost) },
                    ]}
                  >
                    {t('Unrealized', '未實現')}:{' '}
                    {profitMoney(p.shares * candle(id, date)!.close - p.cost)}
                  </Text>
                </View>
              </View>
            ))
        )}
        <View style={[s.wrap, { marginTop: 4 }]}>
          <Text style={[s.muted, { color: profitColor(metrics.realized) }]}>
            {t('Realized', '已實現')}: {profitMoney(metrics.realized)}
          </Text>
          <Text style={[s.muted, { color: profitColor(metrics.unrealized) }]}>
            {t('Unrealized', '未實現')}: {profitMoney(metrics.unrealized)}
          </Text>
        </View>
      </Card>
      <Card>
        <Text style={s.h2}>{t('Transaction history', '交易紀錄')}</Text>
        {portfolio.entries.length === 0 ? (
          <Text style={s.muted}>
            {t('Your first trade will appear here.', '第一筆交易將顯示在這裡。')}
          </Text>
        ) : (
          [...portfolio.entries]
            .reverse()
            .slice(0, 20)
            .map((entry) => (
              <View key={entry.id} style={[s.between, { flexWrap: 'wrap', paddingVertical: 8 }]}>
                <View>
                  <Text style={s.h3}>
                    {entry.kind === 'buy' ? t('Buy', '買進') : t('Sell', '賣出')} {entry.quantity} ·{' '}
                    {instrumentById[entry.instrumentId]!.symbol}
                  </Text>
                  <Text style={s.muted}>{entry.date}</Text>
                </View>
                <Text style={s.text}>{money(entry.cashDelta, portfolio.currency, l)}</Text>
              </View>
            ))
        )}
      </Card>
      <Card>
        <Text style={s.h3}>{t('Start a fresh scenario', '重新開始情境')}</Text>
        <Text style={s.muted}>
          {t(
            'Reset only this market’s practice wallet. Your lessons and other wallet stay saved.',
            '僅重設此市場的模擬帳戶。課程與另一個帳戶的進度會保留。',
          )}
        </Text>
        {!reset ? (
          <Button
            title={t('Restart options', '重新開始選項')}
            secondary
            onPress={() => setReset(true)}
          />
        ) : (
          <View style={s.wrap}>
            {([20, 60] as const).map((length) => (
              <Button
                key={length}
                title={`${t('Reset to', '重設為')} ${length} ${t('sessions', '個交易日')}`}
                disabled={busy}
                onPress={() => {
                  void update((old) => ({
                    ...old,
                    portfolios: {
                      ...old.portfolios,
                      [old.market]: newPortfolio(old.market, dataset.id, uniqueId(), length),
                    },
                  }));
                  setReset(false);
                  setReceipt(false);
                }}
              />
            ))}
            <Button title={t('Cancel', '取消')} secondary onPress={() => setReset(false)} />
          </View>
        )}
      </Card>
    </View>
  );
}
