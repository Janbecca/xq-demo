import { useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { alertTypes, scenes, timeText, twoDigits, weekdays, type Rule, type Scene, type Time } from './demo';
import { color, Icon, Label, Row, s, Sheet } from './ui';

type Selection =
  | { kind: 'type'; value: string }
  | { kind: 'days'; value: string[] }
  | { kind: 'channel'; value: string };
const channels = ['微信通知', 'App通知'];
const offsets = [-2, -1, 0, 1, 2];
const wheelHeight = 39;
const wrap = (value: number, limit: number) => ((value % limit) + limit) % limit;

function TimeWheel({ value, limit, label, onChange }: {
  value: number; limit: number; label: '小时' | '分钟'; onChange: (value: number) => void;
}) {
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx),
    onPanResponderRelease: (_, { dy }) => {
      const distance = Math.round(Math.abs(dy) / wheelHeight) || 1;
      onChange(wrap(value - Math.sign(dy) * distance, limit));
    },
  }), [limit, onChange, value]);

  return <View style={e.wheel} {...pan.panHandlers}>
    {offsets.map(offset => {
      const number = wrap(value + offset, limit);
      const text = label === '分钟' ? twoDigits(number) : String(number);
      return <Pressable key={offset} accessibilityRole="button" accessibilityLabel={`${label} ${text}`} accessibilityState={{ selected: offset === 0 }}
        onPress={() => onChange(number)} style={e.wheelRow}>
        <Label size={offset === 0 ? 21 : Math.abs(offset) === 1 ? 17 : 13} tint={offset === 0 ? color.mint : '#818588'}>{text}</Label>
      </Pressable>;
    })}
  </View>;
}

export function RuleEditor({ initial, save }: { initial: Rule; save: (rule: Rule) => void }) {
  const [rule, setRule] = useState(initial);
  const [period, setPeriod] = useState<'start' | 'end'>('start');
  const [sheet, setSheet] = useState<Selection | null>(null);
  const update = (patch: Partial<Rule>) => setRule(current => ({ ...current, ...patch }));
  const selectScene = (scene: Scene) => {
    if (rule.scene !== scene) update({ scene, type: '' });
  };
  const changeTime = (part: keyof Time, value: number) => {
    setRule(current => ({ ...current, [period]: { ...current[period], [part]: value } }));
  };
  const close = () => setSheet(null);
  const confirm = () => {
    if (sheet?.kind === 'type') update({ type: sheet.value });
    if (sheet?.kind === 'days') update({ days: weekdays.filter(day => sheet.value.includes(day)) });
    if (sheet?.kind === 'channel') update({ channel: sheet.value });
    close();
  };
  const canSave = Boolean(rule.type && rule.days.length);

  return <>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={e.content}>
      <Label size={14} tint={color.muted} style={e.sectionText}>按场景配置规则后，将按生效时间与通知方式推送</Label>
      <Label size={15} bold style={e.sectionText}>场景与类型</Label>
      <View style={[s.card, e.card]}>
        <View style={[s.row, s.divider, e.sceneRow]}>
          <Label size={17}>选择场景</Label>
          <View style={e.scenes}>{scenes.map(scene => <Pressable key={scene} accessibilityRole="radio" accessibilityState={{ checked: rule.scene === scene }}
            onPress={() => selectScene(scene)} hitSlop={5} style={e.scene}>
            <View style={[e.radio, rule.scene === scene && e.radioSelected]} /><Label size={16}>{scene}</Label>
          </Pressable>)}</View>
        </View>
        <Row label="告警类型" value={rule.type || '请选择'} last onPress={() => setSheet({ kind: 'type', value: rule.type })} />
      </View>
      <Label size={15} bold style={[e.sectionText, e.sectionGap]}>生效时间</Label>
      <View style={[s.card, e.card, e.timeCard]}>
        <View style={e.timeTabs}>
          {(['start', 'end'] as const).map((item, index) => <Pressable key={item} accessibilityRole="tab"
            accessibilityState={{ selected: item === period }} onPress={() => setPeriod(item)}
            style={[e.timeTab, item === period && e.timeTabSelected]}>
            <Label size={15} tint={item === period ? '#fff' : '#888d90'}>{index === 0 ? '开始时间' : '结束时间'}</Label>
          </Pressable>)}
        </View>
        <View style={e.wheels}>
          <View pointerEvents="none" style={e.wheelHighlight} />
          <TimeWheel value={rule[period].hour} limit={24} label="小时" onChange={value => changeTime('hour', value)} />
          <TimeWheel value={rule[period].minute} limit={60} label="分钟" onChange={value => changeTime('minute', value)} />
        </View>
        <Row label="生效时段" value={`${timeText(rule.start)} – ${timeText(rule.end)}`} height={43} />
        <Row label="重复日期" value={rule.days.length === 7 ? '每天' : rule.days.join('、') || '请选择'} last
          onPress={() => setSheet({ kind: 'days', value: rule.days })} />
      </View>
      <Label size={15} bold style={[e.sectionText, e.sectionGap]}>通知方式</Label>
      <View style={[s.card, e.card]}>
        <Row label="通知方式" value={rule.channel} last onPress={() => setSheet({ kind: 'channel', value: rule.channel })} />
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave}
        onPress={() => save(rule)} style={[e.save, !canSave && e.disabled]}>
        <Label size={17} bold tint="#fff">保存</Label>
      </Pressable>
    </ScrollView>
    {sheet?.kind === 'type' && <Sheet title="选择告警类型" close={close} confirm={confirm} confirmDisabled={!sheet.value}>
      <View style={e.chipGroup}>{alertTypes[rule.scene].map(row => <View key={row[0]} style={e.chipRow}>
        {row.map(type => <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: sheet.value === type }}
          onPress={() => setSheet({ kind: 'type', value: type })} style={[e.chip, sheet.value === type && e.chipSelected]}>
          <Label size={15}>{type}</Label>
          {sheet.value === type && <View style={e.chipCheck}><Icon name="checkmark" tint="#fff" size={9} /></View>}
        </Pressable>)}
      </View>)}</View>
    </Sheet>}
    {sheet?.kind === 'days' && <Sheet close={close} confirm={confirm} mutedCancel confirmDisabled={sheet.value.length === 0}>
      <View style={e.options}>{weekdays.map(day => {
        const checked = sheet.value.includes(day);
        return <Pressable key={day} accessibilityRole="checkbox" accessibilityState={{ checked }} style={[e.option, s.divider]}
          onPress={() => setSheet({ kind: 'days', value: checked ? sheet.value.filter(item => item !== day) : [...sheet.value, day] })}>
          <Label size={17}>{day}</Label><Check checked={checked} />
        </Pressable>;
      })}</View>
    </Sheet>}
    {sheet?.kind === 'channel' && <Sheet title="选择通知方式" close={close} confirm={confirm}>
      <View style={e.options}>{channels.map(channel => <Pressable key={channel} accessibilityRole="radio"
        accessibilityState={{ checked: sheet.value === channel }} style={[e.option, s.divider]}
        onPress={() => setSheet({ kind: 'channel', value: channel })}>
        <Label size={17}>{channel}</Label><Check checked={sheet.value === channel} />
      </Pressable>)}</View>
    </Sheet>}
  </>;
}

