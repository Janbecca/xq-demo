import { useState, type ReactNode } from 'react';
import { Clipboard, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { media } from './demo';
import type { HomeMode } from './miyaStorage';
import { color, Icon, Label, PrimaryButton, Row, s, SelectionCheck, Sheet, Toggle, type IconName } from './ui';

const mint = '#13c6a1';
const blue = '#5783d8';
const orange = '#ffa654';
const sampleDn = 'CN5-DEMO-001';
const homeModes = [
  { id: 'conversation', label: 'Miya 对话' },
  { id: 'classic', label: '经典首页' },
] as const satisfies readonly { id: HomeMode; label: string }[];

const settings = {
  share: { label: '分享设备', icon: 'qr-code-outline', tint: mint },
  network: { label: '设备网络', icon: 'wifi', tint: '#084743' },
  detection: { label: '智能检测', icon: 'pulse-outline', tint: orange },
  picture: { label: '画面设置', icon: 'browsers-outline', tint: mint },
  sound: { label: '声音设置', icon: 'volume-high', tint: blue },
  storage: { label: '存储设置', icon: 'save-outline', tint: blue },
  indicator: { label: '指示灯设置', icon: 'bulb-outline', tint: orange },
  callKey: { label: '呼叫键通知方式', icon: 'chatbubbles', tint: mint },
  maintenance: { label: '设备维护', icon: 'videocam-outline', tint: orange },
  messages: { label: '消息通知', icon: 'notifications-outline', tint: mint },
  firmware: { label: '固件更新', icon: 'cube-outline', tint: blue },
  manual: { label: '产品说明书', icon: 'document-text', tint: orange },
} as const satisfies Record<string, { label: string; icon: IconName; tint: string }>;

type SettingId = keyof typeof settings;
export type DeviceSetting = 'profile' | Exclude<SettingId, 'detection' | 'messages'>;
export type DeviceSettingsEntry = DeviceSetting | 'detection' | 'messages';
export const deviceSettingTitle = (id: DeviceSetting) => id === 'profile' ? '设备信息' : settings[id].label;
const groups = [
  { title: '', items: ['share', 'network'] },
  { title: '智能设置', items: ['detection'] },
  { title: '设备设置', items: ['picture', 'sound', 'storage', 'indicator', 'callKey', 'maintenance'] },
  { title: '消息设置', items: ['messages'] },
  { title: '通用设置', items: ['firmware', 'manual'] },
] as const satisfies readonly { title: string; items: readonly SettingId[] }[];

export type DevicePreferences = {
  quality: '超清' | '高清';
  sound: boolean;
  indicator: boolean;
  callChannel: 'APP通知' | '微信通话';
};
export const defaultDevicePreferences: DevicePreferences = { quality: '超清', sound: false, indicator: true, callChannel: 'APP通知' };

function copyDeviceCode(toast: (message: string) => void) {
  Clipboard.setString(sampleDn);
  toast('已复制设备编号');
}

export function DeviceSettings({ deviceName, mode, chooseMode, open, restart, remove, toast }: {
  deviceName: string; mode: HomeMode; chooseMode: (mode: HomeMode) => void; open: (id: DeviceSettingsEntry) => void;
  restart: () => void; remove: () => void; toast: (message: string) => void;
}) {
  const [modeDraft, setModeDraft] = useState<HomeMode>();
  const [confirmation, setConfirmation] = useState<'restart' | 'remove'>();
  const modeLabel = homeModes.find(item => item.id === mode)?.label;
  return <>
    <ScrollView contentContainerStyle={d.content} showsVerticalScrollIndicator={false}>
      <View style={[s.card, d.profile]}>
        <Image source={media.camera} style={d.deviceImage} resizeMode="contain" accessible={false} />
        <View style={d.profileCopy}>
          <Pressable accessibilityRole="button" accessibilityLabel="设备信息" onPress={() => open('profile')}>
            <Label size={18} numberOfLines={1}>{deviceName}</Label>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="复制设备编号" onPress={() => copyDeviceCode(toast)} style={d.code}>
            <Label size={14} tint={color.muted}>DN: {sampleDn}</Label><Icon name="copy-outline" size={13} tint={color.muted} />
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="编辑设备信息" onPress={() => open('profile')} style={d.profileArrow}>
          <Icon name="chevron-forward" size={18} tint={color.muted} />
        </Pressable>
      </View>
      <View style={[s.card, d.group]}>
        <Row label="首页样式" value={modeLabel} onPress={() => setModeDraft(mode)} last />
      </View>
      {groups.map(group => <View key={group.title} style={d.section}>
        {!!group.title && <Label size={15} tint={color.secondaryText} style={d.heading}>{group.title}</Label>}
        <View style={s.card}>
          {group.items.map((id, index) => {
            const item = settings[id];
            return <Pressable key={id} accessibilityRole="button" onPress={() => open(id)}
              style={({ pressed }) => [d.setting, pressed && s.pressed]}>
              <View style={[d.badge, { backgroundColor: item.tint }]}><Icon name={item.icon} size={17} tint="#fff" /></View>
              <View style={[d.settingBody, index < group.items.length - 1 && s.divider]}>
                <Label size={17}>{item.label}</Label><Icon name="chevron-forward" size={17} tint={color.muted} />
              </View>
            </Pressable>;
          })}
        </View>
      </View>)}
      <View style={d.actions}>
        <Pressable accessibilityRole="button" onPress={() => setConfirmation('restart')} style={[s.card, d.action]}>
          <Label size={17} tint={color.mintText}>重启设备</Label>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setConfirmation('remove')} style={[s.card, d.action]}>
          <Label size={17} tint="#dc565b">删除设备</Label>
        </Pressable>
      </View>
    </ScrollView>
    {modeDraft && <Sheet title="首页样式" close={() => setModeDraft(undefined)} confirm={() => {
      setModeDraft(undefined);
      if (modeDraft !== mode) chooseMode(modeDraft);
    }}>
      <View style={d.group}>
        {homeModes.map((item, index) => <Choice key={item.id} label={item.label} selected={modeDraft === item.id}
          onPress={() => setModeDraft(item.id)} last={index === homeModes.length - 1} />)}
      </View>
    </Sheet>}
    {confirmation && <Sheet title={confirmation === 'restart' ? '重启设备' : '删除设备'} close={() => setConfirmation(undefined)}
      confirm={() => {
        setConfirmation(undefined);
        if (confirmation === 'restart') restart();
        else remove();
      }}>
      <Label size={15} style={d.confirmation}>
        {confirmation === 'restart' ? `重启「${deviceName}」？` : `删除「${deviceName}」后需要重新配网。确定删除？`}
      </Label>
    </Sheet>}
  </>;
}

