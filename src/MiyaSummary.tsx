import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { MiyaClipRow, MiyaScopePicker } from './Miya';
import { dailySummary, failedSummaryDate, scopeName, summaryDates, summaryToday, type MiyaClip, type MiyaScope, type MiyaTopic } from './miyaDemo';
import { color, Icon, Label, s, Sheet } from './ui';

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
    <ScrollView contentContainerStyle={a.content}>
      <View style={a.between}>
        <Label bold size={17}>智能摘要</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={'选择日期 ' + date} style={a.filter}
          onPress={() => { setPendingDate(date); setChoosingDate(true); }}>
          <Icon name="calendar-outline" tint={color.green} size={16} /><Label size={13}>{date}</Label><Icon name="chevron-down" size={12} />
        </Pressable>
      </View>
      <View style={a.between}>
        <Label size={13} tint="#687276">设备范围</Label>
        <Pressable accessibilityRole="button" onPress={() => setChoosingScope(true)} style={a.filter}>
          <Label size={13}>{scopeName(scope, pairedName)}</Label><Icon name="chevron-down" size={12} />
        </Pressable>
      </View>
      <View style={[s.card, a.card]}>
        <Label bold>今日回顾</Label>
        {loading ? <View accessibilityLabel="摘要加载中" accessibilityLiveRegion="polite" style={a.lines}>
          <View style={a.skeleton} /><View style={[a.skeleton, { width: '82%' }]} /><View style={[a.skeleton, { width: '61%' }]} />
        </View> : error ? <View style={a.empty}>
          <Label size={14} tint="#687276">摘要加载失败</Label>
          <Pressable accessibilityRole="button" onPress={() => { setRetried(true); setLoading(true); }}>
            <Label size={14} tint={color.green}>重试</Label>
          </Pressable>
        </View> : entries.length === 0 ? <View style={a.empty}><Label size={14} tint="#687276">当天暂无摘要</Label></View> : <>
          <Label size={12} tint="#687276">上次更新：{updatedAt}{updating ? ' · 更新中' : ''}</Label>
          <View style={a.lines}>
            {(expanded ? entries : entries.slice(0, 3)).map(entry => <View key={entry.time ?? entry.text} style={a.entry}>
              {entry.time && <Label size={14} bold tint="#3b6058" style={a.timestamp}>{entry.time}</Label>}
              <Label size={14} style={a.entryText}>{entry.text}</Label>
            </View>)}
            {expanded && extra.map(text => <Label key={text} size={14} style={a.entryText}>{text}</Label>)}
          </View>
          {(entries.length > 3 || extra.length > 0) && <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)} style={a.link}>
            <Label size={13} tint={color.green}>{expanded ? '收起摘要' : '展开摘要'}</Label>
          </Pressable>}
        </>}
      </View>
      {!loading && topics.length > 0 && <View style={a.topicSection}>
        <Label bold>值得关注</Label>
        <View style={a.grid}>
          {topics.map(topic => <Pressable key={topic.id} accessibilityRole="button" onPress={() => openTopic(topic, date, scope)} style={[s.card, a.topic]}>
            <View style={a.photo}>
              {topic.clips.length > 0 ? <Image source={media.frame} style={a.topicImage} /> : <Label size={12} tint="#687276">暂无图片</Label>}
              {topic.attention && <View style={a.attention}><Label size={11} tint="#895528">需留意</Label></View>}
            </View>
            <View style={a.topicCaption}>
              <Label size={15} bold>{topic.title}</Label>
              <View style={a.between}><Label size={12} tint="#687276">{topic.count} 条</Label><Icon name="chevron-forward" size={12} tint={color.muted} /></View>
            </View>
          </Pressable>)}
        </View>
      </View>}
      <Pressable accessibilityRole="button" onPress={() => openActivities(date, scope)} style={[s.card, a.activities]}>
        <Icon name="list-outline" tint={color.green} size={21} />
        <View style={s.fill}><Label size={15} bold>查看当天活动</Label><Label size={12} tint="#687276">{date} · {scopeName(scope, pairedName)}</Label></View>
        <Icon name="chevron-forward" size={16} tint={color.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => ask(date, scope)} style={a.ask}>
        <Label size={14} tint={color.green}>问问这一天</Label><Icon name="arrow-up-outline" size={14} tint={color.green} />
      </Pressable>
    </ScrollView>
    {choosingDate && <Sheet title="选择日期" close={() => setChoosingDate(false)} confirm={selectDate}>
      {summaryDates.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: item === pendingDate }}
        onPress={() => setPendingDate(item)} style={[a.dateOption, s.divider]}>
        <Label>{item}</Label>{item === pendingDate && <Icon name="checkmark" tint={color.green} />}
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

