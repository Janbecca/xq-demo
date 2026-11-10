import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { callAlertCategories } from './demo';
import { findMiyaEvents, presetCallAlerts } from './miyaEvents';
import { DeviceName } from './Pairing';
import { color, Icon, IconButton, Label, PrimaryButton, s, Segments } from './ui';

const avatar = require('../assets/miya-avatar.png');
const categoryLabels = callAlertCategories.map(category => category.label);
const capabilities = ['AI智能检测', 'AI智能告警', 'AI智搜', '家人/宠物守护周报'];
const eventLimit = 4;
const mintSurface = '#e4f8f3';
const mintText = '#16836e';
type Stage = 'offer' | 'claiming' | 'events' | 'configuring' | 'name';
const prompts: Record<Stage, readonly string[]> = {
  offer: [
    'Hello~我是您的专属AI管家Miya~',
    '您的AI智能摄像机CN5已成功连接。',
    '与德施曼同行，让安全常在。',
    '让我们一起开启安心守护之旅吧~',
  ],
  claiming: [],
  events: ['恭喜你领取成功！', '请选择你关心的事件，Miya会为您全程关注、守护您的家庭安全~'],
  configuring: ['收到~', '正在为您开启专属家庭守护服务~'],
  name: ['配置完成，就差最后一步啦！', '给你的设备取个名字吧~'],
};
const messageDelay = 460;
const cardDelay = 1000;

function Skip({ action, label }: { action: () => void; label: string }) {
  return <Pressable accessibilityRole="button" onPress={action} style={o.skip}>
    <Label size={14} tint="#626c70">{label}</Label>
  </Pressable>;
}

function MiyaMessage({ text }: { text: string }) {
  return <View style={o.message}>
    <Image source={avatar} style={o.messageAvatar} resizeMode="contain" />
    <Label size={15} style={[s.card, o.bubble]}>{text}</Label>
  </View>;
}

function ChatArrival({ children }: { children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const reveal = (reduceMotion: boolean) => {
      if (!active) return;
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }
      animation = Animated.timing(progress, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' });
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(reveal, () => reveal(true));
    return () => {
      active = false;
      animation?.stop();
    };
  }, [progress]);

  return <Animated.View style={{
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) }],
  }}>{children}</Animated.View>;
}

function MiyaTurn({ messages, children, onReveal }: {
  messages: readonly string[];
  children: ReactNode;
  onReveal?: (top: number) => void;
}) {
  const [visible, setVisible] = useState(1);
  const cardReady = visible > messages.length;
  const lastLayout = useRef<number | null>(null);
  useEffect(() => {
    if (cardReady) return;
    const timer = setTimeout(() => setVisible(count => count + 1), visible === messages.length ? cardDelay : messageDelay);
    return () => clearTimeout(timer);
  }, [cardReady, messages.length, visible]);

  return <View style={o.turn} onLayout={({ nativeEvent }) => {
    if (lastLayout.current === visible) return;
    lastLayout.current = visible;
    onReveal?.(nativeEvent.layout.y);
  }}>
    {messages.slice(0, visible).map(text => <ChatArrival key={text}><MiyaMessage text={text} /></ChatArrival>)}
    {cardReady && <ChatArrival>{children}</ChatArrival>}
  </View>;
}

