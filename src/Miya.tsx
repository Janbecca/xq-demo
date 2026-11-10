import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { media, twoDigits } from './demo';
import { demoReply, miyaPrompts, scopeName, scopes, type MiyaClip, type MiyaContext, type MiyaScope, type MiyaThread } from './miyaDemo';
import { color, Icon, IconButton, Label, s, Sheet, type IconName } from './ui';

const destinations = [
  { id: 'miyaTasks', label: '通知管理', icon: 'notifications-outline' },
  { id: 'miyaSummary', label: '事件中心', icon: 'layers-outline' },
  { id: 'miyaHistory', label: '聊天记录', icon: 'time-outline' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];
export type MiyaDestination = (typeof destinations)[number]['id'];

export function MiyaScopePicker({ scope, pairedName, onSelect, onClose }: {
  scope: MiyaScope; pairedName: string; onSelect: (scope: MiyaScope) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState(scope);
  return <Sheet title="设备范围" close={onClose} confirm={() => { onSelect(selected); onClose(); }}>
    {scopes.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: selected === item }}
      onPress={() => setSelected(item)} style={[m.pickerRow, s.divider]}>
      <Label>{scopeName(item, pairedName)}</Label>
      {selected === item && <Icon name="checkmark" tint={color.green} />}
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

export function MiyaChat({ pairedName, threads, initialThreadId, initialContext, prefill, back, open, save, play }: {
  pairedName: string; threads: MiyaThread[]; initialThreadId?: string; initialContext?: MiyaContext; prefill?: string;
  back: () => void; open: (screen: MiyaDestination) => void; save: (thread: MiyaThread) => void;
  play: (clip: MiyaClip) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState(initialThreadId);
  const [contextOverride, setContextOverride] = useState<MiyaContext>();
  const [draft, setDraft] = useState(prefill ?? '');
  const [choosingScope, setChoosingScope] = useState(false);
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const thread = threads.find(item => item.id === threadId);
  const context = contextOverride ?? thread?.context ?? initialContext ?? { scope: 'all' };
  const messages = thread?.messages ?? [];

  function send() {
    const question = draft.trim();
    if (!question) return;
    const createdAt = Date.now();
    const current = thread ?? { id: 'miya-' + createdAt, title: question.slice(0, 36), createdAt, messages: [] };
    const next: MiyaThread = {
      ...current, context, messages: [...current.messages, { role: 'user', text: question }, demoReply(question, context)],
    };
    setThreadId(next.id);
    setContextOverride(undefined);
    setDraft('');
    save(next);
  }

  function newChat() {
    setThreadId(undefined);
    setDraft('');
    setContextOverride({ scope: 'all' });
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fill}>
    <View style={s.header}>
      <View style={s.back}><IconButton name="chevron-back" label="返回" onPress={back} /></View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={s.titleButton}>
        <Label size={18} bold>Miya 管家</Label><Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} />
      </Pressable>
      {thread && <View style={m.headerRight}><IconButton name="add-circle-outline" label="新对话" onPress={newChat} /></View>}
    </View>
    {expanded && <View style={m.menu}>
      {destinations.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item.id)} style={[s.card, m.menuItem]}>
        <Icon name={item.icon} tint={color.green} size={20} /><Label size={13}>{item.label}</Label>
      </Pressable>)}
    </View>}
    <ScrollView ref={scroll} contentContainerStyle={m.chatContent} keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => { if (messages.length) scroll.current?.scrollToEnd({ animated: false }); }}>
      {messages.length ? messages.map(({ role, text, clip }, index) => <View key={index} style={[m.message, role === 'user' && m.userMessage]}>
        {role === 'miya' && <Image source={media.miya} style={m.smallAvatar} resizeMode="contain" />}
        <View style={[m.bubble, role === 'user' && m.userBubble]}>
          <Label size={15} style={m.messageText}>{text}</Label>
          {clip && <MiyaClipRow clip={clip} pairedName={pairedName} play={() => play(clip)} />}
        </View>
      </View>) : <>
        <View style={m.hero}>
          <Image source={media.miya} style={m.avatar} resizeMode="contain" accessibilityLabel="Miya 管家头像" />
          <Label size={23} bold>你好，我是 Miya</Label>
          <Label size={14} tint="#687276">有什么想了解的，可以问我。</Label>
        </View>
        <View style={m.prompts}>
          {miyaPrompts.map(prompt => <Pressable key={prompt} accessibilityRole="button"
            onPress={() => { setDraft(prompt); input.current?.focus(); }} style={m.prompt}>
            <Label size={13}>{prompt}</Label>
          </Pressable>)}
        </View>
      </>}
    </ScrollView>
    <View style={m.composer}>
      <View style={m.inputRow}>
        <TextInput ref={input} style={m.input} value={draft} onChangeText={setDraft}
          accessibilityLabel="输入消息" placeholder="问问 Miya" placeholderTextColor={color.muted}
          maxLength={240} multiline returnKeyType="send" submitBehavior="submit"
          blurOnSubmit={Platform.OS === 'web' ? true : undefined} onSubmitEditing={send} />
        <Pressable accessibilityRole="button" accessibilityLabel="发送" accessibilityState={{ disabled: !draft.trim() }}
          disabled={!draft.trim()} onPress={send} style={[m.send, !draft.trim() && s.primaryDisabled]}>
          <Icon name="arrow-up" tint="#fff" size={20} />
        </Pressable>
      </View>
      <View style={m.context}>
        <Pressable accessibilityRole="button" onPress={() => setChoosingScope(true)} style={m.scope}>
          <Icon name="videocam-outline" size={15} /><Label size={12} numberOfLines={1} style={m.scopeLabel}>{scopeName(context.scope, pairedName)}</Label><Icon name="chevron-down" size={11} />
        </Pressable>
        {context.date && <Label size={11} tint={color.muted}>围绕 {context.date}</Label>}
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
      <Pressable accessibilityRole="button" style={m.scope} onPress={() => setChoosingScope(true)}>
        <Label size={14}>{scopeName(scope, pairedName)}</Label><Icon name="chevron-down" size={13} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={newChat} style={m.scope}>
        <Icon name="add-circle-outline" size={18} tint={color.green} /><Label size={14} tint={color.green}>新对话</Label>
      </Pressable>
    </View>
    <TextInput style={m.search} accessibilityLabel="搜索聊天记录" placeholder="搜索聊天记录" placeholderTextColor={color.muted}
      value={query} onChangeText={setQuery} returnKeyType="search" />
    <ScrollView contentContainerStyle={m.historyContent} keyboardShouldPersistTaps="handled">
      {!items.length && <Label size={14} tint={color.muted} style={m.empty}>{search ? '没有匹配的聊天记录' : '暂无聊天记录'}</Label>}
      {items.map(thread => {
        const date = new Date(thread.createdAt);
        const day = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
        const showDate = day !== lastDate;
        lastDate = day;
        return <View key={thread.id}>
          {showDate && <Label size={12} tint="#687276" style={m.historyDay}>{day}</Label>}
          <Pressable accessibilityRole="button" onPress={() => open(thread)} style={[s.card, m.thread]}>
            <Icon name="chatbubble-ellipses-outline" size={19} tint={color.green} />
            <View style={s.fill}>
              <Label bold size={15} numberOfLines={1}>{thread.title}</Label>
              <Label size={12} tint={color.muted} numberOfLines={1}>{thread.messages.at(-1)?.text}</Label>
            </View>
            <Label size={12} tint="#687276">{twoDigits(date.getHours())}:{twoDigits(date.getMinutes())}</Label>
            <Icon name="chevron-forward" size={15} tint={color.muted} />
          </Pressable>
        </View>;
      })}
    </ScrollView>
    {choosingScope && <MiyaScopePicker pairedName={pairedName} scope={scope} onSelect={setScope} onClose={() => setChoosingScope(false)} />}
  </View>;
}

