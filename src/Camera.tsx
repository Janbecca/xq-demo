import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { color, Icon, IconButton, Label, s, type IconName } from './ui';

export type CameraTab = '实时视频' | '回放' | '动态';
export type PlaybackSample = { title: string; time: string };
type Toast = (message: string) => void;
const tabs: CameraTab[] = ['实时视频', '回放', '动态'];
const shortcuts = [
  { label: '回放', image: media.playback },
  { label: '动态', image: media.events },
  { label: '智慧生活', image: media.life },
  { label: 'AI智护', image: media.ai },
  { label: '设置', icon: 'settings-outline' as const },
];
const navigation: { label: string; name: IconName }[] = [
  { label: '首页', name: 'home' }, { label: '商城', name: 'bag-handle-outline' },
  { label: '云录像', name: 'cloud-upload' }, { label: '发现', name: 'compass-outline' },
  { label: '我的', name: 'happy-outline' },
];

export function Home({ deviceName, openCamera, openCare, openMiya, toast, safeBottom, banner, dismissBanner }: {
  deviceName: string;
  openCamera: (tab: CameraTab) => void; openCare: () => void; openMiya: () => void; toast: Toast; safeBottom: number;
  banner: boolean; dismissBanner: () => void;
}) {
  return <View style={s.fill}>
    <View style={c.homeHeader}>
      <Pressable accessibilityRole="button" onPress={() => toast(deviceName)} style={c.deviceTitle}>
        <Label size={20} numberOfLines={1} style={c.deviceName}>{deviceName}</Label>
        <Icon name="caret-down" size={11} />
      </Pressable>
      <View style={c.headerActions}>
        <View>
          <IconButton name="notifications" label="消息" size={24} onPress={() => openCamera('动态')} />
          <View pointerEvents="none" style={c.redDot} />
        </View>
        <IconButton name="ellipsis-horizontal-circle" label="更多" size={25} onPress={() => toast('当前设备 · ' + deviceName)} />
      </View>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={c.homeContent}>
      <Pressable accessibilityRole="button" accessibilityLabel="播放实时视频" onPress={() => openCamera('实时视频')} style={c.preview}>
        <Image source={media.cover} resizeMode="cover" style={c.fillImage} />
        <View style={c.play}><Icon name="play" size={16} tint="#fff" /></View>
      </Pressable>
      {banner && <View style={c.banner}>
        <Pressable accessibilityRole="button" accessibilityLabel="双11活动" style={StyleSheet.absoluteFill} onPress={() => toast('双11活动展示')}>
          <Image source={media.banner} resizeMode="stretch" style={c.fillImage} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="关闭活动横幅" onPress={dismissBanner} hitSlop={6} style={c.bannerClose}>
          <Icon name="close" size={19} tint="#fff" />
        </Pressable>
      </View>}
      <View style={[s.card, c.shortcutCard]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.shortcuts}>
          {shortcuts.map(({ label, image, icon }) => <Pressable key={label} accessibilityRole="button" onPress={() => {
            if (label === 'AI智护') openCare();
            else if (label === '回放' || label === '动态') openCamera(label);
            else toast(label + ' · 功能展示');
          }} style={c.shortcut}>
            {image ? <Image source={image} style={c.shortcutImage} resizeMode="contain" /> : <Icon name={icon!} size={29} tint="#78a8ee" />}
            <Label size={15}>{label}</Label>
          </Pressable>)}
        </ScrollView>
      </View>
      <View style={[s.card, c.tiles]}>
        <Pressable accessibilityRole="button" onPress={() => openCamera('回放')} style={[c.tile, c.cloudTile]}>
          <Label size={16}>云存储 <Icon name="flame" size={16} tint="#f88332" /></Label>
          <Label size={13} tint={color.muted}>随时看回放</Label>
          <Image source={media.cloud} style={c.cloudImage} resizeMode="contain" />
        </Pressable>
        <View style={c.sideTiles}>
          <Pressable accessibilityRole="button" onPress={() => toast('相册 · 暂无抓拍')} style={[c.tile, c.sideTile]}>
            <View><Label size={16}>相册</Label><Label size={13} tint={color.muted}>日常小快照</Label></View>
            <Image source={media.album} style={c.tileImage} resizeMode="contain" />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => toast('微信通话 · 功能展示')} style={[c.tile, c.sideTile]}>
            <View><Label size={16}>微信通话</Label><Label size={13} tint={color.muted}>快捷通话</Label></View>
            <Image source={media.call} style={c.tileImage} resizeMode="contain" />
            <View style={c.dots}><View style={c.dotActive} /><View style={c.dot} /></View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    <View style={[c.bottomNav, { paddingBottom: safeBottom }]}>
      {navigation.map(({ label, name }, index) => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: index === 0 }}
        accessibilityLabel={label} onPress={() => {
          if (index === 2) openCamera('回放');
          else if (index > 0) toast(label + ' · 功能展示');
        }} style={[c.navItem, index === 2 && c.cloudNav]}>
        {index === 2 ? <Image source={media.cloudTab} style={c.cloudNavImage} resizeMode="contain" /> : <Icon name={name} size={24} tint={index === 0 ? '#073e3c' : color.text} />}
        <Label size={index === 2 ? 11 : 10} bold={index === 2} tint={index === 2 ? '#ed9557' : color.text}>{label}</Label>
        {index === 3 && <View style={[c.redDot, c.navDot]} />}
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="打开 Miya 管家" onPress={openMiya}
      style={({ pressed }) => [c.miya, { bottom: safeBottom + 65 }, pressed && s.pressed]}>
      <Image source={media.miya} style={c.miyaAvatar} resizeMode="contain" />
      <Label size={10} bold tint={color.mintText}>Miya 管家</Label>
    </Pressable>
  </View>;
}

