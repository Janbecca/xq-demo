import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { PlaybackSample } from './Camera';
import { media, twoDigits } from './demo';
import { MiyaNoticeCard } from './MiyaNoticeCard';
import { demoReply, scopeName, scopes, type MiyaClip, type MiyaContext, type MiyaMessage, type MiyaNotice, type MiyaNoticeAction, type MiyaScope, type MiyaThread } from './miyaDemo';
import { AssistantSendButton, color, Icon, IconButton, Label, s, SelectionCheck, Sheet, type IconName } from './ui';
import { useMiyaVoice } from './useMiyaVoice';

const destinations = [
  { id: 'miyaTasks', label: '事件配置', icon: 'notifications-outline' },
  { id: 'miyaSummary', label: '事件中心', icon: 'layers-outline' },
  { id: 'miyaHistory', label: '历史记录', icon: 'time-outline' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];
export type MiyaDestination = (typeof destinations)[number]['id'];

const prompts: { text: string; icon: IconName; tint: string }[] = [
  { text: '昨天家里发生了什么？', icon: 'document-text', tint: color.orange },
  { text: '帮我每天下午查看孩子几点到家并通知我', icon: 'person', tint: '#538ef6' },
  { text: '每两分钟帮我查看下门口有没有包裹', icon: 'cube', tint: color.green },
];

export function MiyaScopePicker({ scope, pairedName, onSelect, onClose }: {
  scope: MiyaScope; pairedName: string; onSelect: (scope: MiyaScope) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState(scope);
  return <Sheet title="设备范围" close={onClose} confirm={() => { onSelect(selected); onClose(); }}>
    {scopes.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: selected === item }}
      onPress={() => setSelected(item)} style={[m.pickerRow, s.divider]}>
      <Label>{scopeName(item, pairedName)}</Label>
      <SelectionCheck checked={selected === item} />
    </Pressable>)}
  </Sheet>;
}

export function MiyaClipRow({ clip, pairedName, play }: { clip: MiyaClip; pairedName: string; play?: () => void }) {
  const content = <>
    <Image source={media.frame} style={m.thumbnail} />
    <View style={s.fill}>
      <Label size={15} bold>{clip.title}</Label>
      <Label size={12} tint={color.muted}>{clip.time} · {scopeName(clip.device, pairedName)}</Label>
    </View>
    {play && <Icon name="play-circle-outline" size={23} tint={color.green} />}
  </>;
  return play ? <Pressable accessibilityRole="button" accessibilityLabel={'回看 ' + clip.title} onPress={play} style={m.clip}>
    {content}
  </Pressable> : <View style={m.clip}>{content}</View>;
}

const maxDraftLength = 240;

function MiyaMessages({ messages, pairedName, play }: {
  messages: MiyaMessage[]; pairedName: string; play: (clip: MiyaClip) => void;
}) {
  return messages.map(({ role, text, clip }, index) => <View key={index} style={[m.message, role === 'user' && m.userMessage]}>
    {role === 'miya' && <Image source={media.miya} style={m.smallAvatar} resizeMode="contain" />}
    <View style={[m.bubble, role === 'user' && m.userBubble]}>
      <Label size={15} style={m.messageText}>{text}</Label>
      {clip && <MiyaClipRow clip={clip} pairedName={pairedName} play={() => play(clip)} />}
    </View>
  </View>);
}

