import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { MiyaClipRow, MiyaScopePicker } from './Miya';
import { MiyaNoticeCard } from './MiyaNoticeCard';
import { dailySummary, failedSummaryDate, scopeName, summaryDates, summaryToday, type MiyaClip, type MiyaNotice, type MiyaScope, type MiyaTopic } from './miyaDemo';
import { color, Icon, Label, s, SelectionCheck, Sheet } from './ui';

export function MiyaSummary({ pairedName, openTopic, openActivities, ask }: {
  pairedName: string;
  openTopic: (topic: MiyaTopic, date: string, scope: MiyaScope) => void;
  openActivities: (date: string, scope: MiyaScope) => void;
  ask: (date: string, scope: MiyaScope) => void;
}) {
  const [date, setDate] = useState(summaryToday);
  const [scope, setScope] = useState<MiyaScope>('all');
  const [expanded, setExpanded] = useState(false);
  const [choosingDate, setChoosingDate] = useState(false);
  const [pendingDate, setPendingDate] = useState(date);
  const [choosingScope, setChoosingScope] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retried, setRetried] = useState(false);
  const { entries, extra, updatedAt, updating, topics } = dailySummary(date, scope);
  const error = date === failedSummaryDate && !retried;
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(timer);
  }, [loading, date, scope]);

  function selectDate() {
    setChoosingDate(false);
    if (pendingDate === date) return;
    setDate(pendingDate);
    setRetried(false);
    setLoading(true);
    setExpanded(false);
  }

  return <>
    <ScrollView contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>
      <View style={a.between}>
        <Label bold size={17}>智能摘要</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={'选择日期 ' + date} style={a.filter}
          onPress={() => { setPendingDate(date); setChoosingDate(true); }}>
          <Icon name="calendar-outline" tint={color.mintText} size={16} /><Label size={13}>{date}</Label><Icon name="chevron-down" size={12} />
        </Pressable>
      </View>
      <View style={a.between}>
        <Label size={13} tint={color.secondaryText}>设备范围</Label>
        <Pressable accessibilityRole="button" onPress={() => setChoosingScope(true)} style={a.filter}>
          <Icon name="videocam-outline" tint={color.mintText} size={15} />
          <Label size={13}>{scopeName(scope, pairedName)}</Label><Icon name="chevron-down" size={12} />
        </Pressable>
      </View>
      <View style={[s.card, a.card]}>
        <View style={[a.cardHeader, s.divider]}>
          <View style={s.mintBadge}><Icon name="receipt-outline" size={18} tint={color.mintText} /></View>
          <Label size={17} bold>今日回顾</Label>
        </View>
        {loading ? <View accessibilityLabel="摘要加载中" accessibilityLiveRegion="polite" style={a.lines}>
          <View style={a.skeleton} /><View style={[a.skeleton, { width: '82%' }]} /><View style={[a.skeleton, { width: '61%' }]} />
        </View> : error ? <View style={a.empty}>
          <Label size={14} tint={color.secondaryText}>摘要加载失败</Label>
          <Pressable accessibilityRole="button" onPress={() => { setRetried(true); setLoading(true); }}>
            <Label size={14} tint={color.mintText}>重试</Label>
          </Pressable>
        </View> : entries.length === 0 ? <View style={a.empty}><Label size={14} tint={color.secondaryText}>当天暂无摘要</Label></View> : <>
          <Label size={12} tint={color.secondaryText}>上次更新：{updatedAt}{updating ? ' · 更新中' : ''}</Label>
          <View style={a.lines}>
            {(expanded ? entries : entries.slice(0, 3)).map(entry => <View key={entry.time ?? entry.text} style={a.entry}>
              {entry.time && <Label size={14} bold tint={color.mintText} style={a.timestamp}>{entry.time}</Label>}
              <Label size={14} style={a.entryText}>{entry.text}</Label>
            </View>)}
            {expanded && extra.map(text => <Label key={text} size={14} style={a.entryText}>{text}</Label>)}
          </View>
          {(entries.length > 3 || extra.length > 0) && <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)} style={a.link}>
            <Label size={13} tint={color.mintText}>{expanded ? '收起摘要' : '展开摘要'}</Label>
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} tint={color.mintText} />
          </Pressable>}
        </>}
      </View>
      {!loading && topics.length > 0 && <View style={a.topicSection}>
        <Label size={17} bold>值得关注</Label>
        <View style={a.grid}>
          {topics.map(topic => <Pressable key={topic.id} accessibilityRole="button" onPress={() => openTopic(topic, date, scope)} style={[s.card, a.topic]}>
            <View style={a.photo}>
              {topic.clips.length > 0 ? <Image source={media.frame} style={a.topicImage} /> : <Label size={12} tint={color.secondaryText}>暂无图片</Label>}
              {topic.attention && <View style={a.attention}><Label size={11} tint="#895528">需留意</Label></View>}
            </View>
            <View style={a.topicCaption}>
              <Label size={15} bold>{topic.title}</Label>
              <View style={a.between}>
                <Label size={12} tint={color.secondaryText} style={a.count}>{topic.count} 条</Label>
                <Icon name="chevron-forward" size={14} tint={color.muted} />
              </View>
            </View>
          </Pressable>)}
        </View>
      </View>}
      <Pressable accessibilityRole="button" onPress={() => openActivities(date, scope)} style={[s.card, a.activities]}>
        <View style={s.mintBadge}><Icon name="list-outline" tint={color.mintText} size={19} /></View>
        <View style={s.fill}><Label size={16}>查看当天活动</Label><Label size={12} tint={color.secondaryText}>{date} · {scopeName(scope, pairedName)}</Label></View>
        <Icon name="chevron-forward" size={16} tint={color.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => ask(date, scope)} style={a.ask}>
        <Label size={14} tint={color.mintText}>问问这一天</Label><Icon name="chevron-forward" size={14} tint={color.mintText} />
      </Pressable>
    </ScrollView>
    {choosingDate && <Sheet title="选择日期" close={() => setChoosingDate(false)} confirm={selectDate}>
      {summaryDates.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: item === pendingDate }}
        onPress={() => setPendingDate(item)} style={[a.dateOption, s.divider]}>
        <Label>{item}</Label><SelectionCheck checked={item === pendingDate} />
      </Pressable>)}
    </Sheet>}
    {choosingScope && <MiyaScopePicker pairedName={pairedName} scope={scope} onSelect={selected => {
      if (selected === scope) return;
      setScope(selected);
      setLoading(true);
      setExpanded(false);
    }} onClose={() => setChoosingScope(false)} />}
  </>;
}

