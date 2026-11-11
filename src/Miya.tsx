import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { PlaybackSample } from './Camera';
import { media, twoDigits } from './demo';
import { MiyaNoticeCard } from './MiyaNoticeCard';
import { MiyaTaskChangeCard } from './MiyaNotifications';
import { defaultTask, demoReply, scopeName, scopes, type MiyaClip, type MiyaContext, type MiyaMessage, type MiyaNotice, type MiyaScope, type MiyaTask, type MiyaThread } from './miyaDemo';
import { interpretTaskRequest, linkedNoticeTask } from './miyaTaskIntent';
import { AssistantSendButton, color, Icon, IconButton, Label, s, SelectionCheck, Sheet, type IconName } from './ui';
import { useMiyaVoice } from './useMiyaVoice';

const destinations = [
  { id: 'miyaTasks', label: '事件配置', icon: 'notifications-outline' },
  { id: 'miyaSummary', label: '今日总结', icon: 'layers-outline' },
  { id: 'miyaNotices', label: '事件通知', icon: 'mail-unread-outline' },
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

function MiyaMessages({ thread, pairedName, play, savedEvents, resolveChange, onLastChangeLayout }: {
  thread: MiyaThread; pairedName: string; play: (clip: MiyaClip) => void; savedEvents: readonly string[];
  resolveChange: (threadId: string, index: number, confirmed?: MiyaTask) => void;
  onLastChangeLayout?: (y: number) => void;
}) {
  return thread.messages.map(({ role, text, clip, taskChange }, index) => <View key={index} style={[m.message, role === 'user' && m.userMessage]}
    onLayout={taskChange && index === thread.messages.length - 1 && onLastChangeLayout
      ? ({ nativeEvent }) => onLastChangeLayout(nativeEvent.layout.y) : undefined}>
    {role === 'miya' && <Image source={media.miya} style={m.smallAvatar} resizeMode="contain" />}
    {taskChange ? <View style={m.noticeMessage}>
      {!!text && <Label size={13} tint={color.secondaryText} style={m.messageText}>{text}</Label>}
      <MiyaTaskChangeCard change={taskChange} initiallyExpanded={!!(onLastChangeLayout && taskChange.expanded)} savedEvents={savedEvents}
        confirm={task => resolveChange(thread.id, index, task)} cancel={() => resolveChange(thread.id, index)} />
    </View> : <View style={[m.bubble, role === 'user' && m.userBubble]}>
      <Label size={15} style={m.messageText}>{text}</Label>
      {clip && <MiyaClipRow clip={clip} pairedName={pairedName} play={() => play(clip)} />}
    </View>}
  </View>);
}

function threadTimestamp(createdAt: number) {
  const date = new Date(createdAt);
  return {
    day: `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    time: `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`,
  };
}

export function MiyaChat({ active, pairedName, threads, notices, tasks, initialContext, prefill, back, open, save, play, simulateNotice, readNotice, resolveChange }: {
  active: boolean; pairedName: string; threads: MiyaThread[]; notices: MiyaNotice[]; tasks: MiyaTask[];
  initialContext?: MiyaContext; prefill?: string;
  back: () => void; open: (screen: MiyaDestination) => void; save: (thread: MiyaThread) => void;
  play: (sample: PlaybackSample) => void; simulateNotice: () => void; readNotice: (id: string) => void;
  resolveChange: (threadId: string, index: number, confirmed?: MiyaTask) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const [contextOverride, setContextOverride] = useState<MiyaContext>();
  const [draft, setDraft] = useState(prefill ?? '');
  const [addingEvent, setAddingEvent] = useState(false);
  const [showFirstNotice, setShowFirstNotice] = useState(true);
  const [retainedNoticeIds, setRetainedNoticeIds] = useState<string[]>([]);
  const [promptsHeight, setPromptsHeight] = useState(0);
  const [choosingScope, setChoosingScope] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [conversationHeight, setConversationHeight] = useState(0);
  const [archiveHeight, setArchiveHeight] = useState(0);
  const [positioned, setPositioned] = useState(false);
  const [changePosition, setChangePosition] = useState<{ key: string; y: number }>();
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const lastScroll = useRef<{ reason: string; archiveHeight: number } | undefined>(undefined);
  const thread = threads.find(item => item.id === threadId);
  const context = contextOverride ?? thread?.context ?? initialContext ?? { scope: 'all' };
  const messages = thread?.messages ?? [];
  const savedEvents = tasks.flatMap(task => task.events);
  const latestChange = messages.at(-1)?.taskChange;
  const changeKey = latestChange ? `${threadId}-${messages.length}` : undefined;
  const currentNotices = notices.filter(item => !item.read || retainedNoticeIds.includes(item.id));
  const archive = [
    ...threads.filter(item => item.id !== threadId && item.messages.length > 0),
    ...notices.filter(item => item.read && !retainedNoticeIds.includes(item.id)),
  ].sort((a, b) => a.createdAt - b.createdAt);
  const hasArchive = archive.length > 0;
  const showPrompts = latestChange?.status !== 'pending' && (!messages.length || currentNotices.length > 0);
  const showNoticeFirst = showFirstNotice && currentNotices.length > 0;
  const changeOffset = !showNoticeFirst && changeKey && changePosition?.key === changeKey ? changePosition.y : undefined;
  const latestOffset = (hasArchive ? archiveHeight : 0) + (showNoticeFirst ? 0 : changeOffset ?? Math.max(0, conversationHeight - viewportHeight));
  const scrollReason = `${threadId}-${messages.length}-${currentNotices.length}-${viewportHeight}-${showNoticeFirst}`;
  const layoutReady = viewportHeight > 0 && conversationHeight >= viewportHeight && (!hasArchive || archiveHeight > 0);

  useEffect(() => {
    if (!active || !layoutReady) return;
    if (changeKey && !showNoticeFirst && changeOffset === undefined) return;
    const previous = lastScroll.current;
    lastScroll.current = { reason: scrollReason, archiveHeight };
    if (previous?.reason === scrollReason && scrollY.current < previous.archiveHeight - 2) return;
    scroll.current?.scrollTo({ y: latestOffset, animated: false });
    const frame = requestAnimationFrame(() => setPositioned(true));
    return () => cancelAnimationFrame(frame);
  }, [active, layoutReady, latestOffset, archiveHeight, scrollReason, changeKey, changeOffset, showNoticeFirst]);
  const voice = useMiyaVoice(active, text => {
    setDraft(current => [current.trimEnd(), text].filter(Boolean).join(' ').slice(0, maxDraftLength));
  });
  const listening = voice.status === 'listening';
  const voiceBusy = voice.status !== 'idle';
  const voicePending = voiceBusy && !listening;
  const voiceHint = voice.status === 'starting' ? '正在准备麦克风…' :
    listening ? '正在聆听，点一下结束' :
    voice.status === 'stopping' ? '正在识别…' : voice.message;

  function appendMessages(title: string, newMessages: MiyaMessage[], createdAt = Date.now()) {
    const current = thread ?? { id: 'miya-' + createdAt, title: title.slice(0, 36), createdAt, messages: [] };
    save({ ...current, context, messages: [...current.messages, ...newMessages] });
    setThreadId(current.id);
    setContextOverride(undefined);
    setShowFirstNotice(false);
  }

  function send() {
    const question = draft.trim();
    if (voiceBusy || !question) return;
    const createdAt = Date.now();
    const request = interpretTaskRequest(question, tasks, 'task-chat-' + createdAt, addingEvent);
    const reply: MiyaMessage = request ? { role: 'miya', ...request } : demoReply(question, context);
    appendMessages(question, [{ role: 'user', text: question }, reply], createdAt);
    setDraft('');
    if (!request || request.taskChange) setAddingEvent(false);
  }

  function newChat() {
    voice.cancel();
    setThreadId(undefined);
    setDraft('');
    setAddingEvent(false);
    setShowFirstNotice(true);
    setRetainedNoticeIds([]);
    setContextOverride({ scope: 'all' });
  }

  function toggleMenu() {
    if (!expanded) Keyboard.dismiss();
    setExpanded(!expanded);
  }

  function retainNotice(notice: MiyaNotice) {
    if (!notice.read) setRetainedNoticeIds(ids => [...ids, notice.id]);
  }

  function addNoticeEvent(notice: MiyaNotice) {
    voice.cancel();
    retainNotice(notice);
    setDraft('我想关注：');
    setAddingEvent(true);
  }

  function manageNotice(notice: MiyaNotice) {
    voice.cancel();
    Keyboard.dismiss();
    retainNotice(notice);
    const linked = linkedNoticeTask(tasks, notice);
    const task = linked ?? { ...defaultTask, id: 'task-' + notice.id, events: [notice.event] };
    appendMessages(notice.event, [{ role: 'miya', text: '', taskChange: {
      task, status: 'pending', kind: linked ? 'edit' : 'add', noticeId: notice.id, expanded: true,
    } }]);
  }

  function noticeMessage(notice: MiyaNotice) {
    return <View key={notice.id} style={m.message}>
      <Image source={media.miya} style={m.smallAvatar} resizeMode="contain" accessible={false} />
      <View style={m.noticeMessage}>
        <Label size={12} tint={color.secondaryText}>Miya 管家</Label>
        <MiyaNoticeCard notice={notice} controls={{
          read: readNotice, play, addEvent: addNoticeEvent,
          manage: manageNotice,
        }} />
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
        onScroll={({ nativeEvent }) => { scrollY.current = nativeEvent.contentOffset.y; }} scrollEventThrottle={16}
        onLayout={({ nativeEvent }) => { if (nativeEvent.layout.height > 0) setViewportHeight(nativeEvent.layout.height); }}>
        {hasArchive && <View style={m.chatArchive} onLayout={({ nativeEvent }) => {
          if (nativeEvent.layout.height > 0) setArchiveHeight(nativeEvent.layout.height);
        }}>
          {archive.map(item => {
            if ('event' in item) return noticeMessage(item);
            const { day, time } = threadTimestamp(item.createdAt);
            return <View key={item.id} style={m.chatContent}>
              <Label size={12} tint={color.secondaryText} style={m.archiveTimestamp}>{day} {time}</Label>
              <MiyaMessages thread={item} pairedName={pairedName} play={play} savedEvents={savedEvents} resolveChange={resolveChange} />
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
          {thread && <MiyaMessages thread={thread} pairedName={pairedName} play={play} savedEvents={savedEvents} resolveChange={resolveChange}
            onLastChangeLayout={changeKey ? y => setChangePosition(previous =>
              previous?.key === changeKey && previous.y === y ? previous : { key: changeKey, y }) : undefined} />}
          {!messages.length && !currentNotices.length && <View style={m.hero}>
            <Image source={media.miya} style={m.avatar} resizeMode="contain" accessibilityLabel="Miya 管家头像" />
            <Label size={21} bold>你好，我是 Miya</Label>
            <Label size={14} tint={color.secondaryText}>有什么想了解的，可以问我。</Label>
          </View>}
        </View>
      </ScrollView>
      {showPrompts && <View pointerEvents="box-none" style={m.prompts}
        onLayout={({ nativeEvent }) => setPromptsHeight(nativeEvent.layout.height)}>
        {prompts.map(({ text, icon, tint }) => <Pressable key={text} accessibilityRole="button"
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
});