function threadTimestamp(createdAt: number) {
  const date = new Date(createdAt);
  return {
    day: `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    time: `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`,
  };
}

export function MiyaChat({ active, pairedName, threads, notices, initialThreadId, initialContext, prefill, initialManageEvent, back, open, save, play, simulateNotice, readNotice }: {
  active: boolean; pairedName: string; threads: MiyaThread[]; notices: MiyaNotice[];
  initialThreadId?: string; initialContext?: MiyaContext; prefill?: string; initialManageEvent?: string;
  back: () => void; open: (screen: MiyaDestination) => void; save: (thread: MiyaThread) => void;
  play: (sample: PlaybackSample) => void; simulateNotice: () => void; readNotice: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState(initialThreadId);
  const [contextOverride, setContextOverride] = useState<MiyaContext>();
  const [draft, setDraft] = useState(prefill ?? '');
  const [manageEvent, setManageEvent] = useState(initialManageEvent);
  const [showFirstNotice, setShowFirstNotice] = useState(true);
  const [retainedNoticeIds, setRetainedNoticeIds] = useState<string[]>([]);
  const [promptsHeight, setPromptsHeight] = useState(0);
  const [choosingScope, setChoosingScope] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [conversationHeight, setConversationHeight] = useState(0);
  const [archiveHeight, setArchiveHeight] = useState(0);
  const [positioned, setPositioned] = useState(false);
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const thread = threads.find(item => item.id === threadId);
  const context = contextOverride ?? thread?.context ?? initialContext ?? { scope: 'all' };
  const messages = thread?.messages ?? [];
  const currentNotices = notices.filter(item => !item.read || retainedNoticeIds.includes(item.id));
  const archive = [
    ...threads.filter(item => item.id !== threadId && item.messages.length > 0),
    ...notices.filter(item => item.read && !retainedNoticeIds.includes(item.id)),
  ].sort((a, b) => a.createdAt - b.createdAt);
  const hasArchive = archive.length > 0;
  const showPrompts = !messages.length || currentNotices.length > 0 || !!manageEvent;
  const currentOffset = showFirstNotice && currentNotices.length ? 0 : Math.max(0, conversationHeight - viewportHeight);
  const latestOffset = (hasArchive ? archiveHeight : 0) + currentOffset;
  const layoutReady = viewportHeight > 0 && conversationHeight >= viewportHeight && (!hasArchive || archiveHeight > 0);

  useEffect(() => {
    if (!active || !layoutReady) return;
    scroll.current?.scrollTo({ y: latestOffset, animated: false });
    const frame = requestAnimationFrame(() => setPositioned(true));
    return () => cancelAnimationFrame(frame);
  }, [active, layoutReady, latestOffset, messages.length, threadId, currentNotices.length]);
  const voice = useMiyaVoice(active, text => {
    setDraft(current => [current.trimEnd(), text].filter(Boolean).join(' ').slice(0, maxDraftLength));
  });
  const listening = voice.status === 'listening';
  const voiceBusy = voice.status !== 'idle';
  const voicePending = voiceBusy && !listening;
  const voiceHint = voice.status === 'starting' ? '正在准备麦克风…' :
    listening ? '正在聆听，点一下结束' :
    voice.status === 'stopping' ? '正在识别…' : voice.message;
  const suggestions = manageEvent
    ? [`不再关注${manageEvent}`, `${manageEvent}时给我推送公众号消息`, `减少${manageEvent}的推送`]
      .map((text, index) => ({ ...prompts[index], text }))
    : prompts;

  function send() {
    const question = draft.trim();
    if (voiceBusy || !question) return;
    const createdAt = Date.now();
    const current = thread ?? { id: 'miya-' + createdAt, title: question.slice(0, 36), createdAt, messages: [] };
    const next: MiyaThread = {
      ...current, context, messages: [...current.messages, { role: 'user', text: question }, demoReply(question, context)],
    };
    setThreadId(next.id);
    setContextOverride(undefined);
    setDraft('');
    setManageEvent(undefined);
    setShowFirstNotice(false);
    save(next);
  }

  function newChat() {
    voice.cancel();
    setThreadId(undefined);
    setDraft('');
    setManageEvent(undefined);
    setShowFirstNotice(true);
    setRetainedNoticeIds([]);
    setContextOverride({ scope: 'all' });
  }

  function toggleMenu() {
    if (!expanded) Keyboard.dismiss();
    setExpanded(!expanded);
  }

  function applyNoticeAction(action: MiyaNoticeAction, notice: MiyaNotice) {
    voice.cancel();
    if (!notice.read) setRetainedNoticeIds(ids => [...ids, notice.id]);
    setDraft(action.draft);
    setManageEvent(action.id === 'manage' ? notice.event : undefined);
  }

  function noticeMessage(notice: MiyaNotice) {
    return <View key={notice.id} style={m.message}>
      <Image source={media.miya} style={m.smallAvatar} resizeMode="contain" accessible={false} />
      <View style={m.noticeMessage}>
        <Label size={12} tint={color.secondaryText}>Miya 管家</Label>
        <MiyaNoticeCard notice={notice} read={readNotice} play={play} openEvents={() => open('miyaTasks')} onAction={applyNoticeAction} />
      </View>
    </View>;
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fill}>
    <View style={[s.header, m.header]}>
      <View style={s.back}><IconButton name="chevron-back" size={24} label="返回" onPress={back} /></View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={toggleMenu} style={s.titleButton}>
        <Image source={media.miya} style={m.headerAvatar} resizeMode="contain" accessible={false} />
        <Label size={18} bold>Miya 管家</Label><Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} />
      </Pressable>
      {thread && <View style={s.headerRight}><IconButton name="add-circle-outline" label="新对话" onPress={newChat} /></View>}
    </View>
    {expanded && <View style={[s.card, m.menu]}>
      {destinations.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item.id)}
        style={({ pressed }) => [m.menuItem, pressed && s.pressed]}>
        <View style={s.mintBadge}><Icon name={item.icon} tint={color.mintText} size={19} /></View>
        <Label size={14}>{item.label}</Label>
      </Pressable>)}
    </View>}
    <View style={m.chatArea}>
      <ScrollView ref={scroll} style={[s.fill, !positioned && m.awaitingLayout]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        onLayout={({ nativeEvent }) => { if (nativeEvent.layout.height > 0) setViewportHeight(nativeEvent.layout.height); }}>
        {hasArchive && <View style={m.chatArchive} onLayout={({ nativeEvent }) => {
          if (nativeEvent.layout.height > 0) setArchiveHeight(nativeEvent.layout.height);
        }}>
          {archive.map(item => {
            if ('event' in item) return noticeMessage(item);
            const { day, time } = threadTimestamp(item.createdAt);
            return <View key={item.id} style={m.chatContent}>
              <Label size={12} tint={color.secondaryText} style={m.archiveTimestamp}>{day} {time}</Label>
              <MiyaMessages messages={item.messages} pairedName={pairedName} play={play} />
            </View>;
          })}
          <View style={m.archiveDivider}>
            <View style={m.archiveLine} />
            <Label size={12} tint={color.secondaryText}>历史记录</Label>
            <View style={m.archiveLine} />
          </View>
        </View>}
        <View style={[m.chatContent, { minHeight: viewportHeight, paddingBottom: 16 + (showPrompts ? promptsHeight : 0) }]}
          onLayout={({ nativeEvent }) => { if (nativeEvent.layout.height > 0) setConversationHeight(nativeEvent.layout.height); }}>
          {currentNotices.map(noticeMessage)}
          {messages.length > 0 && <MiyaMessages messages={messages} pairedName={pairedName} play={play} />}
          {!messages.length && !currentNotices.length && <View style={m.hero}>
            <Image source={media.miya} style={m.avatar} resizeMode="contain" accessibilityLabel="Miya 管家头像" />
            <Label size={21} bold>你好，我是 Miya</Label>
            <Label size={14} tint={color.secondaryText}>有什么想了解的，可以问我。</Label>
          </View>}
        </View>
      </ScrollView>
      {showPrompts && <View pointerEvents="box-none" style={m.prompts}
        onLayout={({ nativeEvent }) => setPromptsHeight(nativeEvent.layout.height)}>
        {suggestions.map(({ text, icon, tint }) => <Pressable key={text} accessibilityRole="button"
          onPress={() => { voice.cancel(); setDraft(text); input.current?.focus(); }} style={({ pressed }) => [m.prompt, pressed && s.pressed]}>
          <Icon name={icon} size={15} tint={tint} /><Label size={14} style={m.promptText}>{text}</Label>
        </Pressable>)}
      </View>}
    </View>
    <View style={m.composer}>
      <View style={[m.context, s.divider]}>
        <Pressable accessibilityRole="button" onPress={() => { voice.cancel(); setChoosingScope(true); }} style={m.scope}>
          <Icon name="videocam-outline" size={15} tint={color.secondaryText} />
          <Label size={13} tint={color.secondaryText} numberOfLines={1} style={m.scopeLabel}>{scopeName(context.scope, pairedName)}</Label>
          <Icon name="chevron-down" size={11} tint={color.secondaryText} />
        </Pressable>
        {context.date && <Label size={11} tint={color.secondaryText} style={m.scopeLabel}>围绕 {context.date}</Label>}
        <Pressable accessibilityRole="button" onPress={() => { setShowFirstNotice(true); simulateNotice(); }} style={({ pressed }) => [m.demoNotice, pressed && s.pressed]}>
          <Icon name="notifications-outline" size={13} tint={color.mintText} />
          <Label size={12} tint={color.mintText}>模拟推送</Label>
        </Pressable>
      </View>
      {!!voiceHint && <Label size={12} tint={voiceBusy ? color.mintText : color.secondaryText}
        accessibilityLiveRegion="polite" style={m.voiceHint}>{voiceHint}</Label>}
      <View style={m.inputRow}>
        <TextInput ref={input} style={m.input} value={draft} onChangeText={setDraft}
          accessibilityLabel="输入消息" placeholder="问问 Miya" placeholderTextColor="#b9bbbf"
          editable={!voiceBusy} maxLength={maxDraftLength} multiline returnKeyType="send" submitBehavior="submit"
          blurOnSubmit={Platform.OS === 'web' ? true : undefined} onSubmitEditing={send} />
        <Pressable accessibilityRole="button" accessibilityLabel={listening ? '结束语音输入' : '语音输入'}
          accessibilityState={{ disabled: voicePending, busy: voicePending }} disabled={voicePending}
          onPress={() => { if (!voiceBusy) Keyboard.dismiss(); void voice.toggle(); }}
          style={({ pressed }) => [m.voiceButton, voiceBusy && m.voiceActive, pressed && s.pressed]}>
          {voicePending ? <ActivityIndicator size="small" color={color.mintText} />
            : <Icon name={listening ? 'stop' : 'mic-outline'} tint={listening ? color.mintText : color.secondaryText} size={20} />}
        </Pressable>
        <AssistantSendButton label="发送" onPress={send} disabled={voiceBusy || !draft.trim()} />
      </View>
    </View>
    {choosingScope && <MiyaScopePicker pairedName={pairedName} scope={context.scope}
      onSelect={scope => setContextOverride({ ...context, scope })} onClose={() => setChoosingScope(false)} />}
  </KeyboardAvoidingView>;
}

export function MiyaHistory({ threads, pairedName, open, newChat }: {
  threads: MiyaThread[]; pairedName: string; open: (thread: MiyaThread) => void; newChat: () => void;
}) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<MiyaScope>('all');
  const [choosingScope, setChoosingScope] = useState(false);
  const search = query.trim().toLowerCase();
  const items = threads.filter(thread => (scope === 'all' || thread.context.scope === scope) &&
    (!search || thread.messages.some(message => message.text.toLowerCase().includes(search))));
  let lastDate = '';
  return <View style={s.fill}>
    <View style={m.historyBar}>
      <Pressable accessibilityRole="button" style={[m.scope, m.historyFilter]} onPress={() => setChoosingScope(true)}>
        <Label size={14}>{scopeName(scope, pairedName)}</Label><Icon name="chevron-down" size={13} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={newChat} style={m.scope}>
        <Icon name="add-circle-outline" size={18} tint={color.mintText} /><Label size={14} tint={color.mintText}>新对话</Label>
      </Pressable>
    </View>
    <View style={m.search}>
      <Icon name="search-outline" size={18} tint={color.muted} />
      <TextInput style={m.searchInput} accessibilityLabel="搜索历史记录" placeholder="搜索历史记录" placeholderTextColor={color.muted}
        value={query} onChangeText={setQuery} returnKeyType="search" />
    </View>
    <ScrollView contentContainerStyle={m.historyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {!items.length && <Label size={14} tint={color.muted} style={m.empty}>{search ? '没有匹配的对话记录' : '暂无对话记录'}</Label>}
      {items.map(thread => {
        const { day, time } = threadTimestamp(thread.createdAt);
        const showDate = day !== lastDate;
        lastDate = day;
        return <View key={thread.id}>
          {showDate && <Label size={13} tint={color.secondaryText} style={m.historyDay}>{day}</Label>}
          <Pressable accessibilityRole="button" onPress={() => open(thread)} style={[s.card, m.thread]}>
            <View style={s.mintBadge}><Icon name="chatbubble-ellipses-outline" size={18} tint={color.mintText} /></View>
            <View style={s.fill}>
              <Label bold size={15} numberOfLines={1}>{thread.title}</Label>
              <Label size={12} tint={color.muted} numberOfLines={1}>{thread.messages.at(-1)?.text}</Label>
            </View>
            <Label size={12} tint={color.secondaryText}>{time}</Label>
            <Icon name="chevron-forward" size={15} tint={color.muted} />
          </Pressable>
        </View>;
      })}
    </ScrollView>
    {choosingScope && <MiyaScopePicker pairedName={pairedName} scope={scope} onSelect={setScope} onClose={() => setChoosingScope(false)} />}
  </View>;
}

const m = StyleSheet.create({
  header: { height: 51 },
  headerAvatar: { width: 34, height: 34 },
  menu: { flexDirection: 'row', marginHorizontal: 16, paddingVertical: 8 },
  menuItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 64, gap: 5 },
  chatArea: { flex: 1, minHeight: 0 },
  chatContent: { padding: 16, gap: 12 },
  awaitingLayout: { opacity: 0 },
  chatArchive: { marginHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 12 },
  archiveDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  archiveLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#d7dadd' },
  archiveTimestamp: { textAlign: 'center' },
  hero: { flex: 1, minHeight: 184, alignItems: 'center', justifyContent: 'center', gap: 6 },
  avatar: { width: 146, height: 146, marginBottom: 3 },
  prompts: { position: 'absolute', right: 16, left: 16, bottom: 0, gap: 7, alignItems: 'flex-start', paddingBottom: 8 },
  prompt: { backgroundColor: 'rgba(214,224,231,0.68)', borderRadius: 18, minHeight: 34, maxWidth: '100%',
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 6 },
  promptText: { flexShrink: 1 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noticeMessage: { flex: 1, minWidth: 0, gap: 4 },
  userMessage: { justifyContent: 'flex-end' },
  smallAvatar: { width: 34, height: 34, marginTop: 3 },
  bubble: { backgroundColor: color.surface, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, maxWidth: '85%', flexShrink: 1 },
  userBubble: { backgroundColor: color.mintSurface },
  messageText: { lineHeight: 23 },
  composer: { marginHorizontal: 16, marginTop: 4, marginBottom: 9, paddingHorizontal: 16, borderRadius: 25, backgroundColor: color.surface },
  inputRow: { flexDirection: 'row', alignItems: 'center', minHeight: 51, gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 43, maxHeight: 98, color: color.text, fontSize: 17, paddingVertical: 8, textAlignVertical: 'center' },
  voiceButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  voiceActive: { backgroundColor: color.mintSurface },
  voiceHint: { paddingTop: 7 },
  context: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  demoNotice: { flexDirection: 'row', alignItems: 'center', minHeight: 35, gap: 4 },
  scope: { flexDirection: 'row', alignItems: 'center', minHeight: 35, gap: 5, flexShrink: 1 },
  scopeLabel: { flexShrink: 1 },
  pickerRow: { minHeight: 49, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 },
  clip: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 59, paddingVertical: 7 },
  thumbnail: { width: 60, height: 39, borderRadius: 7 },
  historyBar: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginVertical: 9, gap: 10 },
  historyFilter: { paddingHorizontal: 12, borderRadius: 18, backgroundColor: color.surface },
  search: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 16, paddingHorizontal: 14,
    minHeight: 44, borderRadius: 23, backgroundColor: color.surface },
  searchInput: { flex: 1, minWidth: 0, color: color.text, fontSize: 15, paddingVertical: 8 },
  historyContent: { padding: 16, gap: 8 },
  historyDay: { marginBottom: 7, marginLeft: 10 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 11, minHeight: 64 },
  empty: { textAlign: 'center', padding: 20 },
});
