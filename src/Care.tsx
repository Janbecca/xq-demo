import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media, type Rule } from './demo';
import { color, Icon, Label, s, Toggle, type IconName } from './ui';

export type CareDestination = 'detection' | 'search' | 'report' | 'callAlerts';
const features: {
  screen: CareDestination; title: string; action: string; name: IconName; tint: string; body: string; tags?: string[];
}[] = [
  { screen: 'detection', title: 'AI智能检测', action: '去设置', name: 'sparkles-outline', tint: '#ffa650',
    body: '智能识别儿童行为、老人活动、宠物萌趣瞬间等关键行为，自动识别并推送摘要', tags: ['智慧通知', '分级告警', '智能事件筛选'] },
  { screen: 'search', title: '智搜视频', action: '去查看', name: 'search-outline', tint: color.mint,
    body: '看视频不用翻，一句话快速定位回放视频' },
  { screen: 'report', title: '智能看护报告', action: '去查看', name: 'receipt-outline', tint: '#5480d6',
    body: '生成可视化报告，忙时速览摘要，闲时细查时间详情', tags: ['老人看护', '宠物精彩', '儿童行为'] },
  { screen: 'callAlerts', title: '微信通话告警', action: '去设置', name: 'call-outline', tint: color.mint,
    body: '选择需要微信通话提醒的事件，可随时调整。' },
];

export function Care({ open, toast }: { open: (screen: CareDestination) => void; toast: (message: string) => void }) {
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={a.careContent}>
    <View style={a.membership}>
      <View style={a.plan}><Label size={18} tint="#a88f66">年卡</Label><Label size={16} tint="#a88f66">2027.04.29 到期</Label></View>
      <Pressable accessibilityRole="button" onPress={() => toast('年卡续期 · 功能展示')} style={a.extend}><Label size={17} tint="#4b3010">去延长</Label></Pressable>
    </View>
    {features.map(({ screen, title, action, name, tint, body, tags }) => <View key={screen} style={[s.card, a.feature]}>
      <Pressable accessibilityRole="button" accessibilityLabel={title + '，' + action} onPress={() => open(screen)} style={[a.featureHeader, s.divider]}>
        <View style={[a.featureIcon, { backgroundColor: tint }]}>
          {screen === 'detection' ? <Label size={14} bold tint="#fff">AI</Label> : <Icon name={name} size={17} tint="#fff" />}
        </View>
        <Label size={17} bold style={s.fill}>{title}</Label>
        <Label size={15} tint={color.muted}>{action}</Label><Icon name="chevron-forward" size={16} tint={color.muted} />
      </Pressable>
      <Label size={16} tint={color.muted} style={a.featureBody}>{body}</Label>
      {tags && <View style={a.tags}>{tags.map(tag => <Pressable key={tag} accessibilityRole="button" onPress={() => open(screen)} style={a.tag}>
        <Label size={13}>{tag}</Label>
      </Pressable>)}</View>}
    </View>)}
  </ScrollView>;
}

const slides = [
  'AI 智能识别儿童行为、老人活动、宠物萌趣瞬间等关键行为，自动生成摘要并推送',
  '按看护场景设置分级告警，指定生效时间和通知方式，及时了解设备动态',
];

