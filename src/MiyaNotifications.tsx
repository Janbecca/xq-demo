import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { callAlertCategories, timeText, weekdays, type Time } from './demo';
import { channels, defaultTask, maxCustomMinutes, minutesOf, spanMinutes, taskDays, taskHours, timeAt, type MiyaTask } from './miyaDemo';
import { color, Header, Icon, IconButton, Label, PrimaryButton, s, Segments, Sheet } from './ui';

const categoryNames = callAlertCategories.map(category => category.label);
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
    <ScrollView contentContainerStyle={n.content}>
      <Label size={13} tint="#697477">可为不同关注事件分别设置通知方式和时段。</Label>
      {tasks.map(task => <Pressable key={task.id} accessibilityRole="button" onPress={() => edit(task)} style={[s.card, n.task]}>
        <View style={n.taskIcon}><Icon name="notifications-outline" tint={color.green} size={20} /></View>
        <View style={n.taskText}>
          <Label bold>{task.events.join('、')}</Label>
          <Label size={13} tint="#687276">{taskDays(task.days)} · {taskHours(task)}</Label>
          <Label size={13} tint="#687276">{task.channels.join('、')}</Label>
        </View>
        <Icon name="chevron-forward" tint={color.muted} size={17} />
      </Pressable>)}
      {!tasks.length && <Label size={14} tint={color.muted} style={n.empty}>暂无通知任务</Label>}
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
    <Label size={11} bold tint={color.green}>{shortLabel}</Label>
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
      <Circle cx={center} cy={center} r={radius} fill="none" stroke="#e7efed" strokeWidth={16} />
      {total > 0 && <Path d={`M ${a.x} ${a.y} A ${radius} ${radius} 0 ${total > 720 ? 1 : 0} 1 ${b.x} ${b.y}`}
        fill="none" stroke={total > maxCustomMinutes ? '#e6b6ad' : '#8edacc'} strokeWidth={16} />}
      {Array.from({ length: 48 }, (_, index) => {
        const inner = dialPoint(index * 30, index % 2 ? 89 : 86);
        const outer = dialPoint(index * 30, 96);
        return <Line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={index % 2 ? '#a8b9b5' : '#697c77'} />;
      })}
      {Array.from({ length: 12 }, (_, index) => {
        const point = dialPoint(index * 120, 69);
        return <SvgText key={index} x={point.x} y={point.y + 3} textAnchor="middle" fontSize={10}
          fill="#596f69">{String(index * 2).padStart(2, '0')}</SvgText>;
      })}
    </Svg>
    <View pointerEvents="none" style={n.dialText}>
      <Label size={12}>通知时长</Label><Label size={21} bold>{duration}</Label><Label size={11} tint="#687276">最长 8 小时</Label>
    </View>
    <DialHandle value={from} label="表盘开始时间" shortLabel="始" onChange={setStart} setDragging={setDragging} />
    <DialHandle value={to} label="表盘结束时间" shortLabel="终" onChange={setEnd} setDragging={setDragging} />
  </View>;
}

