import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, Card, colors, Icon, LineChart, money, styles as s } from '../components/ui';
import { useStore } from '../storage/state';
import { lessons, questions } from '../data/learning';
import { currentDate, instruments, pricesOn, visibleHistory } from '../data/market';
import { valuation } from '../domain/engine';
export type Tab = 'home' | 'learn' | 'trade' | 'lab' | 'library';
export function Home({ navigate }: { navigate: (tab: Tab) => void }) {
  const { state } = useStore();
  if (!state) return null;
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh);
  const portfolio = state.portfolios[state.market],
    date = currentDate(portfolio);
  const metrics = valuation(portfolio, pricesOn(state.market, date));
  const nextLesson =
    lessons.find((lesson) => !state.completedLessons.includes(lesson.id)) ?? lessons[0]!;
  const correct = questions.filter((q) => state.answers[q.id] === q.answer).length;
  return (
    <View style={s.column}>
      <View>
        <Text style={s.eyebrow}>{t('YOUR INVESTING JOURNEY', '你的投資學習之旅')}</Text>
        <Text style={[s.h1, { marginTop: 8 }]}>
          {t('Small steps. Smarter decisions.', '從小步開始，做更好的決定。')}
        </Text>
        <Text style={[s.muted, { marginTop: 8 }]}>
          {t(
            'Build your confidence, one lesson and one practice trade at a time.',
            '透過每一堂課、每一筆模擬交易，累積信心。',
          )}
        </Text>
      </View>
      <View
        style={[
          s.card,
          { backgroundColor: colors.ink, borderColor: colors.ink, padding: 28, overflow: 'hidden' },
        ]}
      >
        <View style={s.between}>
          <Badge>{t('LEARN BY DOING', '在實作中學習')}</Badge>
          <Icon name="trade" color={colors.lime} size={35} />
        </View>
        <Text
          style={{
            color: colors.white,
            fontSize: 30,
            lineHeight: 38,
            fontWeight: '600',
            maxWidth: 540,
          }}
        >
          {t(
            'Your first investment?\nA little understanding.',
            '你的第一筆投資？\n先投資一點理解。',
          )}
        </Text>
        <Text style={{ color: '#BDCFC6', fontSize: 14, lineHeight: 23, maxWidth: 500 }}>
          {t(
            'Explore the basics, try the markets, and learn from every outcome. All with practice money.',
            '探索基礎、體驗市場，從每個結果中學習。全程使用模擬資金。',
          )}
        </Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          <Button
            title={t('Continue learning  →', '繼續學習  →')}
            onPress={() => navigate('learn')}
          />
        </View>
      </View>
      <View style={s.wrap}>
        {[
          [
            t('LESSONS COMPLETED', '已完成課程'),
            `${state.completedLessons.length} / ${lessons.length}`,
            t('A little progress, every day', '每天累積一點進步'),
          ],
          [
            t('KNOWLEDGE CHECKS', '知識檢核'),
            `${correct} / ${questions.length}`,
            t('Concepts you have checked', '你已掌握的觀念'),
          ],
          [
            t('PRACTICE TRADES', '模擬交易'),
            String(
              Object.values(state.portfolios).reduce(
                (sum, p) =>
                  sum + p.entries.filter((e) => e.kind === 'buy' || e.kind === 'sell').length,
                0,
              ),
            ),
            t('Across your two wallets', '兩個帳戶的交易總數'),
          ],
        ].map(([label, value, detail]) => (
          <Card key={label} style={{ flex: 1, minWidth: 170 }}>
            <Text style={s.eyebrow}>{label}</Text>
            <Text style={s.metric}>{value}</Text>
            <Text style={s.muted}>{detail}</Text>
          </Card>
        ))}
      </View>
      <View style={s.wrap}>
        <Card style={{ flex: 1.2, minWidth: 270 }}>
          <View style={s.between}>
            <Text style={s.h2}>{t('Your next chapter', '下一段學習')}</Text>
            <Icon name="learn" color={colors.green} />
          </View>
          <Text style={s.eyebrow}>
            {t('FOUNDATIONS', '基礎課程')} · {nextLesson.minutes} {t('MIN', '分鐘')}
          </Text>
          <Text style={s.h2}>{nextLesson.title[l]}</Text>
          <Text style={s.muted}>{nextLesson.description[l]}</Text>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: '#ECF0E8' }}>
            <View
              style={{
                height: 5,
                width: `${(state.completedLessons.length / lessons.length) * 100}%`,
                backgroundColor: colors.green,
                borderRadius: 3,
              }}
            />
          </View>
          <Button
            title={t('Open learning path', '開啟學習路線')}
            secondary
            onPress={() => navigate('learn')}
          />
        </Card>
        <Card style={{ flex: 1, minWidth: 270 }}>
          <Text style={s.h2}>{t('Practice portfolio', '模擬投資組合')}</Text>
          <View style={s.between}>
            <Text style={s.muted}>
              {state.market === 'TW' ? t('Taiwan wallet', '台股帳戶') : t('US wallet', '美股帳戶')}
            </Text>
            <Badge tone="plain">
              {t('Session', '交易日')} {portfolio.day + 1}/{portfolio.length}
            </Badge>
          </View>
          <Text style={s.metric}>{money(metrics.equity, portfolio.currency, l, false)}</Text>
          <Text style={s.muted}>
            {t('Practice funds. No real money at risk.', '模擬資金，不涉及真實金錢。')}
          </Text>
          <Button
            title={t('Explore the simulator  →', '探索交易模擬  →')}
            secondary
            onPress={() => navigate('trade')}
          />
        </Card>
      </View>
      <View style={s.between}>
        <Text style={s.h2}>{t('A window into the market', '看看市場練習場')}</Text>
        <Badge tone="amber">{t('SYNTHETIC PRICES', '合成價格')}</Badge>
      </View>
      <View style={s.wrap}>
        {instruments
          .filter((i) => i.market === state.market)
          .slice(0, 3)
          .map((stock) => {
            const history = visibleHistory(stock.id, date, 30),
              last = history[history.length - 1]!;
            return (
              <Card key={stock.id} style={{ flex: 1, minWidth: 190 }}>
                <View style={s.between}>
                  <Text style={s.h3}>{stock.symbol}</Text>
                  <Text style={s.muted}>{stock.currency}</Text>
                </View>
                <Text style={s.muted}>{stock.name[l]}</Text>
                <Text style={[s.h2, { fontVariant: ['tabular-nums'] }]}>
                  {money(last.close, stock.currency, l)}
                </Text>
                <LineChart values={history.map((r) => r.close)} height={65} />
                <Button
                  title={t('Practice trading', '練習交易')}
                  small
                  secondary
                  onPress={() => navigate('trade')}
                />
              </Card>
            );
          })}
      </View>
      <Card style={{ backgroundColor: '#EEF2E6' }}>
        <View style={s.row}>
          <Icon name="lab" color={colors.green} />
          <Text style={s.h3}>{t('Curiosity belongs here.', '讓好奇心帶你前進。')}</Text>
        </View>
        <Text style={s.muted}>
          {t(
            'Can your prediction beat a simple model? Lock your guess, then reveal the outcome in the forecast lab.',
            '你的預測能勝過簡單模型嗎？先鎖定猜測，再到預測實驗室揭曉結果。',
          )}
        </Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button
            title={t('Visit forecast lab  →', '前往預測實驗室  →')}
            secondary
            onPress={() => navigate('lab')}
          />
        </View>
      </Card>
    </View>
  );
}
