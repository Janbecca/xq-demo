import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { PlaybackSample } from './Camera';
import { media, twoDigits } from './demo';
import { noticeActions, type MiyaNotice, type MiyaNoticeAction } from './miyaDemo';
import { color, Icon, Label, s } from './ui';

export function MiyaNoticeCard({ notice, read, play, openEvents, onAction }: {
  notice: MiyaNotice; read: (id: string) => void; play: (sample: PlaybackSample) => void;
  openEvents: () => void; onAction: (action: MiyaNoticeAction, notice: MiyaNotice) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const date = new Date(notice.createdAt);
  const time = `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
  const day = `${twoDigits(date.getMonth() + 1)}.${twoDigits(date.getDate())}`;
  const when = `${date.toDateString() === new Date().toDateString() ? '今天' : day} ${time}`;

  function handleNotice(action: () => void) {
    setMenuOpen(false);
    action();
    if (!notice.read) read(notice.id);
  }

  return <View style={[s.card, n.card]}>
    <View style={n.details}>
      <Label size={17} bold>{notice.event}</Label>
      <Label size={12} tint={color.secondaryText}>{notice.deviceName} · {when}</Label>
      <View style={n.source}>
        <Label size={12} tint={color.secondaryText}>来自关注</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={`配置关注事件 ${notice.event}`}
          hitSlop={4} onPress={() => handleNotice(openEvents)} style={({ pressed }) => pressed && s.pressed}>
          <Label size={12} tint={color.mintText}>「{notice.event}」</Label>
        </Pressable>
      </View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`回看通知 ${notice.event}，${notice.deviceName}，${when}`}
      onPress={() => handleNotice(() => play({ title: notice.event, time: `${day} ${time}` }))}
      style={({ pressed }) => [n.thumbnail, pressed && s.pressed]}>
      <Image source={media.frame} style={n.image} resizeMode="cover" accessible={false} />
      <View style={n.play}><Icon name="play" size={14} tint="#fff" /></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${notice.event}通知操作`}
      accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(open => !open)}
      style={({ pressed }) => [s.iconButton, menuOpen && n.activeMenu, pressed && s.pressed]}>
      <Icon name="ellipsis-horizontal" size={18} tint={menuOpen ? color.mintText : color.secondaryText} />
    </Pressable>
    {menuOpen && <View style={n.actions}>
      {noticeActions.map((action, index) => <Pressable key={action.id} accessibilityRole="button"
        style={({ pressed }) => [n.action, index > 0 && n.actionDivider, pressed && s.pressed]}
        onPress={() => handleNotice(() => onAction(action, notice))}>
        <Label size={13}>{action.label}</Label>
      </Pressable>)}
    </View>}
  </View>;
}

const n = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 82, paddingLeft: 12, borderWidth: 1, borderColor: '#dfe3e7' },
  details: { flex: 1, gap: 4, paddingVertical: 10, paddingRight: 6 },
  source: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  thumbnail: { width: 76, height: 55, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: color.canvas },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  play: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#141517b3', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  activeMenu: { backgroundColor: color.mintSurface, borderRadius: 12 },
  actions: { position: 'absolute', zIndex: 1, top: '50%', right: 45, transform: [{ translateY: -35 }],
    width: 150, borderWidth: 1, borderColor: '#dfe3e7', borderRadius: 10, backgroundColor: color.surface,
    shadowColor: '#283542', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  action: { height: 34, justifyContent: 'center', paddingHorizontal: 10 },
  actionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dfe3e7' },
});
