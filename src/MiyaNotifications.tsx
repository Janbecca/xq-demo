import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { callAlertCategories, timeText, weekdays, type Time } from './demo';
import { MiyaEventDescription } from './MiyaEventDescription';
import { channels, defaultTask, demoNoticeEvent, maxCustomMinutes, minutesOf, spanMinutes, taskDays, taskHours, timeAt, type MiyaTask, type MiyaTaskChange } from './miyaDemo';
import { presetCallAlerts } from './miyaEvents';
import { color, Header, Icon, IconButton, Label, PrimaryButton, s, Segments, SelectionCheck, Sheet } from './ui';

const categoryNames = [...callAlertCategories.map(category => category.label), '自定义'];
const standardEvents = new Set<string>(presetCallAlerts);
const dialSize = 240;
const center = dialSize / 2;
const radius = 94;
const interval = 15;
const dayMinutes = 24 * 60;
const touchStyle = Platform.OS === 'web' ? { touchAction: 'none' } as ViewStyle : undefined;

function toggle<T>(items: T[], value: T) {
  return items.includes(value) ? items.filter(item => item !== value) : [...items, value];
}

export function MiyaTasks({ tasks, add, edit }: { tasks: MiyaTask[]; add: () => void; edit: (task: MiyaTask) => void }) {
  return <View style={s.fill}>
    <ScrollView contentContainerStyle={n.content} showsVerticalScrollIndicator={false}>
      <Label size={14} tint={color.secondaryText} style={n.sectionText}>可为不同关注事件分别设置通知方式和时段。</Label>
      <View style={[s.card, n.list]}>
        {tasks.map((task, index) => <Pressable key={task.id} accessibilityRole="button" onPress={() => edit(task)}
          style={({ pressed }) => [n.task, index < tasks.length - 1 && s.divider, pressed && s.pressed]}>
          <View style={s.mintBadge}><Icon name="notifications-outline" tint={color.mintText} size={19} /></View>
          <View style={n.taskText}>
            <Label size={17}>{task.events.join('、')}</Label>
            <Label size={13} tint={color.secondaryText}>{taskDays(task.days)} · {taskHours(task)}</Label>
            <Label size={13} tint={color.secondaryText}>{task.channels.join('、')}</Label>
          </View>
          <Icon name="chevron-forward" tint={color.muted} size={17} />
        </Pressable>)}
        {!tasks.length && <Label size={14} tint={color.muted} style={n.empty}>暂无通知任务</Label>}
      </View>
    </ScrollView>
    <View style={n.footer}><PrimaryButton label="新建通知任务" action={add} /></View>
  </View>;
}

function parseTime(value: string): Time | undefined {
  const match = /^(\d{1,2}):?(\d{2})$/.exec(value.trim());
  if (!match) return;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 24 && minute < 60) return { hour, minute };
}

function dialPoint(minutes: number, distance: number) {
  const angle = minutes / dayMinutes * Math.PI * 2 - Math.PI / 2;
  return { x: center + distance * Math.cos(angle), y: center + distance * Math.sin(angle) };
}

function DialHandle({ value, label, shortLabel, onChange, setDragging }: {
  value: number; label: string; shortLabel: string; onChange: (time: Time) => void; setDragging: (dragging: boolean) => void;
}) {
  const current = useRef(value);
  const origin = useRef(dialPoint(value, radius));
  useEffect(() => { current.current = value; }, [value]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { origin.current = dialPoint(current.current, radius); setDragging(true); },
    onPanResponderMove: (_, { dx, dy }) => {
      const x = origin.current.x + dx - center;
      const y = origin.current.y + dy - center;
      if (Math.hypot(x, y) < 10) return;
      const ratio = (Math.atan2(y, x) + Math.PI / 2) / (2 * Math.PI);
      onChange(timeAt((Math.round(ratio * dayMinutes / interval) * interval + dayMinutes) % dayMinutes));
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => setDragging(false),
    onPanResponderTerminate: () => setDragging(false),
  }), [onChange, setDragging]);
  const point = dialPoint(value, radius);
  return <View {...pan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={label}
    accessibilityValue={{ text: timeText(timeAt(value)) }}
    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    onAccessibilityAction={({ nativeEvent }) => {
      const delta = nativeEvent.actionName === 'increment' ? interval : -interval;
      onChange(timeAt((value + delta + dayMinutes) % dayMinutes));
    }}
    style={[n.handle, touchStyle, { left: point.x - 15, top: point.y - 15 }]}>
    <Label size={11} bold tint={color.mintText}>{shortLabel}</Label>
  </View>;
}