export function MiyaOnboarding({ back, confirm }: {
  back: () => void; confirm: (name: string, events: readonly string[]) => void;
}) {
  const [stage, setStage] = useState<Stage>('offer');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (stage !== 'claiming') return;
    const timer = setTimeout(() => setStage('events'), 1300);
    return () => clearTimeout(timer);
  }, [stage]);

  return <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={o.header}>
      <View style={o.back}><IconButton name="chevron-back" size={24} label="返回" onPress={back} /></View>
      <Image source={avatar} style={o.headerAvatar} resizeMode="contain" />
      <Label size={18} bold>Miya管家</Label>
    </View>
    <ScrollView ref={scroll} style={s.fill} contentContainerStyle={o.feed} showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Label size={12} tint="#687276" style={o.badge}>配网完成</Label>
      {stage !== 'offer' && prompts.offer.map(text => <MiyaMessage key={text} text={text} />)}
      {stage !== 'offer' && <Label size={14} tint={mintText} style={o.userBubble}>领取 AI 权益</Label>}
      {stage !== 'offer' && stage !== 'claiming' && <Label size={12} tint={mintText} style={o.badge}>AI 权益已领取</Label>}
      {(stage === 'configuring' || stage === 'name') && prompts.events.map(text => <MiyaMessage key={text} text={text} />)}
      {(stage === 'configuring' || stage === 'name') && <Label size={14} tint={mintText} style={o.userBubble}>
        {selected.length ? '确认关注 ' + selected.length + ' 个事件' : '暂不配置'}
      </Label>}
      {stage === 'name' && selected.length > 0 && <>
        {prompts.configuring.map(text => <MiyaMessage key={text} text={text} />)}
        <Label size={12} tint={mintText} style={o.badge}>AI 服务已开启</Label>
      </>}
      <MiyaTurn key={stage} messages={prompts[stage]} onReveal={stage === 'offer' ? undefined : top => {
        scroll.current?.scrollTo({ y: Math.max(0, top - 12), animated: false });
      }}>
        {stage === 'offer' && <View style={[s.card, o.card]}>
          <View style={o.cardHeading}>
            <View style={o.symbol}><Icon name="sparkles-outline" size={19} tint={mintText} /></View>
            <Label size={14} bold tint={mintText}>AI 试用权益</Label>
          </View>
          <View style={o.benefitLine}>
            <Label size={19} bold>免费试用 AI 功能</Label>
            <Label size={13} bold tint={mintText} style={o.value}>价值 ¥12.5</Label>
          </View>
          <View style={o.example}>
            <Icon name="call-outline" size={20} tint={mintText} />
            <View style={s.fill}><Label size={12} tint="#687276">告警示例</Label><Label size={14} bold>老人跌倒 · 微信来电提醒</Label></View>
          </View>
          <PrimaryButton label="领取 AI 权益" action={() => setStage('claiming')} />
        </View>}
        {stage === 'claiming' && <View style={[s.card, o.card]}>
          <View style={o.cardHeading}>
            <ActivityIndicator color={color.mint} />
            <Label size={16} bold accessibilityLiveRegion="polite">正在领取 AI 权益</Label>
          </View>
          <Skip label="跳过动效" action={() => setStage('events')} />
        </View>}
        {stage === 'events' && <MiyaEventCard selected={selected} update={setSelected}
            next={() => { Keyboard.dismiss(); setStage('configuring'); }}
            skip={() => { Keyboard.dismiss(); setSelected([]); setStage('name'); }} />}
        {stage === 'configuring' && <ServiceProgress events={selected} next={() => setStage('name')} />}
        {stage === 'name' && <DeviceName confirm={name => confirm(name, selected)} />}
      </MiyaTurn>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function MiyaEventCard({ selected, update, next, skip }: {
  selected: readonly string[];
  update: Dispatch<SetStateAction<readonly string[]>>;
  next: () => void;
  skip: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [checkedText, setCheckedText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(2);
  const atLimit = selected.length >= eventLimit;
  const description = draft.trim();
  useEffect(() => {
    if (!description || checkedText === description) return;
    const timer = setTimeout(() => setCheckedText(description), 420);
    return () => clearTimeout(timer);
  }, [checkedText, description]);

  const settled = !!description && checkedText === description;
  const matches = settled ? findMiyaEvents(description) : [];
  const toggle = (event: string) => update(items => items.includes(event)
    ? items.filter(item => item !== event)
    : items.length < eventLimit ? [...items, event] : items);
  const add = (event: string) => update(items => items.length < eventLimit && !items.includes(event) ? [...items, event] : items);

  return <View style={[s.card, o.card]}>
    <View style={o.benefitLine}>
      <Label size={17} bold>选择关注事件</Label>
      <Label size={13} bold tint={mintText} accessibilityLiveRegion="polite">已选 {selected.length} / {eventLimit} 项</Label>
    </View>
    <View style={o.natural}>
      <Label size={13} bold>用一句话描述</Label>
      <TextInput accessibilityLabel="描述关注事件" placeholder="例如：老人摔倒、狗叫"
        placeholderTextColor="#829091" maxLength={80} value={draft} onChangeText={setDraft}
        onBlur={() => setCheckedText(description)} returnKeyType="done" style={o.textInput} />
      {matches.map(({ event, source }) => {
        const alreadySelected = selected.includes(event);
        return <View key={event} style={o.suggestion}>
          <Label size={13} tint={mintText} accessibilityLiveRegion="polite">
            {'检测到已有识别项，替换成【' + event + '】识别效果更准确噢~'}
          </Label>
          <Pressable accessibilityRole="button" disabled={alreadySelected || atLimit}
            accessibilityState={{ disabled: alreadySelected || atLimit }}
            style={[o.suggestionAction, (alreadySelected || atLimit) && o.disabled]}
            onPress={() => {
              const replacement = draft.replace(source, event);
              setDraft(replacement);
              setCheckedText(replacement.trim());
              add(event);
            }}>
            <Label size={13} bold tint={mintText}>{alreadySelected ? '已选 ' + event : '替换为' + event}</Label>
          </Pressable>
        </View>;
      })}
      {settled && matches.length === 0 && <View style={o.suggestion}>
        <Label size={13} tint="#687276">暂未匹配到已有识别项</Label>
        <Pressable accessibilityRole="button" disabled={atLimit || selected.includes(description)}
          accessibilityState={{ disabled: atLimit || selected.includes(description) }}
          style={[o.suggestionAction, (atLimit || selected.includes(description)) && o.disabled]}
          onPress={() => { add(description); setDraft(''); setCheckedText(''); }}>
          <Label size={13} bold tint={mintText}>添加为自定义事件</Label>
        </Pressable>
      </View>}
    </View>
    <Segments labels={categoryLabels} selected={categoryIndex} onChange={setCategoryIndex} equal style={o.tabs} />
    <EventChoices categoryIndex={categoryIndex} selected={selected} toggle={toggle} atLimit={atLimit} />
    {selected.length > 0 && <View style={o.selected}>
      {selected.map(event => <Pressable key={event} accessibilityRole="button" accessibilityLabel={'取消选择' + event}
        onPress={() => toggle(event)} style={o.chip}>
        <Label size={12} tint={mintText} style={o.eventLabel}>{event}</Label><Icon name="close" size={13} tint={mintText} />
      </Pressable>)}
    </View>}
    {atLimit && <Label size={12} tint="#687276">最多选 4 项，取消一项后可以继续选择。</Label>}
    <PrimaryButton label="确认关注事件" disabled={selected.length === 0} action={next} />
    <Skip label="暂不配置" action={skip} />
  </View>;
}

function EventChoices({ categoryIndex, selected, toggle, atLimit, custom = [] }: {
  categoryIndex: number; selected: readonly string[]; toggle: (event: string) => void; atLimit?: boolean; custom?: readonly string[];
}) {
  const category = callAlertCategories[categoryIndex];
  const [collapsed, setCollapsed] = useState<string[]>(['婴儿']);
  const groups = [...category.groups, ...(custom.length ? [{ label: '自定义事件', events: custom }] : [])];
  return <View>
    {groups.map((group, groupIndex) => {
      const expandable = category.groups.length > 1 && group.label !== '自定义事件';
      const expanded = !expandable || !collapsed.includes(group.label);
      return <View key={group.label} style={groupIndex > 0 && o.groupDivider}>
        {expandable && <Pressable accessibilityRole="button" accessibilityLabel={group.label}
          accessibilityState={{ expanded }} aria-expanded={expanded} style={o.groupHeading}
          onPress={() => setCollapsed(items => expanded ? [...items, group.label] : items.filter(item => item !== group.label))}>
          <Label size={13} bold tint={mintText}>{group.label} · {group.events.length} 项</Label>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} tint={mintText} />
        </Pressable>}
        {group.label === '自定义事件' && <Label size={13} bold tint={mintText} style={o.groupHeading}>自定义事件</Label>}
        {expanded && group.events.map((event, index) => {
          const checked = selected.includes(event);
          const disabled = !!atLimit && !checked;
          return <Pressable key={event} accessibilityRole="checkbox" accessibilityLabel={event}
            aria-checked={checked} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => toggle(event)}
            style={({ pressed }) => [o.eventRow, index < group.events.length - 1 && s.divider, (disabled || pressed) && o.disabled]}>
            <Label size={15} bold={checked} style={o.eventLabel}>{event}</Label>
            <View style={[o.check, checked && o.checkOn]}>{checked && <Icon name="checkmark" size={17} tint="#fff" />}</View>
          </Pressable>;
        })}
      </View>;
    })}
  </View>;
}

