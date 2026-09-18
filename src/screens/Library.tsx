import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Badge, Button, Card, colors, Field, styles as s } from '../components/ui';
import { resources } from '../data/learning';
import { toggleItem, useStore } from '../storage/state';
export function Library() {
  const { state, update, busy } = useStore();
  const [search, setSearch] = useState(''),
    [language, setLanguage] = useState<'all' | 'en' | 'zh-TW'>('all'),
    [saved, setSaved] = useState(false),
    [error, setError] = useState('');
  if (!state) return null;
  const l = state.locale,
    t = (en: string, zh: string) => (l === 'en' ? en : zh);
  const filtered = resources.filter(
    (r) =>
      (language === 'all' || r.language === language) &&
      (!saved || state.bookmarks.includes(r.id)) &&
      `${r.title.en} ${r.title['zh-TW']} ${r.publisher} ${r.description[l]}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <View style={s.column}>
      <View>
        <Text style={s.eyebrow}>{t('KEEP EXPLORING', '繼續探索')}</Text>
        <Text style={[s.h1, { marginTop: 8 }]}>
          {t('Good learning goes further.', '讓學習走得更遠。')}
        </Text>
        <Text style={[s.muted, { marginTop: 8 }]}>
          {t(
            'A curated bookshelf from exchanges and investor-education organizations.',
            '精選交易所與投資教育機構的學習資源。',
          )}
        </Text>
      </View>
      <Card>
        <Field
          label={t('Search topics or publishers', '搜尋主題或發布機構')}
          value={search}
          onChange={setSearch}
        />
        <View style={s.wrap}>
          {(['all', 'zh-TW', 'en'] as const).map((lang) => (
            <Button
              key={lang}
              title={
                lang === 'all'
                  ? t('All languages', '所有語言')
                  : lang === 'zh-TW'
                    ? '繁體中文'
                    : 'English'
              }
              secondary={language !== lang}
              small
              onPress={() => setLanguage(lang)}
            />
          ))}
          <Button
            title={
              saved ? t('Bookmarked only ✓', '僅顯示書籤 ✓') : t('Bookmarked only', '僅顯示書籤')
            }
            secondary={!saved}
            small
            onPress={() => setSaved(!saved)}
          />
        </View>
      </Card>
      {!!error && <Text style={{ color: colors.red }}>{error}</Text>}
      {filtered.length === 0 && (
        <Card>
          <Text style={s.muted}>
            {t(
              'No resources match. Try another search or save a resource first.',
              '找不到符合條件的資源。請更換搜尋，或先加入書籤。',
            )}
          </Text>
        </Card>
      )}
      <View style={s.wrap}>
        {filtered.map((resource) => (
          <Card key={resource.id} style={{ flex: 1, minWidth: 270, maxWidth: 560 }}>
            <View style={s.between}>
              <Text style={s.eyebrow}>{resource.publisher}</Text>
              <Badge tone="plain">{resource.language === 'en' ? 'English' : '繁體中文'}</Badge>
            </View>
            <Text style={s.h2}>{resource.title[l]}</Text>
            <Text style={s.text}>{resource.description[l]}</Text>
            <Text style={s.muted}>
              {t('Beginner', '初學者')} · {resource.format[l]}
            </Text>
            <Button
              title={t('Read at source ↗', '前往來源閱讀 ↗')}
              onPress={() => {
                setError('');
                void Linking.openURL(resource.url).catch(() =>
                  setError(
                    t(
                      'Could not open the link. Check your internet connection.',
                      '無法開啟連結，請檢查網路連線。',
                    ),
                  ),
                );
              }}
            />
            <View style={s.wrap}>
              <Button
                title={
                  state.bookmarks.includes(resource.id)
                    ? t('Saved ✓', '已收藏 ✓')
                    : t('Bookmark', '加入書籤')
                }
                small
                secondary
                disabled={busy}
                onPress={() =>
                  void update((old) => ({
                    ...old,
                    bookmarks: toggleItem(old.bookmarks, resource.id),
                  }))
                }
              />
              <Button
                title={
                  state.readResources.includes(resource.id)
                    ? t('Read ✓', '已讀 ✓')
                    : t('Mark as read', '標記已讀')
                }
                small
                secondary
                disabled={busy}
                onPress={() =>
                  void update((old) => ({
                    ...old,
                    readResources: toggleItem(old.readResources, resource.id),
                  }))
                }
              />
            </View>
            <Text style={[s.muted, { fontSize: 11 }]}>
              {t('Reviewed', '檢查日期')}: {resource.reviewed}
            </Text>
          </Card>
        ))}
      </View>
      <Text style={s.muted}>
        {t(
          'External pages open in their original language and need an internet connection. Opening a link does not mark it as read.',
          '外部頁面以原語言開啟並需要網路。開啟連結不會自動標記已讀。',
        )}
      </Text>
    </View>
  );
}
