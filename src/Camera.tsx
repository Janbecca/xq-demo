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
const navigation = [
  { label: '首页', name: 'home' },
  { label: 'Miya' },
  { label: '我的', name: 'happy-outline' },
] as const;
const summaryText = '宠物进食喝水，老人午间用餐，孩子短暂进入厨房，家人与宠物在客厅互动。';
const summaryFrames = [
  { left: '0%', top: '0%' },
  { left: '-100%', top: '0%' },
  { left: '0%', top: '-100%' },
  { left: '-100%', top: '-100%' },
] as const;

export function Home({ deviceName, openCamera, openCare, openMiya, miyaUnread, toast, safeBottom }: {
  deviceName: string;
  openCamera: (tab: CameraTab) => void; openCare: () => void; openMiya: () => void; toast: Toast; safeBottom: number;
  miyaUnread: boolean;
}) {
  const [showMiyaBubble, setShowMiyaBubble] = useState(true);
  const unreadLabel = miyaUnread ? '，有未读消息' : '';
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
        <Pressable accessibilityRole="button" accessibilityLabel={'首页顶部打开 Miya 管家' + unreadLabel} onPress={openMiya}
          style={({ pressed }) => [s.iconButton, pressed && s.pressed]}>
          <Image source={media.miyaHomeIcon} style={c.miyaHeaderIcon} resizeMode="contain" accessible={false} />
          {miyaUnread && <View pointerEvents="none" style={[c.redDot, c.miyaHeaderDot]} />}
        </Pressable>
      </View>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={c.homeContent}>
      <Pressable accessibilityRole="button" accessibilityLabel="播放实时视频" onPress={() => openCamera('实时视频')} style={c.preview}>
        <Image source={media.cover} resizeMode="cover" style={c.fillImage} />
        <View style={c.play}><Icon name="play" size={16} tint="#fff" /></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`今日摘要。${summaryText} 四段录像已锁定。`}
        accessibilityHint="打开 Miya 管家对话" onPress={openMiya}
        style={({ pressed }) => [s.card, c.summary, pressed && s.pressed]}>
        <LinearGradient colors={['#e3f2ff', '#f1faf7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={c.summaryCopy}>
          <View style={c.summaryTitle}>
            <Image source={media.miya} style={c.summaryAvatar} resizeMode="contain" accessible={false} />
            <Label size={17} bold>今日摘要</Label>
            <Icon name="chevron-forward" size={13} tint={color.secondaryText} />
          </View>
          <Label size={13} tint={color.secondaryText} style={c.summaryText}>{summaryText}</Label>
        </View>
        <View style={c.summaryFootage} pointerEvents="none">
          {summaryFrames.map((position, index) => <View key={index} style={c.summaryClip}>
            <Image source={media.summaryFootage} style={[c.summaryFrame, position]} resizeMode="stretch" accessible={false} />
            <View style={c.summaryLock}><Icon name="lock-closed" size={12} tint="#fff" /></View>
          </View>)}
        </View>
      </Pressable>
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
      {navigation.map(item => {
        const miya = item.label === 'Miya';
        const selected = item.label === '首页';
        return <Pressable key={item.label} accessibilityRole="tab" accessibilityState={{ selected }}
          accessibilityLabel={item.label + (miya ? unreadLabel : '')} onPress={miya ? openMiya : item.label === '我的' ? () => toast('我的 · 功能展示') : undefined}
          style={c.navItem}>
          {miya ? <View>
            <Image source={media.miya} style={c.miyaNavImage} resizeMode="contain" accessible={false} />
            {miyaUnread && <View pointerEvents="none" style={[c.redDot, c.miyaNavDot]} />}
          </View> : <Icon name={item.name} size={24} tint={selected ? '#073e3c' : color.text} />}
          <Label size={11} bold={miya} tint={miya ? color.mintText : color.text}>{item.label}</Label>
        </Pressable>;
      })}
    </View>
    {showMiyaBubble && <View style={[c.miya, { bottom: safeBottom + 65 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'打开 Miya 管家' + unreadLabel} onPress={openMiya}
        style={({ pressed }) => [c.miyaTrigger, pressed && s.pressed]}>
        <Image source={media.miya} style={c.miyaAvatar} resizeMode="contain" accessible={false} />
        {miyaUnread && <View pointerEvents="none" style={[c.redDot, c.miyaBubbleDot]} />}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭 Miya 悬浮气泡" onPress={() => setShowMiyaBubble(false)}
        hitSlop={6} style={({ pressed }) => [c.miyaClose, pressed && s.pressed]}>
        <Icon name="close" size={12} tint={color.secondaryText} />
      </Pressable>
    </View>}
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
  miyaHeaderIcon: { width: 30, height: 30 },
  miyaHeaderDot: { right: 5, top: 5 },
  miya: { position: 'absolute', right: 13, zIndex: 2 },
  miyaTrigger: { alignItems: 'center', justifyContent: 'center', minWidth: 61, paddingHorizontal: 7, paddingVertical: 5 },
  miyaBubbleDot: { left: 8, right: undefined, top: 6 },
  miyaClose: { position: 'absolute', right: 0, top: 0, width: 18, height: 18, borderRadius: 9,
    backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: '#d7dadd', alignItems: 'center', justifyContent: 'center' },
  miyaAvatar: { width: 44, height: 44 },
  preview: { aspectRatio: 1.885, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  play: { backgroundColor: '#141517c9', height: 27, width: 27, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  summary: { paddingHorizontal: 13, paddingVertical: 11, gap: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  summaryCopy: { flex: 1, minWidth: 0, gap: 3 },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  summaryAvatar: { width: 30, height: 30 },
  summaryText: { lineHeight: 19 },
  summaryFootage: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4 },
  summaryClip: { width: '48.5%', aspectRatio: 16 / 9, borderRadius: 5, overflow: 'hidden', backgroundColor: '#48606b' },
  summaryFrame: { position: 'absolute', width: '200%', height: '200%' },
  summaryLock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#13293670', alignItems: 'center', justifyContent: 'center' },
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
  miyaNavImage: { width: 41, height: 41 },
  miyaNavDot: { right: 0, top: 1 },
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