function Choice({ label, selected, onPress, last }: {
  label: string; selected: boolean; onPress: () => void; last?: boolean;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} aria-checked={selected}
    accessibilityState={{ checked: selected }} onPress={onPress} style={[d.choice, !last && s.divider]}>
    <Label size={16}>{label}</Label><SelectionCheck checked={selected} />
  </Pressable>;
}

export function DeviceSettingDetails({ id, deviceName, preferences, update, rename, restart, viewRecordings, toast }: {
  id: DeviceSetting; deviceName: string; preferences: DevicePreferences; update: (patch: Partial<DevicePreferences>) => void;
  rename: (name: string) => void; restart: () => void; viewRecordings: () => void; toast: (message: string) => void;
}) {
  const [name, setName] = useState(deviceName);
  const [restarting, setRestarting] = useState(false);
  let content: ReactNode;
  switch (id) {
    case 'profile':
      content = <>
        <Label size={14} tint={color.secondaryText}>设备名称</Label>
        <TextInput accessibilityLabel="设备名称" value={name} onChangeText={setName} maxLength={24} style={d.input} />
        <Row label="设备编号" value={sampleDn} onPress={() => copyDeviceCode(toast)} last />
        <PrimaryButton label="保存名称" disabled={!name.trim()} action={() => rename(name.trim())} />
      </>;
      break;
    case 'share':
      content = <>
        <Row label="设备名称" value={deviceName} />
        <Row label="设备编号" value={sampleDn} last />
        <PrimaryButton label="复制设备编号" action={() => copyDeviceCode(toast)} />
      </>;
      break;
    case 'network':
      content = <><Row label="连接方式" value="Wi-Fi" /><Row label="连接状态" value="已连接 · 演示" last /></>;
      break;
    case 'picture':
      content = (['超清', '高清'] as const).map((quality, index) => <Choice key={quality} label={quality}
        selected={preferences.quality === quality} onPress={() => update({ quality })} last={index === 1} />);
      break;
    case 'sound':
      content = <Row label="播放声音" last><Toggle label="播放声音" enabled={preferences.sound} onChange={sound => update({ sound })} /></Row>;
      break;
    case 'storage':
      content = <Row label="云录像" onPress={viewRecordings} last />;
      break;
    case 'indicator':
      content = <Row label="设备指示灯" last><Toggle label="设备指示灯" enabled={preferences.indicator} onChange={indicator => update({ indicator })} /></Row>;
      break;
    case 'callKey':
      content = (['APP通知', '微信通话'] as const).map((callChannel, index) => <Choice key={callChannel} label={callChannel}
        selected={preferences.callChannel === callChannel} onPress={() => update({ callChannel })} last={index === 1} />);
      break;
    case 'maintenance':
      content = <Row label="重启设备" onPress={() => setRestarting(true)} last />;
      break;
    case 'firmware':
      content = <Row label="设备版本" value="演示设备" last />;
      break;
    case 'manual':
      content = <View style={d.manual}>
        <Label size={16} bold>CN5 摄像机</Label>
        <Label size={14} tint={color.secondaryText}>完成扫码和配网后，可在 Miya 功能面板中打开实时视频，在画面底部切换回放和动态。</Label>
      </View>;
      break;
  }
  return <>
    <ScrollView contentContainerStyle={d.content} keyboardShouldPersistTaps="handled">
      <View style={[s.card, d.group, id === 'profile' && d.form]}>{content}</View>
    </ScrollView>
    {restarting && <Sheet title="重启设备" close={() => setRestarting(false)} confirm={() => { setRestarting(false); restart(); }}>
      <Label size={15} style={d.confirmation}>重启「{deviceName}」？</Label>
    </Sheet>}
  </>;
}

const d = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 24, gap: 16 },
  profile: { flexDirection: 'row', minHeight: 84, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  deviceImage: { width: 38, height: 38 },
  profileCopy: { flex: 1, minWidth: 0, gap: 3 },
  code: { flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'flex-start', minHeight: 25 },
  profileArrow: { minHeight: 42, width: 25, alignItems: 'flex-end', justifyContent: 'center' },
  group: { paddingHorizontal: 16 },
  section: { gap: 8 },
  heading: { paddingLeft: 1 },
  setting: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 9 },
  badge: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  settingBody: { flex: 1, minHeight: 59, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { paddingTop: 12, gap: 10 },
  action: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirmation: { paddingHorizontal: 16, paddingVertical: 12 },
  form: { paddingVertical: 13, gap: 8 },
  input: { borderRadius: 9, backgroundColor: color.canvas, color: color.text, fontSize: 16, padding: 10, minHeight: 42 },
  manual: { gap: 7, paddingVertical: 14 },
});
