import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { color, Icon, IconButton, Label, s, type IconName } from './ui';

export type CameraTab = '实时视频' | '回放' | '动态';
export type PlaybackSample = { title: string; time: string };
type Toast = (message: string) => void;
const tabs: CameraTab[] = ['实时视频', '回放', '动态'];
const directions = [
  { label: '向上', name: 'caret-up', x: 0, y: -1, placement: 'top' },
  { label: '向左', name: 'caret-back', x: -1, y: 0, placement: 'left' },
  { label: '向右', name: 'caret-forward', x: 1, y: 0, placement: 'right' },
  { label: '向下', name: 'caret-down', x: 0, y: 1, placement: 'bottom' },
] as const;
const placement = StyleSheet.create({
  top: { top: '4%', alignSelf: 'center' }, bottom: { bottom: '4%', alignSelf: 'center' },
  left: { left: '4%', top: '50%', marginTop: -22 }, right: { right: '4%', top: '50%', marginTop: -22 },
});

export function Camera({ initialTab, back, toast, safeBottom, playbackSample, openSettings, quality, setQuality, sound, setSound }: {
  initialTab: CameraTab; back: () => void; toast: Toast; safeBottom: number; playbackSample?: PlaybackSample;
  openSettings: () => void; quality: '超清' | '高清'; setQuality: (quality: '超清' | '高清') => void;
  sound: boolean; setSound: (sound: boolean) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [full, setFull] = useState(false);
  const [record, setRecord] = useState(false);
  const [talk, setTalk] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!full) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setFull(false); return true; });
    return () => subscription.remove();
  }, [full]);
  const actions: { name: IconName; label: string; active?: boolean; press: () => void }[] = [
    { name: 'camera-outline', label: '抓拍', press: () => toast('已触发样例抓拍') },
    { name: 'videocam-outline', label: '录制', active: record, press: () => { setRecord(!record); toast(record ? '样例录制已结束' : '样例录制已开始'); } },
    { name: sound ? 'volume-high-outline' : 'volume-mute-outline', label: '声音', active: sound, press: () => setSound(!sound) },
    { name: 'mic-outline', label: '对讲', active: talk, press: () => { setTalk(!talk); toast(talk ? '样例对讲已结束' : '样例对讲已开启'); } },
  ];
  return <View style={s.fill}>
    <View style={[c.player, full && c.fullPlayer]}>
      <Image source={media.frame} resizeMode="cover" style={[c.fillImage, {
        transform: [{ scale: offset.x || offset.y ? 1.13 : 1 }, { translateX: offset.x * -6 }, { translateY: offset.y * -6 }],
      }]} />
      <Label size={9} tint="#fff" style={c.timestamp}>{tab === '回放' && playbackSample ? playbackSample.time + ' · 样例' : '2026-11-09 09:10:05'}</Label>
      <View style={c.playerTop}>
        <IconButton name="chevron-back" label="返回" tint="#fff" onPress={full ? () => setFull(false) : back} />
        <IconButton name="settings-outline" label="摄像机设置" tint="#fff" onPress={openSettings} />
      </View>
      <View style={c.playerBottom}>
        <IconButton name="refresh" label="刷新画面" tint="#fff" onPress={() => { setOffset({ x: 0, y: 0 }); toast('已刷新样例画面'); }} />
        <View style={c.playerControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="切换清晰度" onPress={() => setQuality(quality === '超清' ? '高清' : '超清')} style={c.quality}>
            <Label tint="#fff" size={13}>{quality}</Label>
          </Pressable>
          <IconButton name={full ? 'contract-outline' : 'expand-outline'} label={full ? '退出全屏' : '全屏'} tint="#fff" onPress={() => setFull(!full)} />
        </View>
      </View>
    </View>
    {!full && <>
      <View style={c.cameraTabs}>{tabs.map(item => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item }}
        key={item} onPress={() => setTab(item)} style={c.cameraTab}>
        <Label size={18} bold={tab === item} tint={tab === item ? color.mint : color.text}>{item}</Label>
        {tab === item && <View style={c.underline} />}
      </Pressable>)}</View>
      {tab === '实时视频' ? <>
        <LinearGradient colors={[color.canvas, '#fcfcfc']} style={c.ptzArea}>
          <View style={c.ptz}>
            {directions.map(({ label, name, x, y, placement: edge }) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={label}
              onPress={() => setOffset(current => ({ x: Math.min(2, Math.max(-2, current.x + x)), y: Math.min(2, Math.max(-2, current.y + y)) }))}
              style={({ pressed }) => [c.direction, placement[edge], pressed && c.directionPressed]}>
              <Icon name={name} size={23} tint="#aeb4bd" />
            </Pressable>)}
            <Pressable accessibilityRole="button" accessibilityLabel="云台回中" style={c.ptzCenter} onPress={() => setOffset({ x: 0, y: 0 })} />
          </View>
        </LinearGradient>
        <View style={[c.cameraActions, { paddingBottom: safeBottom + 14 }]}>
          {actions.map(({ label, name, active, press }) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}
            onPress={press} style={c.cameraAction}>
            <Icon name={name} size={24} tint={active ? color.green : color.text} />
            <Label size={12} tint={active ? color.green : color.text}>{label}</Label>
          </Pressable>)}
        </View>
      </> : <View style={c.empty}>
        <Icon name={tab === '回放' ? 'film-outline' : 'notifications-outline'} size={42} tint="#abb2b6" />
        <Label tint={color.muted}>{tab === '回放' ? playbackSample ? playbackSample.title + ' · 样例回放预览' : '暂无回放录像' : '暂无设备动态'}</Label>
      </View>}
    </>}
  </View>;
}

const c = StyleSheet.create({
  fillImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  player: { aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: '#141414' },
  fullPlayer: { flex: 1, aspectRatio: undefined },
  timestamp: { position: 'absolute', top: 1, left: 5 },
  playerTop: { position: 'absolute', top: 15, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between' },
  playerBottom: { position: 'absolute', bottom: 8, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quality: { paddingVertical: 2, paddingHorizontal: 8, borderColor: '#fff', borderWidth: 1, borderRadius: 5 },
  cameraTabs: { height: 51, flexDirection: 'row', backgroundColor: '#fff' },
  cameraTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  underline: { position: 'absolute', bottom: 0, backgroundColor: color.mint, width: 22, height: 2, borderRadius: 2 },
  ptzArea: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 190 },
  ptz: { width: '68%', maxWidth: 270, maxHeight: '90%', aspectRatio: 1, backgroundColor: '#ffffff5c', borderRadius: 180,
    borderColor: '#e6e8ea', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ptzCenter: { width: '24%', aspectRatio: 1, borderRadius: 50, backgroundColor: '#eaedf3' },
  direction: { position: 'absolute', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  directionPressed: { backgroundColor: '#e3f4ef' },
  cameraActions: { flexDirection: 'row', minHeight: 106, paddingTop: 10 },
  cameraAction: { flex: 1, alignItems: 'center', gap: 5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