export function MiyaNoticeList({ notices }: { notices: MiyaNotice[] }) {
  return <ScrollView contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>
    {notices.length ? notices.map(notice => <MiyaNoticeCard key={notice.id} notice={notice} />)
      : <View style={a.empty}><Label size={14} tint={color.secondaryText}>暂无事件通知</Label></View>}
  </ScrollView>;
}

export function MiyaTopicDetails({ topic, date, scope, pairedName }: {
  topic: MiyaTopic; date: string; scope: MiyaScope; pairedName: string;
}) {
  return <ScrollView contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>
    <View style={[s.card, a.card]}>
      <View style={[a.cardHeader, s.divider]}>
        <View style={s.mintBadge}><Icon name="layers-outline" size={18} tint={color.mintText} /></View>
        <Label size={17} bold>{topic.title}</Label>
      </View>
      <Label size={13} tint={color.secondaryText}>{date} · {scopeName(scope, pairedName)}</Label>
      <Label size={15} style={a.entryText}>{topic.description}</Label>
    </View>
    <View style={a.between}><Label size={17} bold>关联事件</Label><Label size={13} tint={color.secondaryText}>{topic.clips.length} 条</Label></View>
    <View style={[s.card, a.list]}>
      {topic.clips.length > 0 ? topic.clips.map((clip, index) => <View key={clip.id} style={index < topic.clips.length - 1 && s.divider}>
        <MiyaClipRow clip={clip} pairedName={pairedName} />
      </View>) : <View style={a.empty}><Label size={14} tint={color.secondaryText}>暂无关联事件</Label></View>}
    </View>
  </ScrollView>;
}

export function MiyaActivities({ date, scope, pairedName, play }: {
  date: string; scope: MiyaScope; pairedName: string; play: (clip: MiyaClip) => void;
}) {
  const { clips, groups } = dailySummary(date, scope);
  return <ScrollView contentContainerStyle={a.content} showsVerticalScrollIndicator={false}>
    <Label size={13} tint={color.secondaryText}>{date} · {scopeName(scope, pairedName)}</Label>
    <View style={[s.card, a.list]}>
      {clips.map((clip, index) => <View key={clip.id} style={(index < clips.length - 1 || groups.length > 0) && s.divider}>
        <MiyaClipRow clip={clip} pairedName={pairedName} play={() => play(clip)} />
      </View>)}
      {groups.map((group, index) => <View key={group} style={[a.between, a.group, index < groups.length - 1 && s.divider]}>
        <Label size={14}>{group}</Label><Label size={12} tint={color.muted}>活动分类</Label>
      </View>)}
      {!clips.length && !groups.length && <View style={a.empty}><Label size={14} tint={color.secondaryText}>当天暂无活动</Label></View>}
    </View>
  </ScrollView>;
}

const a = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  filter: { minHeight: 35, paddingHorizontal: 12, borderRadius: 18, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', gap: 5 },
  card: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 10 },
  list: { paddingHorizontal: 16 },
  lines: { gap: 6, marginTop: 3 },
  entry: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  timestamp: { fontVariant: ['tabular-nums'] },
  entryText: { flexShrink: 1, lineHeight: 21 },
  link: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', minHeight: 29, gap: 4 },
  empty: { padding: 12, alignItems: 'center', gap: 7 },
  skeleton: { height: 11, backgroundColor: color.canvas, borderRadius: 6 },
  topicSection: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  topic: { width: '48.8%', overflow: 'hidden' },
  photo: { aspectRatio: 16 / 9, backgroundColor: color.canvas, justifyContent: 'center', alignItems: 'center' },
  topicImage: { width: '100%', height: '100%' },
  attention: { position: 'absolute', left: 7, top: 6, backgroundColor: '#fff1df', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  topicCaption: { paddingHorizontal: 12, paddingVertical: 9, gap: 5 },
  count: { backgroundColor: color.canvas, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  activities: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingHorizontal: 14, paddingVertical: 9, gap: 9 },
  ask: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 34 },
  dateOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  group: { minHeight: 39 },
});