const m = StyleSheet.create({
  headerRight: { position: 'absolute', right: 9 },
  menu: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  menuItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 62, gap: 4 },
  chatContent: { flexGrow: 1, padding: 16, gap: 12 },
  hero: { flex: 1, minHeight: 184, alignItems: 'center', justifyContent: 'center', gap: 6 },
  avatar: { width: 126, height: 126, marginBottom: 3 },
  prompts: { gap: 8, alignItems: 'flex-start' },
  prompt: { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: '#dce5e3',
    borderRadius: 14, borderBottomLeftRadius: 4, minHeight: 38, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 7 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  userMessage: { justifyContent: 'flex-end' },
  smallAvatar: { width: 29, height: 29 },
  bubble: { backgroundColor: '#fff', borderRadius: 13, borderTopLeftRadius: 4, padding: 10, maxWidth: '86%' },
  userBubble: { backgroundColor: '#dcf6ee', borderTopLeftRadius: 13, borderTopRightRadius: 4 },
  messageText: { lineHeight: 23 },
  composer: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 4, backgroundColor: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: '#e2e8e6', borderRadius: 14, gap: 6, padding: 5 },
  input: { flex: 1, minHeight: 38, maxHeight: 98, color: color.text, fontSize: 15, paddingHorizontal: 8, paddingVertical: 8, textAlignVertical: 'center' },
  send: { width: 38, height: 38, borderRadius: 11, backgroundColor: color.mint, justifyContent: 'center', alignItems: 'center' },
  context: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  scope: { flexDirection: 'row', alignItems: 'center', minHeight: 35, gap: 5, flexShrink: 1 },
  scopeLabel: { flexShrink: 1 },
  pickerRow: { minHeight: 49, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 },
  clip: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 59, paddingVertical: 7 },
  thumbnail: { width: 60, height: 39, borderRadius: 7 },
  historyBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  search: { marginHorizontal: 16, paddingHorizontal: 12, minHeight: 43, borderRadius: 12, backgroundColor: '#fff', color: color.text },
  historyContent: { padding: 16, gap: 8 },
  historyDay: { marginBottom: 6 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, minHeight: 57 },
  empty: { textAlign: 'center', padding: 20 },
});