export function MiyaTopicDetails({ topic, date, scope, pairedName }: {
  topic: MiyaTopic; date: string; scope: MiyaScope; pairedName: string;
}) {
  return <ScrollView contentContainerStyle={a.content}>
    <View style={[s.card, a.card]}>
      <Label size={12} tint="#687276">{date} · {scopeName(scope, pairedName)}</Label>
      <Label bold>{topic.title}</Label>
      <Label size={13}>{topic.description}</Label>
    </View>
    <View style={a.between}><Label bold>关联事件</Label><Label size={13} tint="#687276">{topic.clips.length} 条</Label></View>
    <View style={[s.card, a.card]}>
      {topic.clips.length > 0 ? topic.clips.map(clip => <MiyaClipRow key={clip.id} clip={clip} pairedName={pairedName} />)
        : <View style={a.empty}><Label size={14} tint="#687276">暂无关联事件</Label></View>}
    </View>
  </ScrollView>;
}

export function MiyaActivities({ date, scope, pairedName, play }: {
  date: string; scope: MiyaScope; pairedName: string; play: (clip: MiyaClip) => void;
}) {
  const { clips, groups } = dailySummary(date, scope);
  return <ScrollView contentContainerStyle={a.content}>
    <Label size={13} tint="#687276">{date} · {scopeName(scope, pairedName)}</Label>
    <View style={[s.card, a.card]}>
      {clips.map(clip => <MiyaClipRow key={clip.id} clip={clip} pairedName={pairedName} play={() => play(clip)} />)}
      {groups.map(group => <View key={group} style={[a.between, a.group]}>
        <Label size={14}>{group}</Label><Label size={12} tint={color.muted}>活动分类</Label>
      </View>)}
      {!clips.length && !groups.length && <View style={a.empty}><Label size={14} tint="#687276">当天暂无活动</Label></View>}
    </View>
  </ScrollView>;
}

const a = StyleSheet.create({
  content: { padding: 16, gap: 11 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  filter: { minHeight: 35, paddingHorizontal: 9, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 5 },
  card: { padding: 13, gap: 6 },
  lines: { gap: 6, marginTop: 3 },
  entry: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  timestamp: { fontVariant: ['tabular-nums'] },
  entryText: { flexShrink: 1, lineHeight: 21 },
  link: { alignSelf: 'flex-start', minHeight: 31, justifyContent: 'center' },
  empty: { padding: 12, alignItems: 'center', gap: 7 },
  skeleton: { height: 11, backgroundColor: '#e9edee', borderRadius: 6 },
  topicSection: { gap: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  topic: { width: '48.8%', overflow: 'hidden' },
  photo: { aspectRatio: 16 / 9, backgroundColor: '#e8eeed', justifyContent: 'center', alignItems: 'center' },
  topicImage: { width: '100%', height: '100%' },
  attention: { position: 'absolute', left: 7, top: 6, backgroundColor: '#fff2dd', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  topicCaption: { paddingHorizontal: 9, paddingVertical: 7, gap: 3 },
  activities: { flexDirection: 'row', alignItems: 'center', minHeight: 56, padding: 11, gap: 9 },
  ask: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 34 },
  dateOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  group: { minHeight: 39 },
});
