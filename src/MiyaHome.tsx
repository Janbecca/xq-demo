import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { media } from './demo';
import { color, Icon, Label, s, type IconName } from './ui';

const miyaShortcuts = [
  { id: 'miyaTasks', label: '事件配置', icon: 'notifications-outline' },
  { id: 'miyaSummary', label: '今日总结', icon: 'layers-outline' },
  { id: 'miyaNotices', label: '事件通知', icon: 'mail-unread-outline' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type MiyaDestination = (typeof miyaShortcuts)[number]['id'];
export function MiyaFunctionMenu({ close, open, openLive, hasUnread }: {
  close: () => void; open: (destination: MiyaDestination) => void;
  openLive: () => void; hasUnread: boolean;
}) {
  return <View style={h.menuLayer}>
    <Pressable accessibilityRole="button" accessibilityLabel="收起功能面板" style={h.backdrop} onPress={close} />
    <ScrollView style={[s.card, h.menu]} contentContainerStyle={h.menuContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="实时视频" onPress={openLive}
        style={({ pressed }) => [h.preview, pressed && s.pressed]}>
        <Image source={media.cover} resizeMode="cover" style={h.previewImage} accessible={false} />
        <View style={h.previewLabel}>
          <Icon name="play" size={15} tint="#fff" />
          <Label size={14} bold tint="#fff">实时视频</Label>
        </View>
      </Pressable>
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
    </ScrollView>
  </View>;
}

const summaryText = '宠物进食喝水，老人午间用餐，孩子短暂进入厨房，家人与宠物在客厅互动。';
const frames = [
  { left: '0%', top: '0%' },
  { left: '-100%', top: '0%' },
  { left: '0%', top: '-100%' },
  { left: '-100%', top: '-100%' },
] as const;

export function MiyaDailyBrief() {
  const [expanded, setExpanded] = useState(false);
  return <View style={[s.card, h.brief]}>
    <Label size={15} bold>今日摘要</Label>
    <Label size={13} tint={color.secondaryText} style={h.briefText}>{summaryText}</Label>
    <Pressable accessibilityRole="button" accessibilityLabel={expanded ? '收起录像缩略图' : '展开四张锁定录像缩略图'}
      aria-expanded={expanded} accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)}
      style={({ pressed }) => [h.briefToggle, pressed && s.pressed]}>
      <Icon name="lock-closed-outline" size={13} tint={color.mintText} />
      <Label size={12} tint={color.mintText}>录像 · 4 段</Label>
      <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} tint={color.mintText} />
    </Pressable>
    {expanded && <View accessibilityLabel="四张锁定录像缩略图" style={h.footage}>
      {frames.map(position => <View key={position.left + position.top} style={h.clip}>
        <Image source={media.summaryFootage} style={[h.frame, position]} resizeMode="stretch" accessible={false} />
        <View style={h.lock}><Icon name="lock-closed" size={15} tint="#fff" /></View>
      </View>)}
    </View>}
  </View>;
}

const h = StyleSheet.create({
  menuLayer: { ...StyleSheet.absoluteFillObject, zIndex: 5, paddingBottom: 8 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#29343d18' },
  menu: { flexGrow: 0, flexShrink: 1, maxHeight: '100%', backgroundColor: color.surface,
    shadowColor: '#283542', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  menuContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 7 },
  preview: { aspectRatio: 1.885, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#35414a' },
  previewImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  previewLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1d262bc9' },
  miyaRow: { flexDirection: 'row', paddingTop: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  miyaItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 59, gap: 4 },
  dot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff494b' },
  brief: { width: '100%', maxWidth: 306, padding: 12, gap: 4 },
  briefText: { lineHeight: 19 },
  briefToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 31, gap: 5 },
  footage: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 5 },
  clip: { width: '49%', aspectRatio: 16 / 9, borderRadius: 6, overflow: 'hidden', backgroundColor: '#48606b' },
  frame: { position: 'absolute', width: '200%', height: '200%' },
  lock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#13293670', alignItems: 'center', justifyContent: 'center' },
});
