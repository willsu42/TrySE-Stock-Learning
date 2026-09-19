import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Icon, useTheme } from '../components/ui';
import { lessons, questions, resources } from '../data/learning';
import { uniqueId, useStore } from '../storage/state';
import { recordAnswer } from '../domain/learning';
import { Tab } from './Home';
export function Learn({ navigate }: { navigate: (tab: Tab) => void }) {
  const { colors, styles: s } = useTheme();
  const { state, update, busy } = useStore();
  const [selected, setSelected] = useState<string | null>(null),
    [hint, setHint] = useState(false),
    [review, setReview] = useState(false);
  const [linkError, setLinkError] = useState(false);
  if (!state) return null;
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh);
  const lesson = lessons.find((item) => item.id === selected);
  const question = questions.find((item) => item.lessonId === selected);
  const answer = question ? state.answers[question.id] : undefined;
  const attempts = (state.quizAttempts ?? []).filter(
    (attempt) => attempt.questionId === question?.id,
  );
  const wrong = questions.filter(
    (q) => state.answers[q.id] !== undefined && state.answers[q.id] !== q.answer,
  );
  if (lesson && question)
    return (
      <View style={s.column}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button
            title={t('← All lessons', '← 所有課程')}
            secondary
            onPress={() => setSelected(null)}
          />
        </View>
        <Badge>
          {t('FOUNDATIONS', '基礎課程')} · {lesson.minutes} {t('MIN', '分鐘')}
        </Badge>
        <Text style={s.h1}>{lesson.title[l]}</Text>
        <Text style={s.muted}>{lesson.description[l]}</Text>
        <Card>
          <Text style={s.h2}>{t('The idea', '核心概念')}</Text>
          <Text style={[s.text, { fontSize: 16, lineHeight: 28 }]}>{lesson.body[l]}</Text>
        </Card>
        <Card style={{ backgroundColor: colors.soft }}>
          <Text style={s.eyebrow}>{t('MAKE IT CONCRETE', '用例子理解')}</Text>
          <Text style={[s.text, { fontSize: 16, lineHeight: 28 }]}>{lesson.example[l]}</Text>
          <Button
            title={hint ? t('Hide hint', '隱藏提示') : t('Give me a hint', '給我一點提示')}
            secondary
            onPress={() => setHint(!hint)}
          />
          {hint && <Text style={s.text}>{lesson.hint[l]}</Text>}
        </Card>
        <Card>
          <Text style={s.eyebrow}>{t('CHECK YOUR UNDERSTANDING', '檢查你的理解')}</Text>
          <Text style={s.h2}>{question.prompt[l]}</Text>
          {question.options.map((option, index) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: answer === index, disabled: busy }}
              disabled={busy}
              key={index}
              onPress={() =>
                void update((old) =>
                  recordAnswer(old, question, index, uniqueId(), new Date().toISOString()),
                )
              }
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: answer === index ? colors.accent : colors.line,
                borderRadius: 12,
                backgroundColor: answer === index ? colors.accentSoft : colors.white,
              }}
            >
              <Text style={s.text}>
                {String.fromCharCode(65 + index)}. {option[l]}
              </Text>
            </Pressable>
          ))}
          {answer !== undefined && (
            <View
              style={{
                gap: 8,
                padding: 16,
                backgroundColor: answer === question.answer ? colors.accentSoft : '#FFF5E4',
                borderRadius: 12,
              }}
            >
              <Text style={s.h3}>
                {answer === question.answer
                  ? t('That’s right.', '答對了。')
                  : t('Let’s work through it.', '一起想一想。')}
              </Text>
              <Text style={s.text}>{question.explanation[l]}</Text>
            </View>
          )}
          <Button
            title={
              state.completedLessons.includes(lesson.id)
                ? t('Lesson completed ✓', '已完成課程 ✓')
                : t('Complete this lesson', '完成這堂課')
            }
            disabled={
              busy || answer !== question.answer || state.completedLessons.includes(lesson.id)
            }
            onPress={() =>
              void update((old) => ({
                ...old,
                completedLessons: [...new Set([...old.completedLessons, lesson.id])],
              }))
            }
          />
        </Card>
        {attempts.length > 0 && (
          <Card>
            <Text style={s.h2}>{t('Your learning attempts', '你的作答紀錄')}</Text>
            <Text style={s.muted}>
              {t(
                'Each answer is saved. A correction is another step forward.',
                '每次作答都會保留，修正答案也是進步。',
              )}
            </Text>
            {[...attempts]
              .reverse()
              .slice(0, 5)
              .map((attempt) => (
                <View key={attempt.id} style={[s.between, { flexWrap: 'wrap' }]}>
                  <View style={{ flex: 1, minWidth: 160 }}>
                    <Text style={s.text}>{question.options[attempt.answerIndex]?.[l]}</Text>
                    <Text style={s.muted}>{new Date(attempt.createdAt).toLocaleString(l)}</Text>
                  </View>
                  <Badge tone={attempt.correct ? 'accent' : 'amber'}>
                    {attempt.correct ? t('Correct', '答對') : t('Needs review', '待複習')}
                  </Badge>
                </View>
              ))}
            {attempts.length > 5 && (
              <Text style={s.muted}>
                {t('Showing your latest 5 attempts.', '顯示最近 5 次作答。')}
              </Text>
            )}
          </Card>
        )}
        <Card>
          <Text style={s.h2}>{t('Try it for yourself', '自己試試看')}</Text>
          <Text style={s.text}>{lesson.practice[l]}</Text>
          <View style={s.wrap}>
            <Button
              title={
                lesson.id === 'forecast'
                  ? t('Open forecast lab', '開啟預測實驗室')
                  : t('Open simulator', '開啟交易模擬')
              }
              onPress={() => navigate(lesson.id === 'forecast' ? 'lab' : 'trade')}
            />
          </View>
        </Card>
        <Card>
          <Text style={s.h2}>{t('Keep learning outside the app', '在應用程式外繼續學習')}</Text>
          {resources
            .filter((r) => lesson.resources.includes(r.id))
            .map((resource) => (
              <View key={resource.id} style={{ gap: 8 }}>
                <Text style={s.muted}>
                  {resource.publisher} · {resource.language === 'en' ? 'English' : '繁體中文'}
                </Text>
                <Button
                  title={`${resource.title[l]} ↗`}
                  secondary
                  onPress={() => {
                    setLinkError(false);
                    void Linking.openURL(resource.url).catch(() => setLinkError(true));
                  }}
                />
              </View>
            ))}
          {linkError && (
            <Text style={s.muted}>
              {t('Could not open the link. Check your connection.', '無法開啟連結，請檢查網路。')}
            </Text>
          )}
          <Button
            title={t('Browse the full library', '瀏覽所有學習資源')}
            secondary
            onPress={() => navigate('library')}
          />
        </Card>
      </View>
    );
  const shown = review
    ? lessons.filter((item) => wrong.some((q) => q.lessonId === item.id))
    : lessons;
  return (
    <View style={s.column}>
      <View>
        <Text style={s.eyebrow}>{t('LEARN AT YOUR OWN PACE', '依自己的步調學習')}</Text>
        <Text style={[s.h1, { marginTop: 8 }]}>
          {t('Build your foundation.', '建立你的投資基礎。')}
        </Text>
        <Text style={[s.muted, { marginTop: 8 }]}>
          {t(
            'Nine small chapters. Practical examples. Knowledge you can put to work.',
            '九個小章節、實用例子，把理解帶進練習。',
          )}
        </Text>
      </View>
      <View style={s.wrap}>
        <Button
          title={t('All lessons', '所有課程')}
          secondary={review}
          onPress={() => setReview(false)}
        />
        <Button
          title={`${t('Review mistakes', '複習錯題')} (${wrong.length})`}
          secondary={!review}
          onPress={() => setReview(true)}
        />
      </View>
      {shown.length === 0 && (
        <Card>
          <Text style={s.text}>
            {t(
              'No incorrect answers to review yet. Start a lesson to check your understanding.',
              '目前沒有需要複習的錯題。先開始課程，檢查你的理解。',
            )}
          </Text>
        </Card>
      )}
      {shown.map((lesson) => (
        <Pressable
          key={lesson.id}
          accessibilityRole="button"
          onPress={() => {
            setSelected(lesson.id);
            setHint(false);
          }}
        >
          <Card>
            <View style={s.row}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: state.completedLessons.includes(lesson.id)
                    ? colors.accentSoft
                    : colors.plain,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {state.completedLessons.includes(lesson.id) ? (
                  <Icon name="check" color={colors.accent} />
                ) : (
                  <Text style={s.h3}>{String(lessons.indexOf(lesson) + 1).padStart(2, '0')}</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.h3}>{lesson.title[l]}</Text>
                <Text style={s.muted}>{lesson.description[l]}</Text>
              </View>
              <Text style={s.muted}>
                {lesson.minutes} {t('min', '分')}
              </Text>
              <Icon name="arrow" />
            </View>
          </Card>
        </Pressable>
      ))}
      <Text style={s.muted}>
        {t(
          'Adapted from the original project and expanded with new tutorials. The unreviewed 2019 question archive is not used in these lessons.',
          '改編自原專案並加入新教學。未審核的 2019 題庫不會出現在這些課程中。',
        )}
      </Text>
    </View>
  );
}