export function CallAlertPicker({ initial, save }: {
  initial: readonly string[]; save: (events: string[]) => void;
}) {
  const [categoryIndex, setCategoryIndex] = useState(2);
  const [selected, setSelected] = useState(initial);
  const custom = initial.filter(event => !presetCallAlerts.some(preset => preset === event));
  return <View style={s.fill}>
    <View style={o.pickerHeader}>
      <Label size={21} bold>哪些情况需要电话提醒？</Label>
      <Label size={14} tint="#687276">识别到所选事件时，通过微信通话提醒你。</Label>
      <Segments labels={categoryLabels} selected={categoryIndex} onChange={setCategoryIndex} equal style={o.tabs} />
    </View>
    <ScrollView style={s.fill} showsVerticalScrollIndicator={false} contentContainerStyle={o.eventContent}>
      <View style={[s.card, o.eventCard]}>
        <EventChoices categoryIndex={categoryIndex} selected={selected} custom={custom}
          toggle={event => setSelected(items => items.includes(event) ? items.filter(item => item !== event) : [...items, event])} />
      </View>
    </ScrollView>
    <View style={o.footer}>
      <View style={o.pickerSummary}>
        <Label size={14} bold accessibilityLiveRegion="polite">已选 {selected.length} 项</Label>
        <Label size={12} tint="#687276">提醒方式 · 微信通话</Label>
      </View>
      <PrimaryButton label="保存设置" action={() => save([...selected])} />
    </View>
  </View>;
}