function Check({ checked }: { checked: boolean }) {
  return <View style={[e.check, checked && e.checkSelected]}>{checked && <Icon name="checkmark" size={17} tint="#fff" />}</View>;
}

const e = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 8 },
  sectionText: { marginHorizontal: 16, lineHeight: 21 },
  sectionGap: { marginTop: 6 },
  card: { paddingHorizontal: 16 },
  sceneRow: { minHeight: 61 },
  scenes: { flexDirection: 'row', flexBasis: '66%', flexShrink: 0, justifyContent: 'space-between', gap: 6 },
  scene: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  radio: { width: 19, height: 19, borderRadius: 10, borderColor: '#dbdddf', borderWidth: 1 },
  radioSelected: { borderWidth: 4, borderColor: color.mint },
  timeCard: { paddingTop: 20 },
  timeTabs: { alignSelf: 'flex-start', flexDirection: 'row', borderColor: '#dfdfdf', borderWidth: 1, borderRadius: 17, overflow: 'hidden' },
  timeTab: { paddingHorizontal: 14, minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  timeTabSelected: { backgroundColor: color.mint },
  wheels: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  wheel: { flex: 1 },
  wheelRow: { height: wheelHeight, alignItems: 'center', justifyContent: 'center' },
  wheelHighlight: { position: 'absolute', left: '5%', right: '5%', height: wheelHeight, borderRadius: 8, backgroundColor: color.canvas },
  save: { backgroundColor: color.mint, minHeight: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  disabled: { opacity: 0.45 },
  chipGroup: { paddingHorizontal: 17, paddingTop: 7, paddingBottom: 39, gap: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: color.canvas, borderWidth: 1, borderColor: 'transparent', borderRadius: 9, paddingHorizontal: 15, minHeight: 33, justifyContent: 'center', overflow: 'hidden' },
  chipSelected: { borderColor: color.mint, backgroundColor: '#e7f9f5' },
  chipCheck: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 11, backgroundColor: color.mint, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 5 },
  options: { paddingHorizontal: 17 },
  option: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#d7dadb', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { borderColor: color.green, backgroundColor: color.green },
});
