import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const color = {
  text: '#292d30', muted: '#969a9e', surface: '#fff', canvas: '#f0f1f5',
  line: '#f0f1f2', mint: '#11c6a0', green: '#36ae98', orange: '#ffa34b',
};

export const icon = Ionicons;
export type IconName = ComponentProps<typeof Ionicons>['name'];
export const deviceName = '摄像机CN5蝴蝶结';

export function Label({ children, size = 16, tint = color.text, bold = false, style, ...props }: ComponentProps<typeof Text> & {
  size?: number; tint?: string; bold?: boolean;
}) {
  return <Text {...props} style={[{ color: tint, fontSize: size, fontWeight: bold ? '600' : '400' }, style]}>{children}</Text>;
}

export function Icon({ name, size = 22, tint = color.text }: { name: IconName; size?: number; tint?: string }) {
  return <Ionicons name={name} size={size} color={tint} aria-hidden accessibilityElementsHidden importantForAccessibility="no" />;
}

export function IconButton({ name, label, onPress, tint, size }: {
  name: IconName; label: string; onPress: () => void; tint?: string; size?: number;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={3} onPress={onPress}
    style={({ pressed }) => [s.iconButton, pressed && s.pressed]}>
    <Icon name={name} size={size} tint={tint} />
  </Pressable>;
}

export function PrimaryButton({ label, action, disabled }: { label: string; action: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
    style={({ pressed }) => [s.primary, disabled && s.primaryDisabled, pressed && s.pressed]}>
    <Label size={17} tint="#fff">{label}</Label>
  </Pressable>;
}

export function Header({ title, back, onTitlePress, compact = false }: {
  title: string; back: () => void; onTitlePress?: () => void; compact?: boolean;
}) {
  return <View style={[s.header, compact && s.compactHeader]}>
    <View style={s.back}><IconButton name="chevron-back" size={24} label="返回" onPress={back} /></View>
    {onTitlePress ? <Pressable accessibilityRole="button" onPress={onTitlePress} style={s.titleButton}>
      <Label size={18} bold numberOfLines={1} style={s.titleText}>{title}</Label><Icon name="chevron-down" size={16} />
    </Pressable> : <Label size={compact ? 16 : 20} bold>{title}</Label>}
  </View>;
}

export function Row({ label, value, onPress, children, last, height = 61 }: {
  label: string; value?: string; onPress?: () => void; children?: ReactNode; last?: boolean; height?: number;
}) {
  const content = <><Label size={17}>{label}</Label>
    <View style={s.rowEnd}>{children}{value !== undefined && <Label size={15} tint={color.muted} numberOfLines={1} style={s.rowValue}>{value}</Label>}
      {onPress && <Icon name="chevron-forward" size={17} tint={color.muted} />}
    </View></>;
  const style = [s.row, { minHeight: height }, !last && s.divider];
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={style}>{content}</Pressable> : <View style={style}>{content}</View>;
}

export function Segments({ labels, selected, onChange, style, equal = false }: {
  labels: readonly string[]; selected: number; onChange: (index: number) => void; style?: ComponentProps<typeof View>['style']; equal?: boolean;
}) {
  return <View style={[s.segments, style]}>
    {labels.map((label, index) => <Pressable key={label} accessibilityRole="tab" aria-selected={index === selected} accessibilityState={{ selected: index === selected }}
      onPress={() => onChange(index)} style={[s.segment, equal && s.equalSegment, index === selected && s.activeSegment]}>
      <Label size={13} tint={index === selected ? '#fff' : '#8e9295'}>{label}</Label>
    </Pressable>)}
  </View>;
}

export function Toggle({ label, enabled, disabled, onChange }: {
  label: string; enabled: boolean; disabled?: boolean; onChange: (value: boolean) => void;
}) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: enabled, disabled }}
    disabled={disabled} hitSlop={8} onPress={() => onChange(!enabled)} style={[s.toggle, enabled && s.toggleOn, disabled && s.pressed]}>
    <View style={s.thumb} />
  </Pressable>;
}

export function Sheet({ title, close, confirm, confirmDisabled = false, mutedCancel, children }: {
  title?: string; close: () => void; confirm: () => void; confirmDisabled?: boolean; mutedCancel?: boolean; children: ReactNode;
}) {
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
    <View style={s.modal}>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭弹层" onPress={close} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[s.sheet, { maxHeight: height * 0.87, paddingBottom: Math.max(Platform.OS === 'web' ? 12 : 4, bottom) }]}>
        <View style={s.sheetHeader}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={close}><Label size={15} tint={mutedCancel ? '#878b8e' : color.mint}>取消</Label></Pressable>
          {title && <Label size={17} bold>{title}</Label>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: confirmDisabled }} disabled={confirmDisabled} hitSlop={8} onPress={confirm}>
            <Label size={15} tint={confirmDisabled ? color.muted : color.mint}>确定</Label>
          </Pressable>
        </View>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}

export const s = StyleSheet.create({
  fill: { flex: 1 },
  pressed: { opacity: 0.58 },
  card: { backgroundColor: color.surface, borderRadius: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  primary: { minHeight: 51, borderRadius: 28, backgroundColor: color.mint, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  primaryDisabled: { backgroundColor: '#b3e9dc' },
  header: { height: 47, justifyContent: 'center', alignItems: 'center' },
  compactHeader: { height: 35 },
  titleButton: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '76%' },
  titleText: { flexShrink: 1 },
  back: { position: 'absolute', left: 9, zIndex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowEnd: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  rowValue: { flexShrink: 1 },
  segments: { backgroundColor: '#f6f6f7', flexDirection: 'row', borderRadius: 22, padding: 2 },
  segment: { alignItems: 'center', justifyContent: 'center', borderRadius: 22, minHeight: 28, paddingHorizontal: 10 },
  equalSegment: { flex: 1 },
  activeSegment: { backgroundColor: color.mint },
  toggle: { width: 42, height: 25, padding: 2, borderRadius: 14, backgroundColor: '#c8c9cb', justifyContent: 'center', alignItems: 'flex-start' },
  toggleOn: { backgroundColor: color.green, alignItems: 'flex-end' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  modal: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(24,24,28,0.24)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 19, borderTopRightRadius: 19, width: '100%', maxWidth: 460, overflow: 'hidden' },
  sheetHeader: { paddingHorizontal: 17, height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