function ServiceProgress({ events, next }: { events: readonly string[]; next: () => void }) {
  const [complete, setComplete] = useState(0);
  useEffect(() => {
    const timer = setTimeout(complete === capabilities.length ? next : () => setComplete(complete + 1),
      complete === capabilities.length ? 420 : 480);
    return () => clearTimeout(timer);
  }, [complete, next]);

  return <View style={[s.card, o.card]}>
    <Label size={13} tint="#687276">关注事件 · {events.join('、')}</Label>
    {capabilities.map((name, index) => {
      const finished = index < complete;
      const working = index === complete;
      return <View key={name} style={[o.service, (finished || working) && o.serviceActive]}>
        <Label size={14} style={o.eventLabel}>{name}</Label>
        {working && <ActivityIndicator size="small" color={color.mint} />}
        <Label size={12} bold={finished} tint={finished || working ? mintText : color.muted}>
          {finished ? '已开启' : working ? '开启中' : '待开启'}
        </Label>
      </View>;
    })}
    <Skip label="跳过进度演示" action={next} />
  </View>;
}

export function PairedWelcome({ name, next }: { name: string; next: () => void }) {
  useEffect(() => {
    const timer = setTimeout(next, 2000);
    return () => clearTimeout(timer);
  }, [next]);
  return <View style={o.splash}>
    <Image source={avatar} style={o.splashAvatar} resizeMode="contain" accessibilityLabel="Miya管家" />
    <Label size={28} bold accessibilityRole="header">欢迎使用</Label>
    <Label size={16} tint="#687276" style={o.splashText}>
      你的 <Label size={16} bold>{name}</Label> 已准备就绪。
    </Label>
  </View>;
}

const o = StyleSheet.create({
  header: { height: 51, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  back: { position: 'absolute', left: 8 },
  headerAvatar: { width: 34, height: 34 },
  feed: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 12 },
  badge: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 11, backgroundColor: '#e7eaee', borderRadius: 14 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  messageAvatar: { width: 34, height: 34, marginTop: 3 },
  bubble: { flex: 1, paddingHorizontal: 13, paddingVertical: 10, lineHeight: 23 },
  userBubble: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 13, backgroundColor: mintSurface },
  turn: { gap: 11 },
  card: { padding: 14, gap: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { height: 31, width: 31, borderRadius: 9, backgroundColor: mintSurface, alignItems: 'center', justifyContent: 'center' },
  benefitLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  value: { backgroundColor: mintSurface, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 4 },
  example: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: color.canvas, borderRadius: 11 },
  skip: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  natural: { padding: 10, borderRadius: 10, backgroundColor: color.canvas, gap: 7 },
  textInput: { minHeight: 41, borderRadius: 8, backgroundColor: color.surface, paddingHorizontal: 10, color: color.text, fontSize: 15 },
  suggestion: { padding: 9, backgroundColor: mintSurface, borderRadius: 9, gap: 4 },
  suggestionAction: { minHeight: 31, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 6 },
  tabs: { backgroundColor: '#e7e9ec' },
  groupHeading: { minHeight: 33, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  groupDivider: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth },
  eventRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 5 },
  eventLabel: { flexShrink: 1 },
  disabled: { opacity: 0.55 },
  check: { width: 21, height: 21, borderRadius: 6, borderColor: '#abb5b5', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderColor: color.mint, backgroundColor: color.mint },
  selected: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { maxWidth: '100%', minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, borderRadius: 16, backgroundColor: mintSurface },
  pickerHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 7 },
  eventContent: { paddingHorizontal: 16, paddingBottom: 4 },
  eventCard: { paddingHorizontal: 14, paddingVertical: 4 },
  footer: { paddingHorizontal: 16, paddingVertical: 10 },
  pickerSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 8 },
  service: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 39, paddingHorizontal: 9, gap: 8, borderRadius: 8, backgroundColor: color.canvas },
  serviceActive: { backgroundColor: mintSurface },
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22, gap: 13 },
  splashAvatar: { width: 146, height: 146 },
  splashText: { textAlign: 'center' },
});