export function MiyaTaskEditor({ id, initial, save, remove, cancel }: {
  id: string; initial?: MiyaTask; save: (task: MiyaTask) => void; remove: () => void; cancel: () => void;
}) {
  const base = initial ?? defaultTask;
  const [events, setEvents] = useState(base.events);
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

  function submit() {
    setSubmitted(true);
    if (error) return;
    Keyboard.dismiss();
    save({ id, events, channels: methods, days, allDay, start: start ?? base.start, end: end ?? base.end });
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fill}>
    <Header title={initial ? '编辑通知任务' : '新建通知任务'} back={cancel}
      right={initial && <IconButton name="trash-outline" tint="#a04a45" label="删除任务" onPress={() => setDeleting(true)} />} />
    <ScrollView contentContainerStyle={n.content} scrollEnabled={!dragging} keyboardShouldPersistTaps="handled">
      <View style={[s.card, n.card]}>
        <View style={n.sectionHeader}>
          <Label bold>关注事件</Label>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: selecting }} onPress={() => setSelecting(!selecting)}>
            <Label tint={color.green} size={14}>{selecting ? '收起' : '选择事件'}</Label>
          </Pressable>
        </View>
        <Label size={13} tint="#687276">{events.length ? events.join('、') : '请选择需要关注的事件'}</Label>
        {selecting && <>
          <Segments labels={categoryNames} selected={category} onChange={setCategory} equal />
          {callAlertCategories[category].groups.map(group => <View key={group.label} style={n.group}>
            {categoryNames[category] !== group.label && <Label size={12} tint="#687276">{group.label}</Label>}
            {group.events.map(event => <CheckRow key={event} label={event} checked={events.includes(event)} onPress={() => setEvents(items => toggle(items, event))} />)}
          </View>)}
        </>}
      </View>
      <View style={[s.card, n.card]}>
        <Label bold>通知方式</Label>
        {channels.map(channel => <CheckRow key={channel} label={channel} checked={methods.includes(channel)}
          onPress={() => setMethods(items => toggle(items, channel))} />)}
      </View>
      <View style={[s.card, n.card]}>
        <View style={n.sectionHeader}><Label bold>通知时段</Label><Label size={12} tint="#687276">{taskDays(days)}</Label></View>
        <View style={n.days}>
          {weekdays.map(day => <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={day} accessibilityState={{ checked: days.includes(day) }}
            onPress={() => setDays(current => weekdays.filter(item => item === day ? !current.includes(day) : current.includes(item)))}
            style={[n.day, days.includes(day) && n.daySelected]}>
            <Label size={13} tint={days.includes(day) ? '#fff' : color.text}>{day.slice(1)}</Label>
          </Pressable>)}
        </View>
        <Segments labels={['全天', '自定义时段']} selected={allDay ? 0 : 1} onChange={index => setAllDay(index === 0)} equal />
        {allDay ? <Label size={13} tint="#687276">在所选日期的 00:00–24:00 接收通知</Label> : <>
          <View style={n.times}>
            <View style={n.time}><Label size={13}>开始</Label><TextInput style={n.timeInput} accessibilityLabel="开始时间"
              value={startText} onChangeText={setStartText} maxLength={5} keyboardType="numbers-and-punctuation"
              onBlur={() => { if (start) setStart(start); }} /></View>
            <View style={n.time}><Label size={13}>结束</Label><TextInput style={n.timeInput} accessibilityLabel="结束时间"
              value={endText} onChangeText={setEndText} maxLength={5} keyboardType="numbers-and-punctuation"
              onBlur={() => { if (end) setEnd(end); }} /></View>
          </View>
          <TimeDial start={start ?? base.start} end={end ?? base.end} setStart={setStart} setEnd={setEnd} setDragging={setDragging} />
          <Label size={12} tint="#687276" style={n.caption}>时区 Asia/Shanghai · 可拖动起止时间</Label>
          {timeError && <Label size={12} tint="#a04039" accessibilityLiveRegion="polite">{timeError}</Label>}
        </>}
      </View>
    </ScrollView>
    {submitted && error && <Label size={13} tint="#a04039" accessibilityLiveRegion="polite" style={n.error}>{error}</Label>}
    <View style={[n.footer, n.footerRow]}>
      <Pressable accessibilityRole="button" onPress={cancel} style={n.cancel}><Label>取消</Label></Pressable>
      <View style={s.fill}><PrimaryButton label="保存任务" action={submit} /></View>
    </View>
    {deleting && <Sheet title="删除通知任务" close={() => setDeleting(false)} confirm={remove}>
      <Label style={n.deletePrompt}>删除「{initial?.events.join('、')}」的通知设置？</Label>
    </Sheet>}
  </KeyboardAvoidingView>;
}

function CheckRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={n.check}>
    <Icon name={checked ? 'checkbox' : 'square-outline'} tint={checked ? color.green : color.muted} size={21} />
    <Label size={14}>{label}</Label>
  </Pressable>;
}

const n = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  card: { padding: 13, gap: 9 },
  task: { flexDirection: 'row', alignItems: 'center', padding: 13, minHeight: 77, gap: 10 },
  taskText: { flex: 1, gap: 2 },
  taskIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2f7f2' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  group: { gap: 3 },
  check: { flexDirection: 'row', alignItems: 'center', minHeight: 37, gap: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { flex: 1, maxWidth: 39, aspectRatio: 1, backgroundColor: '#f1f3f4', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: color.green },
  times: { flexDirection: 'row', gap: 8 },
  time: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f4f6f6', borderRadius: 9 },
  timeInput: { minWidth: 64, minHeight: 39, padding: 5, textAlign: 'center', color: color.text, fontVariant: ['tabular-nums'] },
  dial: { width: dialSize, height: dialSize, alignSelf: 'center' },
  dialText: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  handle: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: color.green,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  caption: { textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingVertical: 9 },
  footerRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, minHeight: 51, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  error: { marginHorizontal: 16, marginTop: 5 },
  empty: { padding: 18, textAlign: 'center' },
  deletePrompt: { paddingHorizontal: 18, paddingBottom: 20 },
});
