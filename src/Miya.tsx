import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { PlaybackSample } from './Camera';
import { media, twoDigits } from './demo';
import { MiyaFunctionMenu, MiyaLivePreview, type MiyaDestination } from './MiyaHome';
import { MiyaNoticeCard } from './MiyaNoticeCard';
import { MiyaTaskChangeCard } from './MiyaNotifications';
import { defaultTask, demoReply, scopeName, scopes, type MiyaClip, type MiyaContext, type MiyaMessage, type MiyaNotice, type MiyaScope, type MiyaTask, type MiyaThread } from './miyaDemo';
import { interpretTaskRequest, linkedNoticeTask } from './miyaTaskIntent';
import { AssistantSendButton, color, Icon, IconButton, Label, s, SelectionCheck, Sheet, type IconName } from './ui';
import { useMiyaVoice } from './useMiyaVoice';

const prompts: { text: string; icon: IconName; tint: string }[] = [
  { text: '昨天家里发生了什么？', icon: 'document-text', tint: color.orange },
  { text: '帮我每天下午查看孩子几点到家并通知我', icon: 'person', tint: '#538ef6' },
  { text: '每两分钟帮我查看下门口有没有包裹', icon: 'cube', tint: color.green },
];
const homePrompts: typeof prompts = [
  { text: '帮我回顾一下昨天家里的情况', icon: 'document-text-outline', tint: color.mintText },
  { text: '帮我查一下昨天老人吃饭的画面', icon: 'search-outline', tint: color.mintText },
  { text: '帮我关注门口有没有包裹', icon: 'cube-outline', tint: color.mintText },
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

function ChatBubble({ children, user, card, onLayout }: {
  children: ReactNode; user?: boolean; card?: boolean; onLayout?: (y: number) => void;
}) {
  return <View style={[m.bubble, user && m.userBubble, card ? m.cardBubble : m.textBubble]}
    onLayout={onLayout && (({ nativeEvent }) => onLayout(nativeEvent.layout.y))}>
    <View pointerEvents="none" style={[m.bubbleTail, user && m.userTail]} />
    {children}
  </View>;
}

function MiyaMessages({ thread, pairedName, play, savedEvents, resolveChange, onLastChangeLayout }: {
  thread: MiyaThread; pairedName: string; play: (clip: MiyaClip) => void; savedEvents: readonly string[];
  resolveChange: (threadId: string, index: number, confirmed?: MiyaTask) => void;
  onLastChangeLayout?: (y: number) => void;
}) {
  return thread.messages.map(({ role, text, clip, taskChange }, index) => <ChatBubble key={index} user={role === 'user'} card={!!(taskChange || clip)}
    onLayout={taskChange && index === thread.messages.length - 1 ? onLastChangeLayout : undefined}>
    {!!text && <Label size={15} style={[m.messageText, (taskChange || clip) && m.cardIntro]}>{text}</Label>}
    {taskChange && <MiyaTaskChangeCard change={taskChange} initiallyExpanded={!!(onLastChangeLayout && taskChange.expanded)} savedEvents={savedEvents}
      confirm={task => resolveChange(thread.id, index, task)} cancel={() => resolveChange(thread.id, index)} />}
    {clip && <View style={m.clipBubble}>
      <MiyaClipRow clip={clip} pairedName={pairedName} play={() => play(clip)} />
    </View>}
  </ChatBubble>);
}

function threadTimestamp(createdAt: number) {
  const date = new Date(createdAt);
  return {
    day: `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    time: `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`,
  };
}

export function MiyaChat({ active, pairedName, threads, notices, tasks, initialContext, prefill, back, open, openLive, openSettings, save, play, simulateNotice, readNotice, resolveChange }: {
  active: boolean; pairedName: string; threads: MiyaThread[]; notices: MiyaNotice[]; tasks: MiyaTask[];
  initialContext?: MiyaContext; prefill?: string;
  back?: () => void; open: (screen: MiyaDestination) => void;
  openLive: () => void; openSettings: () => void;
  save: (thread: MiyaThread) => void;
  play: (sample: PlaybackSample) => void; simulateNotice: () => void; readNotice: (id: string) => void;
  resolveChange: (threadId: string, index: number, confirmed?: MiyaTask) => void;
}) {
  const home = !back;
  const [expanded, setExpanded] = useState(false);
  const [textMode, setTextMode] = useState(!home);
  const [threadId, setThreadId] = useState<string>();
  const [contextOverride, setContextOverride] = useState<MiyaContext>();
  const [draft, setDraft] = useState(prefill ?? '');
  const [addingEvent, setAddingEvent] = useState(false);
  const [showFirstNotice, setShowFirstNotice] = useState(true);
  const [retainedNoticeIds, setRetainedNoticeIds] = useState<string[]>([]);
  const [hasSentSinceOpening, setHasSentSinceOpening] = useState(false);
  const [promptsHeight, setPromptsHeight] = useState(0);
  const [choosingScope, setChoosingScope] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [conversationHeight, setConversationHeight] = useState(0);
  const [archiveHeight, setArchiveHeight] = useState(0);
  const [positioned, setPositioned] = useState(false);
  const [changePosition, setChangePosition] = useState<{ key: string; y: number }>();
  const input = useRef<TextInput>(null);
  const holdingVoice = useRef(false);
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
  const showPrompts = !hasSentSinceOpening;
  const showNoticeFirst = showFirstNotice && currentNotices.length > 0;
  const changeOffset = !showNoticeFirst && changeKey && changePosition?.key === changeKey ? changePosition.y : undefined;
  const latestOffset = (hasArchive ? archiveHeight : 0) + (showNoticeFirst ? 0 : changeOffset ?? Math.max(0, conversationHeight - viewportHeight));
  const scrollReason = `${threadId}-${messages.length}-${currentNotices.length}-${viewportHeight}-${showNoticeFirst}`;
  const layoutReady = viewportHeight > 0 && conversationHeight > 0 && (!hasArchive || archiveHeight > 0);

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
  useEffect(() => {
    if (active) return;
    setHasSentSinceOpening(false);
    setRetainedNoticeIds([]);
  }, [active]);
  useEffect(() => {
    if (!active || !expanded) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setExpanded(false);
      return true;
    });
    return () => subscription.remove();
  }, [active, expanded]);
  const voice = useMiyaVoice(active, text => {
    setDraft(current => [current.trimEnd(), text].filter(Boolean).join(' ').slice(0, maxDraftLength));
    if (home) setTextMode(true);
  });
  const listening = voice.status === 'listening';
  const voiceBusy = voice.status !== 'idle';
  const voicePending = voiceBusy && !listening;
  const voiceHint = voice.status === 'starting' ? '正在准备麦克风…' :
    listening ? (holdingVoice.current ? '正在聆听，松开结束' : '正在聆听，点一下结束') :
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
    setHasSentSinceOpening(true);
    setDraft('');
    if (!request || request.taskChange) setAddingEvent(false);
  }

  function toggleMenu() {
    if (!expanded) Keyboard.dismiss();
    setExpanded(!expanded);
  }

  function fillDraft(text: string) {
    voice.cancel();
    setExpanded(false);
    setDraft(text);
    setTextMode(true);
    input.current?.focus();
  }

  function simulate() {
    setExpanded(false);
    setShowFirstNotice(true);
    simulateNotice();
  }

  function retainNotice(notice: MiyaNotice) {
    if (!notice.read) setRetainedNoticeIds(ids => [...ids, notice.id]);
  }

  function addNoticeEvent(notice?: MiyaNotice) {
    if (notice) retainNotice(notice);
    fillDraft('我想关注：');
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

  function noticeMessage(notice: MiyaNotice, onHome = false) {
    return <ChatBubble key={notice.id} card>
      <MiyaNoticeCard notice={notice} showMenu={!onHome} inBubble controls={{ read: readNotice, play, addEvent: addNoticeEvent, manage: manageNotice }} />
    </ChatBubble>;
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fill}>
    {home ? <MiyaLivePreview deviceName={pairedName} openLive={() => { setExpanded(false); openLive(); }}
      openSettings={() => { setExpanded(false); openSettings(); }} /> : <View style={[s.header, m.header]}>
      <View style={s.back}><IconButton name="chevron-back" size={24} label="返回" onPress={back} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Miya 管家" accessibilityHint={expanded ? '收起功能面板' : '展开功能面板'}
        aria-expanded={expanded} accessibilityState={{ expanded }} onPress={toggleMenu} style={[s.titleButton, m.titleButton]}>
        <Image source={media.miya} style={m.headerAvatar} resizeMode="contain" accessible={false} />
        <View style={m.titleCopy}>
          <Label size={18} bold>Miya 管家</Label>
          <Label size={11} tint={color.secondaryText} numberOfLines={1}>{pairedName}</Label>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} tint={color.secondaryText} />
      </Pressable>
      <View style={s.headerRight}>
        <IconButton name="settings-outline" size={22} label="设置" onPress={() => { setExpanded(false); openSettings(); }} />
      </View>
    </View>}
    <View style={m.chatArea}>
      {home && <View style={m.homeChatHeader}>
        <Image source={media.miya} style={m.headerAvatar} resizeMode="contain" accessible={false} />
        <Label size={15} bold>Miya 管家</Label>
      </View>}
      <ScrollView ref={scroll} style={[s.fill, !positioned && m.awaitingLayout]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        accessibilityElementsHidden={expanded} importantForAccessibility={expanded ? 'no-hide-descendants' : 'auto'} aria-hidden={expanded}
        onScroll={({ nativeEvent }) => { scrollY.current = nativeEvent.contentOffset.y; }} scrollEventThrottle={16}
        onLayout={({ nativeEvent }) => { if (nativeEvent.layout.height > 0) setViewportHeight(nativeEvent.layout.height); }}>
        {hasArchive && <View style={m.chatArchive} onLayout={({ nativeEvent }) => {
          if (nativeEvent.layout.height > 0) setArchiveHeight(nativeEvent.layout.height);
        }}>
          {archive.map(item => {
            if ('event' in item) return noticeMessage(item, home);
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
        <View style={[m.chatContent, home && m.homeChatContent, { minHeight: viewportHeight, paddingBottom: home ? 8 : 16 + (showPrompts ? promptsHeight : 0) }]}
          onLayout={({ nativeEvent }) => { if (nativeEvent.layout.height > 0) setConversationHeight(nativeEvent.layout.height); }}>
          {currentNotices.map(notice => noticeMessage(notice, home))}
          {home && showNoticeFirst && <Pressable accessibilityRole="button" onPress={() => addNoticeEvent()}
            style={({ pressed }) => [m.prompt, pressed && s.pressed]}>
            <Icon name="add" size={18} tint={color.mintText} /><Label size={14}>我还想关注其他事件</Label>
          </Pressable>}
          {thread && <MiyaMessages thread={thread} pairedName={pairedName} play={play} savedEvents={savedEvents} resolveChange={resolveChange}
            onLastChangeLayout={changeKey ? y => setChangePosition(previous =>
              previous?.key === changeKey && previous.y === y ? previous : { key: changeKey, y }) : undefined} />}
          {!messages.length && !currentNotices.length && <View style={m.hero}>
            <Label size={14} tint={color.secondaryText}>有什么想了解的，可以问我。</Label>
          </View>}
        </View>
      </ScrollView>
      {showPrompts && <View pointerEvents="box-none" style={home ? m.homePrompts : m.prompts} aria-hidden={expanded}
        onLayout={home ? undefined : ({ nativeEvent }) => setPromptsHeight(nativeEvent.layout.height)}>
        {(home ? homePrompts : prompts).map(({ text, icon, tint }) => <Pressable key={text} accessibilityRole="button"
          onPress={() => { setAddingEvent(false); fillDraft(text); }} style={({ pressed }) => [m.prompt, pressed && s.pressed]}>
          <Icon name={icon} size={15} tint={tint} /><Label size={14} style={m.promptText}>{text}</Label>
        </Pressable>)}
      </View>}
      {expanded && <MiyaFunctionMenu close={() => setExpanded(false)} hasUnread={notices.some(notice => !notice.read)}
        open={destination => { setExpanded(false); open(destination); }}
        openLive={home ? undefined : () => { setExpanded(false); openLive(); }}
        onScope={home ? () => { setExpanded(false); voice.cancel(); setChoosingScope(true); } : undefined}
        onSimulate={home ? simulate : undefined} />}
    </View>
    <View style={home ? m.homeComposer : m.composer}>
      {!home && <View style={[m.context, s.divider]}>
        <Pressable accessibilityRole="button" onPress={() => { voice.cancel(); setChoosingScope(true); }} style={m.scope}>
          <Icon name="videocam-outline" size={15} tint={color.secondaryText} />
          <Label size={13} tint={color.secondaryText} numberOfLines={1} style={m.scopeLabel}>{scopeName(context.scope, pairedName)}</Label>
          <Icon name="chevron-down" size={11} tint={color.secondaryText} />
        </Pressable>
        {context.date && <Label size={11} tint={color.secondaryText} style={m.scopeLabel}>围绕 {context.date}</Label>}
        <Pressable accessibilityRole="button" onPress={simulate} style={({ pressed }) => [m.demoNotice, pressed && s.pressed]}>
          <Icon name="notifications-outline" size={13} tint={color.mintText} />
          <Label size={12} tint={color.mintText}>模拟推送</Label>
        </Pressable>
      </View>}
      {!!voiceHint && <Label size={12} tint={voiceBusy ? color.mintText : color.secondaryText}
        accessibilityLiveRegion="polite" style={m.voiceHint}>{voiceHint}</Label>}
      <View style={home ? m.homeControls : m.inputRow}>
        {home && <Pressable accessibilityRole="button" onPress={() => {
          setExpanded(false);
          voice.cancel();
          if (textMode) Keyboard.dismiss();
          setTextMode(value => !value);
        }} style={({ pressed }) => [m.homeControl, pressed && s.pressed]}>
          <Icon name={textMode ? 'mic-outline' : 'chatbox-outline'} tint={color.secondaryText} />
          <Label size={11} tint={color.secondaryText}>{textMode ? '语音' : '文字'}</Label>
        </Pressable>}
        {home && !textMode ? <Pressable accessibilityRole="button" accessibilityLabel={listening ? '结束语音输入' : '按住说话'}
          onLongPress={() => { setExpanded(false); holdingVoice.current = true; void voice.start(); }} delayLongPress={220}
          onPressOut={() => { if (holdingVoice.current) { holdingVoice.current = false; voice.stop(); } }}
          onPress={() => { setExpanded(false); void voice.toggle(); }}
          style={({ pressed }) => [m.holdVoice, (pressed || voiceBusy) && m.holdingVoice]}>
          {voicePending ? <ActivityIndicator size="small" color={color.mintText} /> : <Icon name={listening ? 'stop' : 'mic-outline'} size={20} tint={color.mintText} />}
          <Label size={16} bold tint={color.mintText}>{listening ? '正在听' : '按住说话'}</Label>
        </Pressable> : <View style={[m.inputRow, home && m.homeTextRow]}>
          <TextInput ref={input} style={m.input} value={draft} onChangeText={setDraft} autoFocus={home}
            accessibilityLabel="输入消息" placeholder="问问 Miya" placeholderTextColor="#b9bbbf"
            editable={!voiceBusy} maxLength={maxDraftLength} multiline returnKeyType="send" submitBehavior="submit"
            onFocus={() => setExpanded(false)} blurOnSubmit={Platform.OS === 'web' ? true : undefined} onSubmitEditing={send} />
          {!home && <Pressable accessibilityRole="button" accessibilityLabel={listening ? '结束语音输入' : '语音输入'}
            accessibilityState={{ disabled: voicePending, busy: voicePending }} disabled={voicePending}
            onPress={() => { if (!voiceBusy) Keyboard.dismiss(); void voice.toggle(); }}
            style={({ pressed }) => [m.voiceButton, voiceBusy && m.voiceActive, pressed && s.pressed]}>
            {voicePending ? <ActivityIndicator size="small" color={color.mintText} />
              : <Icon name={listening ? 'stop' : 'mic-outline'} tint={listening ? color.mintText : color.secondaryText} size={20} />}
          </Pressable>}
          <AssistantSendButton label="发送" onPress={send} disabled={voiceBusy || !draft.trim()} />
        </View>}
        {home && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={toggleMenu}
          style={({ pressed }) => [m.homeControl, pressed && s.pressed]}>
          <Icon name="person-circle-outline" tint={expanded ? color.mintText : color.secondaryText} size={25} />
          <Label size={11} tint={expanded ? color.mintText : color.secondaryText}>我的</Label>
          {notices.some(notice => !notice.read) && <View pointerEvents="none" style={m.homeUnread} />}
        </Pressable>}
      </View>
    </View>
    {choosingScope && <MiyaScopePicker pairedName={pairedName} scope={context.scope}
      onSelect={scope => setContextOverride({ ...context, scope })} onClose={() => setChoosingScope(false)} />}
  </KeyboardAvoidingView>;
}

const m = StyleSheet.create({
  header: { height: 58 },
  headerAvatar: { width: 34, height: 34 },
  titleButton: { gap: 7, minHeight: 48 },
  titleCopy: { flexShrink: 1 },
  chatArea: { flex: 1, minHeight: 0 },
  homeChatHeader: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 39 },
  chatContent: { padding: 16, gap: 12 },
  homeChatContent: { paddingTop: 7, gap: 10 },
  awaitingLayout: { opacity: 0 },
  chatArchive: { marginHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 12 },
  archiveDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  archiveLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#d7dadd' },
  archiveTimestamp: { textAlign: 'center' },
  hero: { flex: 1, minHeight: 184, alignItems: 'center', justifyContent: 'center', gap: 6 },
  prompts: { position: 'absolute', right: 16, left: 16, bottom: 0, gap: 7, alignItems: 'flex-start', paddingBottom: 8 },
  homePrompts: { marginHorizontal: 16, gap: 6, alignItems: 'flex-start', paddingTop: 6, paddingBottom: 10 },
  prompt: { backgroundColor: 'rgba(214,224,231,0.68)', borderRadius: 18, minHeight: 34, maxWidth: '100%',
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 6 },
  promptText: { flexShrink: 1 },
  bubble: { alignSelf: 'flex-start', marginLeft: 5, backgroundColor: color.surface, borderRadius: 12 },
  userBubble: { alignSelf: 'flex-end', marginLeft: 0, marginRight: 5, backgroundColor: color.mintSurface },
  bubbleTail: { position: 'absolute', left: -3, top: 14, width: 8, height: 8, borderRadius: 1, transform: [{ rotate: '45deg' }], backgroundColor: color.surface },
  userTail: { left: undefined, right: -3, backgroundColor: color.mintSurface },
  textBubble: { maxWidth: '84%', paddingHorizontal: 12, paddingVertical: 8 },
  cardBubble: { width: '96%' },
  cardIntro: { paddingHorizontal: 12, paddingTop: 8 },
  clipBubble: { marginHorizontal: 12, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  messageText: { lineHeight: 23 },
  composer: { marginHorizontal: 16, marginTop: 4, marginBottom: 9, paddingHorizontal: 16, borderRadius: 25, backgroundColor: color.surface },
  homeComposer: { marginHorizontal: 16, marginBottom: 9, gap: 3 },
  homeControls: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  homeControl: { minHeight: 46, minWidth: 40, alignItems: 'center', justifyContent: 'center', gap: 1 },
  homeUnread: { position: 'absolute', top: 4, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff494b' },
  holdVoice: { flex: 1, borderRadius: 27, minHeight: 48, backgroundColor: color.mintSurface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  holdingVoice: { backgroundColor: '#ccefe6' },
  homeTextRow: { flex: 1, minWidth: 0, borderRadius: 22, paddingHorizontal: 12, backgroundColor: color.surface },
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
