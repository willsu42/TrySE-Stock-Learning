import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  colors,
  Field,
  LineChart,
  money,
  styles as s,
} from '../components/ui';
import { useStore, uniqueId } from '../storage/state';
import { candle, instruments, visibleHistory } from '../data/market';
import forecasts from '../data/forecasts.json';
import { evaluateForecast, lockForecast } from '../domain/forecast';
import { parseMoney } from '../domain/engine';
export function Lab() {
  const { state, update, busy } = useStore();
  const [stockIndex, setStockIndex] = useState(0),
    [horizon, setHorizon] = useState<1 | 5>(1),
    [round, setRound] = useState(0),
    [prediction, setPrediction] = useState('');
  if (!state) return null;
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh);
  const candidates = instruments.filter((i) => i.market === state.market),
    stock = candidates[stockIndex % candidates.length]!;
  const records = forecasts.filter((f) => f.instrumentId === stock.id && f.horizon === horizon),
    record = records[round % records.length]!;
  if (!record)
    return (
      <Card>
        <Text style={s.text}>
          {t('No forecast available for this selection.', '此選項尚無預測資料。')}
        </Text>
      </Card>
    );
  const attempt = state.forecasts.find(
    (a) =>
      a.instrumentId === record.instrumentId &&
      a.cutoff === record.cutoff &&
      a.horizon === horizon &&
      a.datasetId === record.datasetId,
  );
  const actual = attempt?.revealed ? candle(stock.id, attempt.target)?.close : undefined;
  const errors = attempt && actual !== undefined ? evaluateForecast(attempt, actual) : null;
  const history = visibleHistory(stock.id, record.cutoff, 40);
  const value = parseMoney(prediction);
  return (
    <View style={s.column}>
      <View>
        <Text style={s.eyebrow}>{t('THE FORECAST LAB', '預測實驗室')}</Text>
        <Text style={[s.h1, { marginTop: 8 }]}>
          {t('A little curiosity. A fair test.', '保持好奇，公平測試。')}
        </Text>
        <Text style={[s.muted, { marginTop: 8 }]}>
          {t(
            'Make a guess before the future is revealed. See how you compare.',
            '在揭曉未來之前做出猜測，再比較結果。',
          )}
        </Text>
      </View>
      <View style={s.wrap}>
        {(['TW', 'US'] as const).map((market) => (
          <Button
            key={market}
            title={
              market === 'TW'
                ? t('Taiwan · TWD', '台股 · TWD')
                : t('United States · USD', '美股 · USD')
            }
            secondary={state.market !== market}
            disabled={busy}
            onPress={() => {
              setPrediction('');
              void update((old) => ({ ...old, market }));
            }}
          />
        ))}
      </View>
      <Card style={{ backgroundColor: '#FFF8E9' }}>
        <Badge tone="amber">{t('EXPERIMENT · SYNTHETIC DATA', '實驗 · 合成資料')}</Badge>
        <Text style={s.muted}>
          {t(
            'This lab tests an idea using fictional prices. Scores are not evidence of real-world forecasting skill. Its replay period is separate from your trading scenario.',
            '本實驗使用虛構價格測試想法。分數不能證明真實市場預測能力。其回放期間與交易模擬分開。',
          )}
        </Text>
      </Card>
      <Card>
        <View style={[s.between, { flexWrap: 'wrap' }]}>
          <View>
            <Text style={s.eyebrow}>
              {stock.symbol} · {stock.currency}
            </Text>
            <Text style={s.h2}>{stock.name[l]}</Text>
          </View>
          <View style={s.wrap}>
            <Button
              title={t('Change stock', '切換股票')}
              secondary
              small
              onPress={() => {
                setStockIndex(stockIndex + 1);
                setPrediction('');
              }}
            />
            <Button
              title={t('Next challenge', '下一挑戰')}
              secondary
              small
              onPress={() => {
                setRound(round + 1);
                setPrediction('');
              }}
            />
          </View>
        </View>
        <View style={s.wrap}>
          {([1, 5] as const).map((h) => (
            <Button
              key={h}
              title={`${h} ${t(h === 1 ? 'session ahead' : 'sessions ahead', '個交易日後')}`}
              secondary={horizon !== h}
              onPress={() => {
                setHorizon(h);
                setPrediction('');
              }}
            />
          ))}
        </View>
        <Text style={s.muted}>
          {t('Information cutoff', '資料截止日')}: {record.cutoff}
        </Text>
        <Text style={s.metric}>{money(record.baseline, stock.currency, l)}</Text>
        <LineChart values={history.map((r) => r.close)} height={180} />
        <View style={s.between}>
          <Text style={s.muted}>{history[0]?.date}</Text>
          <Text style={s.muted}>{record.cutoff}</Text>
        </View>
      </Card>
      {!attempt ? (
        <Card>
          <Text style={s.h2}>{t('Where do you think it goes?', '你認為價格會到哪裡？')}</Text>
          <Text style={s.muted}>
            {t('Predict the closing price on', '預測此日期的收盤價')}: {record.target}
          </Text>
          <Field
            label={`${t('Your prediction', '你的預測')} (${stock.currency})`}
            value={prediction}
            onChange={setPrediction}
            numeric
            placeholder={(record.baseline / 100).toFixed(2)}
          />
          <Button
            title={t('Lock my prediction', '鎖定我的預測')}
            disabled={busy || value === null}
            onPress={() =>
              void update((old) => {
                if (
                  old.forecasts.some(
                    (a) =>
                      a.instrumentId === record.instrumentId &&
                      a.cutoff === record.cutoff &&
                      a.horizon === record.horizon &&
                      a.datasetId === record.datasetId,
                  )
                )
                  return old;
                return {
                  ...old,
                  forecasts: [...old.forecasts, lockForecast(record, value!, uniqueId())],
                };
              })
            }
          />
          <Text style={s.muted}>
            {t(
              'Your guess is saved before any result is shown.',
              '任何結果揭曉前，先儲存你的猜測。',
            )}
          </Text>
        </Card>
      ) : (
        <Card>
          <Badge>
            {attempt.revealed
              ? t('RESULT REVEALED', '結果已揭曉')
              : t('PREDICTION LOCKED', '預測已鎖定')}
          </Badge>
          <Text style={s.h2}>
            {t('Your prediction', '你的預測')}: {money(attempt.prediction, stock.currency, l)}
          </Text>
          {!attempt.revealed ? (
            <Button
              title={t('Reveal the outcome', '揭曉結果')}
              disabled={busy}
              onPress={() =>
                void update((old) => ({
                  ...old,
                  forecasts: old.forecasts.map((a) =>
                    a.id === attempt.id ? { ...a, revealed: true } : a,
                  ),
                }))
              }
            />
          ) : (
            <>
              <Text style={s.metric}>
                {t('Actual', '實際')}: {money(actual!, stock.currency, l)}
              </Text>
              <Text style={s.muted}>{attempt.target}</Text>
              {[
                [t('Your guess', '你的猜測'), attempt.prediction, errors!.learner],
                [t('No-change baseline', '價格不變基準'), attempt.baseline, errors!.baseline],
                [t('Ridge regression model', '嶺迴歸模型'), attempt.model, errors!.model],
              ].map(([name, price, error]) => (
                <View
                  key={name}
                  style={[
                    s.between,
                    {
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderColor: colors.line,
                      flexWrap: 'wrap',
                    },
                  ]}
                >
                  <View>
                    <Text style={s.h3}>{name}</Text>
                    <Text style={s.muted}>{money(Number(price), stock.currency, l)}</Text>
                  </View>
                  <Text style={s.text}>
                    {t('Error', '誤差')}: {money(Number(error), stock.currency, l)}
                  </Text>
                </View>
              ))}
              <Text style={s.muted}>
                {t(
                  'Smaller absolute error is better. One challenge is not enough to judge a forecasting method.',
                  '絕對誤差越小越好。單次挑戰不足以判斷預測方法。',
                )}
              </Text>
            </>
          )}
        </Card>
      )}
      <Card>
        <Text style={s.h2}>{t('What is the model learning?', '模型學到了什麼？')}</Text>
        <Text style={s.text}>
          {t(
            'A small ridge-regression model relates five prior daily returns to the return over the next one or five sessions. Each model is fitted only on earlier observations and labels known at the cutoff.',
            '小型嶺迴歸模型使用前五日報酬，預測接下來一或五日的報酬。每次訓練僅使用截止日前已知的觀測與結果。',
          )}
        </Text>
        <Text style={s.muted}>
          {t('Model', '模型')}: {record.modelVersion} · {t('Dataset', '資料集')}: {record.datasetId}
        </Text>
        <Text style={s.muted}>
          {t(
            'The no-change baseline is a useful competitor. A more complicated model can still perform worse.',
            '價格不變基準是實用的比較對象。更複雜的模型也可能表現更差。',
          )}
        </Text>
      </Card>
    </View>
  );
}
