import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { color, Icon, IconButton, Label, s, type IconName } from './ui';

const miyaShortcuts = [
  { id: 'miyaTasks', label: '事件配置', icon: 'notifications-outline' },
  { id: 'miyaSummary', label: '今日总结', icon: 'layers-outline' },
  { id: 'miyaNotices', label: '事件通知', icon: 'mail-unread-outline' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type MiyaDestination = (typeof miyaShortcuts)[number]['id'];
export function MiyaLivePreview({ deviceName, openLive, openSettings }: {
  deviceName: string; openLive: () => void; openSettings: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return <View style={h.homeCamera}>
    <View style={h.cameraHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? '收起' : '展开'}实时视频，${deviceName}`}
        accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={({ pressed }) => [h.cameraTitle, pressed && s.pressed]}>
        <Label size={18} bold numberOfLines={1} style={h.cameraName}>{deviceName}</Label>
        <View style={h.online} />
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} tint={color.secondaryText} />
      </Pressable>
      <IconButton name="settings-outline" size={21} label="设置" onPress={openSettings} />
    </View>
    {expanded && <Pressable accessibilityRole="button" accessibilityLabel="播放实时视频" onPress={openLive}
      style={({ pressed }) => [h.preview, h.homePreview, pressed && s.pressed]}>
      <Image source={media.cover} resizeMode="cover" style={h.previewImage} accessible={false} />
      <View style={[h.previewLabel, h.currentCamera]}>
        <View style={h.currentDot} />
        <Label size={11} bold tint="#fff">当前相机</Label>
      </View>
      <View style={h.play}><Icon name="play" size={21} tint="#fff" /></View>
    </Pressable>}
  </View>;
}

export function MiyaFunctionMenu({ close, open, openLive, hasUnread, onScope, onSimulate }: {
  close: () => void; open: (destination: MiyaDestination) => void;
  openLive?: () => void; hasUnread: boolean;
  onScope?: () => void; onSimulate?: () => void;
}) {
  return <View style={[h.menuLayer, !openLive && h.homeMenuLayer]}>
    <Pressable accessibilityRole="button" accessibilityLabel="收起功能面板" style={h.backdrop} onPress={close} />
    <ScrollView style={[s.card, h.menu]} contentContainerStyle={h.menuContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {openLive && <Pressable accessibilityRole="button" accessibilityLabel="实时视频" onPress={openLive}
        style={({ pressed }) => [h.preview, pressed && s.pressed]}>
        <Image source={media.cover} resizeMode="cover" style={h.previewImage} accessible={false} />
        <View style={h.previewLabel}>
          <Icon name="play" size={15} tint="#fff" />
          <Label size={14} bold tint="#fff">实时视频</Label>
        </View>
      </Pressable>}
      <View style={h.miyaRow}>
        {miyaShortcuts.map(item => <Pressable key={item.id} accessibilityRole="button"
          accessibilityLabel={item.label + (item.id === 'miyaNotices' && hasUnread ? '，有未读通知' : '')} onPress={() => open(item.id)}
          style={({ pressed }) => [h.miyaItem, pressed && s.pressed]}>
          <View style={s.mintBadge}>
            <Icon name={item.icon} size={18} tint={color.mintText} />
            {item.id === 'miyaNotices' && hasUnread && <View pointerEvents="none" style={h.dot} />}
          </View>
          <Label size={12} numberOfLines={1}>{item.label}</Label>
        </Pressable>)}
      </View>
      {(onScope || onSimulate) && <View style={h.menuActions}>
        {onScope && <MenuAction label="设备范围" icon="videocam-outline" action={onScope} />}
        {onSimulate && <MenuAction label="模拟推送" icon="notifications-outline" action={onSimulate} />}
      </View>}
    </ScrollView>
  </View>;
}

function MenuAction({ label, icon, action }: { label: string; icon: IconName; action: () => void }) {
  return <Pressable accessibilityRole="button" onPress={action} style={({ pressed }) => [h.menuAction, pressed && s.pressed]}>
    <Icon name={icon} size={18} tint={color.secondaryText} />
    <Label size={14} style={s.fill}>{label}</Label>
    <Icon name="chevron-forward" size={14} tint={color.secondaryText} />
  </Pressable>;
}

const h = StyleSheet.create({
  homeCamera: { paddingHorizontal: 16, paddingBottom: 7 },
  cameraHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cameraTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 46, gap: 7 },
  cameraName: { flexShrink: 1 },
  online: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.green },
  menuLayer: { ...StyleSheet.absoluteFillObject, zIndex: 5, paddingBottom: 8 },
  homeMenuLayer: { justifyContent: 'flex-end', paddingHorizontal: 16 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#29343d18' },
  menu: { flexGrow: 0, flexShrink: 1, maxHeight: '100%', backgroundColor: color.surface,
    shadowColor: '#283542', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  menuContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 7 },
  preview: { aspectRatio: 1.885, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#35414a' },
  previewImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  previewLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1d262bc9' },
  homePreview: { justifyContent: 'center', alignItems: 'center' },
  currentCamera: { position: 'absolute', top: 10, left: 10 },
  currentDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  play: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', paddingLeft: 3, backgroundColor: '#1d262bc9' },
  miyaRow: { flexDirection: 'row', paddingTop: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  miyaItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 59, gap: 4 },
  menuActions: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  menuAction: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 10 },
  dot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff494b' },
});