function TimeDial({ start, end, setStart, setEnd, setDragging }: {
  start: Time; end: Time; setStart: (value: Time) => void; setEnd: (value: Time) => void; setDragging: (dragging: boolean) => void;
}) {
  const total = spanMinutes(start, end);
  const from = minutesOf(start);
  const to = minutesOf(end);
  const a = dialPoint(from, radius);
  const b = dialPoint(to, radius);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const duration = total ? (hours ? hours + '小时' : '') + (minutes ? minutes + '分钟' : '') : '0分钟';
  return <View style={n.dial}>
    <Svg width={dialSize} height={dialSize} pointerEvents="none">
      <Circle cx={center} cy={center} r={radius} fill="none" stroke={color.canvas} strokeWidth={16} />
      {total > 0 && <Path d={`M ${a.x} ${a.y} A ${radius} ${radius} 0 ${total > 720 ? 1 : 0} 1 ${b.x} ${b.y}`}
        fill="none" stroke={total > maxCustomMinutes ? '#e6b6ad' : '#a8e8da'} strokeWidth={16} />}
      {Array.from({ length: 48 }, (_, index) => {
        const inner = dialPoint(index * 30, index % 2 ? 89 : 86);
        const outer = dialPoint(index * 30, 96);
        return <Line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={index % 2 ? color.muted : color.secondaryText} />;
      })}
      {Array.from({ length: 12 }, (_, index) => {
        const point = dialPoint(index * 120, 69);
        return <SvgText key={index} x={point.x} y={point.y + 3} textAnchor="middle" fontSize={10}
          fill={color.secondaryText}>{String(index * 2).padStart(2, '0')}</SvgText>;
      })}
    </Svg>
    <View pointerEvents="none" style={n.dialText}>
      <Label size={12}>通知时长</Label><Label size={21} bold>{duration}</Label><Label size={11} tint={color.secondaryText}>最长 8 小时</Label>
    </View>
    <DialHandle value={from} label="表盘开始时间" shortLabel="始" onChange={setStart} setDragging={setDragging} />
    <DialHandle value={to} label="表盘结束时间" shortLabel="终" onChange={setEnd} setDragging={setDragging} />
  </View>;
}

export function MiyaTaskChangeCard({ change, initiallyExpanded, savedEvents, confirm, cancel }: {
  change: MiyaTaskChange; initiallyExpanded: boolean; savedEvents: readonly string[];
  confirm: (task: MiyaTask) => void; cancel: () => void;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const { task, kind, status } = change;
  const removing = kind === 'remove';
  const editable = status === 'pending' && !removing;
  const title = removing ? '取消关注 ' + task.events.join('、') : `${task.events.join('、')}，${taskDays(task.days)} ${taskHours(task)}`;
  return <View style={n.changeCard}>
    <View style={n.changeHeader}>
      <Label size={16} bold style={s.fill}>{title}</Label>
      {editable && <Pressable accessibilityRole="button" accessibilityLabel={expanded ? '收起配置' : '展开配置'}
        aria-expanded={expanded} accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={n.changeToggle}>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} tint={color.mintText} />
      </Pressable>}
    </View>
    {status !== 'pending' ? <Label size={13} tint={color.secondaryText} style={n.changeCaption}>{status === 'saved' ? '已生效' : '已取消'}</Label>
      : removing ? <View style={[n.footer, n.footerRow]}>
        <Pressable accessibilityRole="button" onPress={cancel} style={[n.cancel, n.inlineCancel]}><Label>取消</Label></Pressable>
        <View style={s.fill}><PrimaryButton label="确认生效" action={() => confirm(task)} /></View>
      </View> : <>
        {!expanded && <Label size={13} tint={color.secondaryText} style={n.changeCaption}>{task.channels.join('、')}</Label>}
        <MiyaTaskEditor id={task.id} initial={task} inline showFields={expanded}
          savedEvents={savedEvents} save={confirm} cancel={cancel} />
      </>}
  </View>;
}

