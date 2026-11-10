import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { media } from './demo';
import { color, Icon, IconButton, Label, s, Segments, type IconName } from './ui';

const prompts: { label: string; name: IconName; tint: string }[] = [
  { label: '儿童写作业', name: 'document-text', tint: '#f6a453' },
  { label: '宠物玩耍', name: 'paw', tint: '#538ef6' },
  { label: '宠物吃饭喝水', name: 'restaurant', tint: '#ed8e9a' },
];

export function Search({ safeBottom, play }: { safeBottom: number; play: () => void }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [smart, setSmart] = useState(true);
  const submit = (input: string) => {
    const value = input.trim();
    if (!value) return;
    setHistory(items => [...items, value]);
    setQuery('');
    Keyboard.dismiss();
  };
  return <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={s.fill} contentContainerStyle={i.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {history.length === 0 ? <Label size={19} bold style={i.greeting}>早上好，我有什么能帮助你的吗？</Label>
        : history.map((message, index) => <View key={index} style={i.messageGroup}>
          <View style={i.question}><Label size={15}>{message}</Label></View>
          <View style={i.reply}>
            <Label size={14}>{message.includes('作业') ? '样例结果 · 找到一段写作业的视频片段' : '本地样例中暂无匹配的视频片段'}</Label>
            {message.includes('作业') && <Pressable accessibilityRole="button" onPress={play} style={i.result}>
              <Image source={media.frame} style={i.resultImage} />
              <View><Label size={14} bold>写作业</Label><Label size={12} tint={color.muted}>06.25 18:32 · 样例预览</Label></View>
              <Icon name="play-circle-outline" tint={color.mint} size={22} />
            </Pressable>}
          </View>
        </View>)}
    </ScrollView>
    <View style={[i.searchFooter, { paddingBottom: safeBottom + 16 }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={i.promptRail} contentContainerStyle={i.prompts}>
        {prompts.map(({ label, name, tint }) => <Pressable key={label} accessibilityRole="button" onPress={() => submit(label)} style={i.prompt}>
          <Icon name={name} size={17} tint={tint} /><Label size={15}>{label}</Label>
        </Pressable>)}
      </ScrollView>
      <View style={i.composer}>
        {smart && <View style={[i.mode, s.divider]}>
          <Label size={13} tint={color.muted}>AI智搜</Label><IconButton name="close" size={17} label="关闭AI智搜标签" onPress={() => setSmart(false)} />
        </View>}
        <View style={i.inputRow}>
          <IconButton name="apps-outline" label="显示AI智搜标签" onPress={() => setSmart(true)} />
          <TextInput accessibilityLabel="搜索视频" placeholder="欢迎向小助手提问～" placeholderTextColor="#b9bbbf"
            style={i.input} value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={() => submit(query)} />
          <Pressable accessibilityRole="button" accessibilityLabel="发送搜索" onPress={() => submit(query)} style={i.send}>
            <LinearGradient colors={['#2bb7d9', '#10c6a0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, i.sendGradient]} />
            <Icon name="arrow-forward" size={20} tint="#fff" />
          </Pressable>
        </View>
      </View>
      <Label size={13} tint={color.muted} style={i.searchNote}>本内容由AI生成</Label>
    </View>
  </KeyboardAvoidingView>;
}

type Behavior = { label: string; seconds: number[]; previous: number[]; counts: number[]; previousCounts: number[] };
const reports: { total: number; secondary: number; secondaryLabel: string; behaviors: Behavior[] }[] = [
  { total: 94, secondary: 27, secondaryLabel: '儿童出现次数', behaviors: [
    { label: '用餐', seconds: [0, 0, 0, 0, 0, 0, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 0, 0, 0, 0, 0, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '静姿', seconds: [0, 34, 48, 86, 0, 79, 60], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 1, 1, 2, 0, 2, 1], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '写作业', seconds: [0, 0, 68, 0, 94, 45, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 0, 1, 0, 2, 1, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '玩手机', seconds: [26, 41, 0, 73, 62, 100, 80], previous: [0, 37, 0, 0, 35, 0, 0], counts: [1, 1, 0, 2, 1, 3, 2], previousCounts: [0, 1, 0, 0, 1, 0, 0] },
  ] },
  { total: 8, secondary: 0, secondaryLabel: '人宠互动次数', behaviors: [
    { label: '进食', seconds: [0, 0, 0, 0, 0, 0, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 0, 0, 0, 0, 0, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '吠叫', seconds: [0, 2, 0, 4, 0, 5, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 1, 0, 1, 0, 1, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '挠门', seconds: [0, 0, 8, 0, 0, 4, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 0, 1, 0, 0, 1, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
    { label: '家具损坏', seconds: [0, 0, 0, 0, 0, 0, 0], previous: [0, 0, 0, 0, 0, 0, 0], counts: [0, 0, 0, 0, 0, 0, 0], previousCounts: [0, 0, 0, 0, 0, 0, 0] },
  ] },
];
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const duration = (seconds: number) => seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
const chartDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function Report() {
  const [tab, setTab] = useState(0);
  const [metric, setMetric] = useState(0);
  const [category, setCategory] = useState(0);
  const report = reports[tab];
  const format = metric === 0 ? duration : (value: number) => `${value}次`;
  const groups = report.behaviors.map(behavior => ({
    label: behavior.label, now: metric === 0 ? behavior.seconds : behavior.counts,
    previous: metric === 0 ? behavior.previous : behavior.previousCounts,
  }));
  const maxTotal = Math.max(1, ...groups.flatMap(group => [sum(group.now), sum(group.previous)]));
  const trend = groups[category];
  return <View style={s.fill}>
    <View style={i.reportTabs}>{['家人守护周报', '宠物周报'].map((label, index) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: index === tab }}
      onPress={() => { setTab(index); setCategory(0); }} key={label} style={i.reportTab}>
      <Label size={index === tab ? 19 : 15} bold={index === tab}>{label}</Label>
      {index === tab && <View style={i.reportUnderline} />}
    </Pressable>)}</View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={i.reportContent}>
      <View style={[s.card, i.summary]}>
        <View style={[i.reportDate, s.divider]}>
          <Image source={media.camera} style={i.cameraAvatar} />
          <View><Label size={20} bold>06.21–06.27</Label><Label size={14} tint={color.muted}>统计区间</Label></View>
        </View>
        <View style={i.totals}>
          <View>
            <View style={i.totalNumber}><Label size={37} bold>{report.total}</Label>
              {tab === 0 && <View style={i.change}><Icon name="arrow-up" size={17} tint="#f87d76" /><Label size={12} tint="#f36d68">571%</Label></View>}
            </View>
            <Label size={13} tint={color.muted}>出现次数</Label>
          </View>
          <View><Label size={37} bold>{report.secondary}</Label><Label size={13} tint={color.muted}>{report.secondaryLabel}</Label></View>
        </View>
      </View>
      <View style={[s.card, i.chartCard]}>
        <View style={i.chartTitle}>
          <View style={i.chartSymbol}><Icon name="stats-chart" size={17} tint="#fff" /></View>
          <Label size={15} bold style={s.fill}>行为数据</Label>
          <Segments labels={['时长', '次数']} selected={metric} onChange={setMetric} />
        </View>
        <View style={i.legend}>
          <View style={i.legendMark} /><Label size={11} tint={color.muted}>本周</Label>
          <View style={[i.legendMark, i.previous]} /><Label size={11} tint={color.muted}>上周</Label>
        </View>
        <View style={[i.bars, s.divider]}>
          {groups.map(({ label, now, previous }) => <View key={label} style={i.barGroup} accessible
            accessibilityLabel={`${label}，本周${format(sum(now))}，上周${format(sum(previous))}`}>
            <View style={i.barPair}>
              <View style={[i.bar, { height: 110 * sum(now) / maxTotal }]} />
              <View style={[i.bar, i.previous, { height: 110 * sum(previous) / maxTotal }]} />
            </View>
            <Label size={12} bold>{format(sum(now))}</Label>
            <Label size={11} tint={color.muted} numberOfLines={1}>{label}{metric === 0 ? '时长' : '次数'}</Label>
          </View>)}
        </View>
        <View style={i.trendHeader}>
          <Label size={13} bold>每日趋势</Label>
          <Segments labels={groups.map(group => group.label)} selected={category} onChange={setCategory} />
        </View>
        <Trend values={trend.now} format={format} />
      </View>
    </ScrollView>
  </View>;
}

function Trend({ values, format }: { values: number[]; format: (value: number) => string }) {
  const maxValue = Math.max(1, ...values);
  const points = values.map((value, index) => ({ x: 22 + index * 46, y: 97 - value / maxValue * 78 }));
  return <View style={i.trend} accessible accessibilityLabel={values.map((value, index) => chartDays[index] + format(value)).join('，')}>
    <Svg width="100%" height={106} viewBox="0 0 320 106" preserveAspectRatio="none">
      {[2, 21, 40, 59, 78, 97].map(y => <Line key={y} x1="0" x2="320" y1={y} y2={y} stroke="#f0f1f2" strokeWidth={1} />)}
      <Polyline points={points.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={color.orange} strokeWidth={1.5} />
      {points.map(({ x, y }) => <Circle key={x} cx={x} cy={y} r={4} fill={color.orange} />)}
    </Svg>
    <View style={i.days}>{chartDays.map(day => <Label key={day} size={10}>{day}</Label>)}</View>
  </View>;
}

const i = StyleSheet.create({
  messages: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  greeting: { textAlign: 'center', marginTop: 94 },
  messageGroup: { gap: 10, marginTop: 18 },
  question: { alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: '#d7f6ee', borderRadius: 16, padding: 12 },
  reply: { alignSelf: 'flex-start', maxWidth: '96%', backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 10 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultImage: { width: 78, height: 44, borderRadius: 5 },
  searchFooter: { gap: 12, paddingTop: 8 },
  promptRail: { flexGrow: 0 },
  prompts: { gap: 10, paddingHorizontal: 16 },
  prompt: { minHeight: 34, paddingHorizontal: 13, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff' },
  composer: { marginHorizontal: 16, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#fff' },
  mode: { height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 3 },
  input: { flex: 1, minWidth: 0, minHeight: 43, fontSize: 17, color: color.text, paddingVertical: 0 },
  send: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  sendGradient: { borderRadius: 15 },
  searchNote: { textAlign: 'center', paddingTop: 1 },
  reportTabs: { flexDirection: 'row', gap: 26, paddingHorizontal: 11, height: 45 },
  reportTab: { justifyContent: 'center', alignItems: 'center' },
  reportUnderline: { position: 'absolute', bottom: 8, height: 2, width: 13, backgroundColor: color.mint, borderRadius: 2 },
  reportContent: { paddingHorizontal: 10, paddingBottom: 14, gap: 13 },
  summary: { paddingHorizontal: 11, borderRadius: 11 },
  reportDate: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 84 },
  cameraAvatar: { width: 40, height: 40, borderRadius: 20 },
  totals: { flexDirection: 'row', gap: 43, minHeight: 103, alignItems: 'center' },
  totalNumber: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chartCard: { borderRadius: 11, paddingTop: 20, paddingHorizontal: 11, paddingBottom: 28 },
  chartTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chartSymbol: { height: 32, width: 32, borderRadius: 12, backgroundColor: color.mint, justifyContent: 'center', alignItems: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 21, marginLeft: 4 },
  legendMark: { width: 13, height: 13, borderRadius: 3, backgroundColor: color.orange },
  previous: { backgroundColor: '#ffdbb6' },
  bars: { flexDirection: 'row', marginTop: 15, paddingBottom: 5 },
  barGroup: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5 },
  barPair: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 4 },
  bar: { width: 9, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: color.orange },
  trendHeader: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  trend: { marginTop: 10, marginHorizontal: 17 },
  days: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -4 },
});