export function HomeBackground() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={['#c4dbf7', '#d9e7ec', '#d4f1e9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill} />
    <LinearGradient colors={['#f8f8f800', '#f8f8f8', '#f8f8f8']} locations={[0.22, 0.59, 1]} style={StyleSheet.absoluteFill} />
  </View>;
}

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

export function Camera({ initialTab, back, toast, safeBottom, playbackSample }: {
  initialTab: CameraTab; back: () => void; toast: Toast; safeBottom: number; playbackSample?: PlaybackSample;
}) {
  const [tab, setTab] = useState(initialTab);
  const [quality, setQuality] = useState(true);
  const [full, setFull] = useState(false);
  const [sound, setSound] = useState(false);
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
        <IconButton name="settings-outline" label="摄像机设置" tint="#fff" onPress={() => toast('摄像机设置 · 功能展示')} />
      </View>
      <View style={c.playerBottom}>
        <IconButton name="refresh" label="刷新画面" tint="#fff" onPress={() => { setOffset({ x: 0, y: 0 }); toast('已刷新样例画面'); }} />
        <View style={c.playerControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="切换清晰度" onPress={() => setQuality(!quality)} style={c.quality}>
            <Label tint="#fff" size={13}>{quality ? '超清' : '高清'}</Label>
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
  homeHeader: { height: 50, paddingLeft: 17, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deviceTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
  deviceName: { flexShrink: 1 },
  headerActions: { flexDirection: 'row' },
  redDot: { position: 'absolute', right: 8, top: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff494b' },
  homeContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 76, gap: 11 },
  miya: { position: 'absolute', right: 13, zIndex: 2, alignItems: 'center', justifyContent: 'center', gap: 2,
    minWidth: 61, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 19, backgroundColor: color.surface, borderWidth: 1,
    borderColor: color.line, boxShadow: '0 3px 10px rgba(20, 61, 73, 0.12)' },
  miyaAvatar: { width: 44, height: 44 },
  preview: { aspectRatio: 1.885, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  play: { backgroundColor: '#141517c9', height: 27, width: 27, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  banner: { aspectRatio: 4.04, borderRadius: 13, overflow: 'hidden' },
  bannerClose: { position: 'absolute', right: 4, top: 3, padding: 2 },
  shortcutCard: { paddingVertical: 12, overflow: 'hidden' },
  shortcuts: { alignItems: 'center' },
  shortcut: { width: 76, minHeight: 71, alignItems: 'center', justifyContent: 'center', gap: 8 },
  shortcutImage: { width: 34, height: 33 },
  tiles: { padding: 16, flexDirection: 'row', gap: 10, aspectRatio: 1.43 },
  tile: { backgroundColor: '#f0f1f5', borderRadius: 11, overflow: 'hidden' },
  cloudTile: { flex: 1, padding: 16 },
  cloudImage: { position: 'absolute', right: 4, bottom: 9, width: '68%', height: '32%' },
  sideTiles: { flex: 1.03, gap: 10 },
  sideTile: { flex: 1, paddingLeft: 15, paddingRight: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  tileImage: { width: 37, height: 37 },
  dots: { position: 'absolute', bottom: 8, left: '43%', flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 4, backgroundColor: '#d9dddb' },
  dotActive: { width: 13, height: 4, backgroundColor: color.mint },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'flex-end', minHeight: 55 },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 6, paddingBottom: 6 },
  navDot: { right: '32%', top: 6 },
  cloudNav: { marginTop: -17 },
  cloudNavImage: { width: 57, height: 44 },
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