export function MiyaTaskEditor({ id, initial, inline = false, showFields = true, savedEvents = [], save, remove, cancel }: {
  id: string; initial?: MiyaTask; inline?: boolean; showFields?: boolean;
  savedEvents?: readonly string[];
  save: (task: MiyaTask) => void; remove?: () => void; cancel: () => void;
}) {
  const base = initial ?? defaultTask;
  const [events, setEvents] = useState(base.events);
  const [newCustomEvents, setNewCustomEvents] = useState<string[]>([]);
  const [methods, setMethods] = useState(base.channels);
  const [days, setDays] = useState(base.days);
  const [allDay, setAllDay] = useState(base.allDay);
  const [startText, setStartText] = useState(timeText(base.start));
  const [endText, setEndText] = useState(timeText(base.end));
  const [selecting, setSelecting] = useState(!initial);
  const [category, setCategory] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const customEvents = [...new Set([demoNoticeEvent, ...savedEvents, ...base.events, ...newCustomEvents])]
    .filter(event => !standardEvents.has(event));
  const groups = callAlertCategories[category]?.groups ?? [{ label: '自定义', events: customEvents }];
  const start = parseTime(startText);
  const end = parseTime(endText);
  const setStart = useCallback((value: Time) => setStartText(timeText(value)), []);
  const setEnd = useCallback((value: Time) => setEndText(timeText(value)), []);
  const duration = start && end ? spanMinutes(start, end) : undefined;
  const timeError = !allDay && (
    duration === undefined ? '请输入有效时间，例如 09:00' :
    duration === 0 ? '开始时间和结束时间须不同' :
    duration > maxCustomMinutes ? '自定义时段最长 8 小时' : ''
  );
  const error = !events.length ? '请选择至少一个关注事件' : !methods.length ? '请选择至少一种通知方式' :
    !days.length ? '请选择至少一个通知日' : timeError;

  function addDescribedEvent(event: string) {
    setEvents(items => items.includes(event) ? items : [...items, event]);
    const presetCategory = callAlertCategories.findIndex(item => item.groups.some(group => group.events.some(name => name === event)));
    if (presetCategory >= 0) {
      setCategory(presetCategory);
    } else {
      if (!customEvents.includes(event)) setNewCustomEvents(items => [...items, event]);
      setCategory(callAlertCategories.length);
    }
  }

  function submit() {
    setSubmitted(true);
    if (error) return;
    Keyboard.dismiss();
    save({ id, events, channels: methods, days, allDay, start: start ?? base.start, end: end ?? base.end });
  }

  const fields = <>
      <Label size={15} bold style={n.sectionText}>关注事件</Label>
      <View style={[s.card, n.card]}>
        <Pressable accessibilityRole="button" accessibilityLabel={selecting ? '收起' : '选择事件'} accessibilityState={{ expanded: selecting }}
          onPress={() => setSelecting(!selecting)} style={[n.sectionHeader, n.eventSelection, selecting && s.divider]}>
          <Label size={15} style={n.taskText} tint={events.length ? color.text : color.secondaryText}>
            {events.length ? events.join('、') : '请选择需要关注的事件'}
          </Label>
          <Label tint={color.mintText} size={14}>{selecting ? '收起' : '选择事件'}</Label>
          <Icon name={selecting ? 'chevron-up' : 'chevron-down'} size={15} tint={color.muted} />
        </Pressable>
        {selecting && <>
          <MiyaEventDescription selected={events} add={addDescribedEvent} knownCustom={customEvents} />
          <Segments labels={categoryNames} selected={category} onChange={setCategory} equal />
          {groups.map(group => <View key={group.label} style={n.group}>
            {categoryNames[category] !== group.label && <Label size={13} tint={color.secondaryText}>{group.label}</Label>}
            {group.events.map((event, index) => <CheckRow key={event} label={event} checked={events.includes(event)}
              last={index === group.events.length - 1} onPress={() => setEvents(items => toggle(items, event))} />)}
          </View>)}
        </>}
      </View>
      <Label size={15} bold style={[n.sectionText, n.sectionGap]}>通知方式</Label>
      <View style={[s.card, n.list]}>
        {channels.map((channel, index) => <CheckRow key={channel} label={channel} checked={methods.includes(channel)}
          last={index === channels.length - 1} onPress={() => setMethods(items => toggle(items, channel))} />)}
      </View>
      <Label size={15} bold style={[n.sectionText, n.sectionGap]}>通知时段</Label>
      <View style={[s.card, n.card]}>
        <View style={n.sectionHeader}><Label size={15}>重复日期</Label><Label size={13} tint={color.secondaryText}>{taskDays(days)}</Label></View>
        <View style={n.days}>
          {weekdays.map(day => <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={day} aria-checked={days.includes(day)} accessibilityState={{ checked: days.includes(day) }}
            onPress={() => setDays(current => weekdays.filter(item => item === day ? !current.includes(day) : current.includes(item)))}
            style={[n.day, days.includes(day) && n.daySelected]}>
            <Label size={14} tint={days.includes(day) ? color.mintText : color.text}>{day.slice(1)}</Label>
          </Pressable>)}
        </View>
        <Segments labels={['全天', '自定义时段']} selected={allDay ? 0 : 1} onChange={index => setAllDay(index === 0)} equal />
        {allDay ? <Label size={13} tint={color.secondaryText}>在所选日期的 00:00–24:00 接收通知</Label> : <>
          <View style={n.times}>
            <View style={n.time}><Label size={13} numberOfLines={1} style={n.timeLabel}>开始</Label><TextInput style={n.timeInput} accessibilityLabel="开始时间"
              value={startText} onChangeText={setStartText} maxLength={5} keyboardType="numbers-and-punctuation"
              onBlur={() => { if (start) setStart(start); }} /></View>
            <View style={n.time}><Label size={13} numberOfLines={1} style={n.timeLabel}>结束</Label><TextInput style={n.timeInput} accessibilityLabel="结束时间"
              value={endText} onChangeText={setEndText} maxLength={5} keyboardType="numbers-and-punctuation"
              onBlur={() => { if (end) setEnd(end); }} /></View>
          </View>
          {!inline && <TimeDial start={start ?? base.start} end={end ?? base.end} setStart={setStart} setEnd={setEnd} setDragging={setDragging} />}
          <Label size={12} tint={color.secondaryText} style={n.caption}>{inline ? '时区 Asia/Shanghai' : '时区 Asia/Shanghai · 可拖动起止时间'}</Label>
          {timeError && <Label size={12} tint="#a04039" accessibilityLiveRegion="polite">{timeError}</Label>}
        </>}
      </View>
  </>;
  const footer = <>
    {submitted && error && <Label size={13} tint="#a04039" accessibilityLiveRegion="polite" style={n.error}>{error}</Label>}
    <View style={[n.footer, n.footerRow]}>
      <Pressable accessibilityRole="button" onPress={cancel} style={[n.cancel, inline && n.inlineCancel]}><Label>取消</Label></Pressable>
      <View style={s.fill}><PrimaryButton label={inline ? '确认生效' : '保存任务'} action={submit} /></View>
    </View>
  </>;
  if (inline) return <View>
    <View style={[n.content, n.inlineFields, !showFields && n.hidden]}>{fields}</View>
    {footer}
  </View>;
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fill}>
    <Header title={initial ? '编辑通知任务' : '新建通知任务'} back={cancel}
      right={initial && remove && <IconButton name="trash-outline" tint="#a04a45" label="删除任务" onPress={() => setDeleting(true)} />} />
    <ScrollView contentContainerStyle={n.content} scrollEnabled={!dragging} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {fields}
    </ScrollView>
    {footer}
    {deleting && remove && <Sheet title="删除通知任务" close={() => setDeleting(false)} confirm={remove}>
      <Label style={n.deletePrompt}>删除「{initial?.events.join('、')}」的通知设置？</Label>
    </Sheet>}
  </KeyboardAvoidingView>;
}

