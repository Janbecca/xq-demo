import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { PlaybackSample } from './Camera';
import { media, twoDigits } from './demo';
import type { MiyaNotice } from './miyaDemo';
import { color, Icon, Label, s } from './ui';

export function MiyaNoticeCard({ notice, controls, showMenu = true, inBubble = false }: {
  notice: MiyaNotice;
  showMenu?: boolean;
  inBubble?: boolean;
  controls?: {
    read: (id: string) => void; play: (sample: PlaybackSample) => void;
    manage: (notice: MiyaNotice) => void; addEvent: (notice: MiyaNotice) => void;
  };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const date = new Date(notice.createdAt);
  const time = `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
  const day = `${twoDigits(date.getMonth() + 1)}.${twoDigits(date.getDate())}`;
  const when = `${date.toDateString() === new Date().toDateString() ? '今天' : day} ${time}`;
  const title = notice.title ?? notice.event;

  function handleNotice(action: () => void) {
    setMenuOpen(false);
    action();
    if (!notice.read) controls?.read(notice.id);
  }

  const thumbnail = <Image source={media.frame} style={n.image} resizeMode="cover" accessible={false} />;
  return <View style={[s.card, n.card, inBubble && n.inBubble]}>
    <View style={[n.body, controls && showMenu && n.bodyWithMenu]}>
      <View style={n.details}>
        <Label size={17} bold>{title}</Label>
        <Label size={12} tint={color.secondaryText}>{notice.deviceName} · {when}</Label>
        {!!notice.description && <Label size={13}>{notice.description}</Label>}
      </View>
      {controls ? <Pressable accessibilityRole="button" accessibilityLabel={`回看通知 ${title}，${notice.deviceName}，${when}`}
        onPress={() => handleNotice(() => controls.play({ title, time: `${day} ${time}` }))}
        style={({ pressed }) => [n.thumbnail, pressed && s.pressed]}>
        {thumbnail}
        <View style={n.play}><Icon name="play" size={14} tint="#fff" /></View>
      </Pressable> : <View style={n.thumbnail}>{thumbnail}</View>}
    </View>
    <View style={n.source}>
      <Label size={12} tint={color.secondaryText} style={n.sourceText}>
        {notice.fromFollowed === false ? '默认事件通知' : <>来自关注 <Label size={12} tint={color.mintText}>「{title}」</Label></>}
      </Label>
      {controls && <Pressable accessibilityRole="button" accessibilityLabel={`管理关注事件 ${title}`}
        hitSlop={5} onPress={() => handleNotice(() => controls.manage(notice))} style={({ pressed }) => [n.manage, pressed && s.pressed]}>
        <Label size={12} tint={color.mintText}>管理</Label>
      </Pressable>}
    </View>
    {controls && showMenu && <Pressable accessibilityRole="button" accessibilityLabel={`${title}通知操作`}
      accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(open => !open)}
      style={({ pressed }) => [s.iconButton, n.menuButton, menuOpen && n.activeMenu, pressed && s.pressed]}>
      <Icon name="ellipsis-horizontal" size={18} tint={menuOpen ? color.mintText : color.secondaryText} />
    </Pressable>}
    {controls && showMenu && menuOpen && <View style={n.actions}>
      <Pressable accessibilityRole="button" style={({ pressed }) => [n.action, pressed && s.pressed]}
        onPress={() => handleNotice(() => controls.addEvent(notice))}>
        <Label size={13}>新增关注事件</Label>
      </Pressable>
    </View>}
  </View>;
}

const n = StyleSheet.create({
  card: { paddingHorizontal: 13, paddingTop: 13, paddingBottom: 7, gap: 9, borderWidth: 1, borderColor: '#dfe3e7' },
  inBubble: { backgroundColor: 'transparent', borderWidth: 0 },
  body: { flexDirection: 'row', alignItems: 'center', minHeight: 60, gap: 8 },
  bodyWithMenu: { paddingRight: 24 },
  details: { flex: 1, minWidth: 0, gap: 5 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, paddingTop: 5 },
  sourceText: { flex: 1, minWidth: 0 },
  manage: { paddingHorizontal: 8, minHeight: 25, justifyContent: 'center', borderRadius: 12, backgroundColor: color.mintSurface },
  thumbnail: { width: 87, height: 60, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: color.canvas },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  play: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#141517b3', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  menuButton: { position: 'absolute', top: 4, right: 3, width: 32, height: 32, borderRadius: 10 },
  activeMenu: { backgroundColor: color.mintSurface },
  actions: { position: 'absolute', zIndex: 1, top: 7, right: 36,
    width: 150, borderWidth: 1, borderColor: '#dfe3e7', borderRadius: 10, backgroundColor: color.surface,
    shadowColor: '#283542', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  action: { height: 34, justifyContent: 'center', paddingHorizontal: 10 },
});