export function Detection({ enabled, setEnabled, rules, toggle, edit }: {
  enabled: boolean; setEnabled: (value: boolean) => void; rules: Rule[]; toggle: (id: number, value: boolean) => void; edit: (rule?: Rule) => void;
}) {
  const [slide, setSlide] = useState(0);
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={a.detectionContent}>
    <View style={[s.card, a.intro]}>
      <Pressable accessibilityRole="button" accessibilityLabel="切换智能检测介绍" onPress={() => setSlide(1 - slide)} style={a.introImageBox}>
        {slide === 0 ? <Image source={media.detection} style={a.introImage} resizeMode="contain" />
          : <View style={a.slideSymbol}><Icon name="notifications-outline" size={53} tint={color.mint} /></View>}
      </Pressable>
      <Label size={13} style={a.introText}>{slides[slide]}</Label>
      <View style={a.pagination}>{slides.map((_, index) => <Pressable key={index} onPress={() => setSlide(index)} hitSlop={9}
        accessibilityRole="button" accessibilityLabel={`介绍第 ${index + 1} 页`} accessibilityState={{ selected: slide === index }}
        style={[a.dot, slide === index && a.dotSelected]} />)}</View>
    </View>
    <View style={[s.card, a.rules]}>
      <View style={[a.master, s.divider]}>
        <Label size={17}>分级告警</Label>
        <Toggle label="分级告警" enabled={enabled} onChange={setEnabled} />
      </View>
      {rules.map(rule => <View key={rule.id} style={[a.rule, s.divider]}>
        <Pressable style={a.ruleDetails} accessibilityRole="button" accessibilityLabel={`编辑${rule.scene}看护，${rule.type}`} onPress={() => edit(rule)}>
          <Label size={17}>{rule.scene}看护</Label><Label size={14} tint={color.muted}>{rule.channel}</Label>
        </Pressable>
        <Toggle label={`${rule.type}告警`} disabled={!enabled} enabled={enabled && rule.enabled} onChange={value => toggle(rule.id, value)} />
      </View>)}
      <Pressable accessibilityRole="button" onPress={() => edit()} style={a.add}>
        <Icon name="add-circle-outline" size={23} tint={color.mint} /><Label size={16}>添加分级告警</Label>
      </Pressable>
    </View>
    <View style={a.risk}>
      <View style={a.riskTitle}><Icon name="warning" size={21} tint="#ffa64b" /><Label size={16}>风险说明</Label></View>
      <Label size={14} tint="#85888c" style={a.riskText}>本功能的识别效果会受客观使用环境（如画面光线、拍摄角度）及 AI 模型当前性能影响，若出现人形遮挡、光线过暗等情况，可能会导致误识或漏识。请自行评估风险后使用该功能。</Label>
    </View>
  </ScrollView>;
}

export function CareBackground() {
  return <LinearGradient colors={['#fff1df', '#fcf4e8', '#f7f7f7']} locations={[0, 0.53, 1]}
    start={{ x: 1, y: 0 }} end={{ x: 0.4, y: 1 }} style={StyleSheet.absoluteFill} />;
}

const a = StyleSheet.create({
  careContent: { paddingHorizontal: 17, paddingBottom: 30, gap: 16 },
  membership: { minHeight: 95, paddingHorizontal: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  plan: { gap: 6 },
  extend: { backgroundColor: '#f9dec0', borderRadius: 25, paddingHorizontal: 24, paddingVertical: 8 },
  feature: { paddingHorizontal: 17, paddingBottom: 16 },
  featureHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 9 },
  featureIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  featureBody: { paddingTop: 15, lineHeight: 25 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  tag: { backgroundColor: color.canvas, borderRadius: 15, paddingVertical: 3, paddingHorizontal: 15 },
  detectionContent: { paddingHorizontal: 16, paddingTop: 17, paddingBottom: 28 },
  intro: { minHeight: 236, alignItems: 'center', paddingHorizontal: 28, paddingTop: 16, paddingBottom: 15 },
  introImageBox: { width: '100%', height: 131, alignItems: 'center', justifyContent: 'center' },
  introImage: { width: '65%', height: '100%' },
  slideSymbol: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#e1f8f3', alignItems: 'center', justifyContent: 'center' },
  introText: { textAlign: 'center', lineHeight: 18, marginTop: 16 },
  pagination: { flexDirection: 'row', gap: 4, marginTop: 18 },
  dot: { width: 9, height: 4, backgroundColor: '#dfe0e1' },
  dotSelected: { backgroundColor: color.mint },
  rules: { marginTop: 32, paddingHorizontal: 16 },
  master: { minHeight: 61, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  rule: { minHeight: 84, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  ruleDetails: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', gap: 8 },
  add: { minHeight: 68, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  risk: { marginTop: 22 },
  riskTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskText: { lineHeight: 22, marginTop: 7 },
});