function CheckRow({ label, checked, last, onPress }: { label: string; checked: boolean; last: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} aria-checked={checked} accessibilityState={{ checked }}
    onPress={onPress} style={[n.check, !last && s.divider]}>
    <Label size={16}>{label}</Label><SelectionCheck checked={checked} />
  </Pressable>;
}

const n = StyleSheet.create({
  changeCard: { minWidth: 0 },
  changeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 13, paddingRight: 8, paddingVertical: 9, minHeight: 46 },
  changeToggle: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.mintSurface, alignItems: 'center', justifyContent: 'center' },
  changeCaption: { marginHorizontal: 13, marginBottom: 4 },
  inlineFields: { backgroundColor: color.canvas, marginHorizontal: 8, paddingHorizontal: 8, borderRadius: 11 },
  hidden: { display: 'none' },
  inlineCancel: { backgroundColor: color.canvas },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 8 },
  sectionText: { marginHorizontal: 16, lineHeight: 21 },
  sectionGap: { marginTop: 6 },
  card: { padding: 16, gap: 9 },
  list: { paddingHorizontal: 16 },
  task: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, minHeight: 82, gap: 10 },
  taskText: { flex: 1, gap: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventSelection: { minHeight: 42, paddingBottom: 5 },
  group: { gap: 3 },
  check: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 45, gap: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { flex: 1, maxWidth: 39, aspectRatio: 1, backgroundColor: color.canvas, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: color.mintSurface, borderWidth: 1, borderColor: color.mint },
  times: { flexDirection: 'row', gap: 8 },
  time: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: color.canvas, borderRadius: 9 },
  timeLabel: { flexShrink: 0 },
  timeInput: { width: 68, flexShrink: 1, minHeight: 39, padding: 5, textAlign: 'center', color: color.text, fontVariant: ['tabular-nums'] },
  dial: { width: dialSize, height: dialSize, alignSelf: 'center' },
  dialText: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  handle: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: color.mint,
    alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface },
  caption: { textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingVertical: 9 },
  footerRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, minHeight: 51, borderRadius: 28, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  error: { marginHorizontal: 16, marginTop: 5 },
  empty: { padding: 18, textAlign: 'center' },
  deletePrompt: { paddingHorizontal: 18, paddingBottom: 20 },
});
