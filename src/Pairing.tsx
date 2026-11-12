import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { media } from './demo';
import { color, Icon, IconButton, Label, PrimaryButton, Row, s, Sheet } from './ui';

export type PairStage = 'prepare' | 'network' | 'connecting';
const steps = ['准备', '选择网络', '连接设备'];
const stageIndex: Record<PairStage, number> = { prepare: 0, network: 1, connecting: 2 };
const categories = ['锁具', '猫眼', '摄像机', '网关', '保险箱'];
const networks = ['777', 'Home_2.4G', 'Camera_2.4G'];
const assets = {
  scan: require('../assets/pair-scan.jpg'),
  wifi: require('../assets/pair-wifi.png'),
  bluetooth: require('../assets/pair-bluetooth.png'),
  bluetoothRing: require('../assets/pair-bluetooth-ring.png'),
  connect: require('../assets/pair-connect.png'),
  connectRing: require('../assets/pair-connect-ring.png'),
};

export const pairingBackground = '#f2f3f7';
const muted = '#7e8287';
const web = Platform.OS === 'web';
const useKeyboardPadding = Platform.OS === 'ios' ? 'padding' : undefined;

export function EmptyHome({ add }: { add: () => void }) {
  return <View style={p.emptyHome}>
    <Pressable accessibilityRole="button" accessibilityLabel="添加设备" onPress={add}
      style={({ pressed }) => [p.addDevice, pressed && s.pressed]}>
      <Icon name="add" size={64} tint={color.mint} />
    </Pressable>
  </View>;
}

function useLoop(active: boolean, duration: number, easing = Easing.linear) {
  const phase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    phase.setValue(0);
    const animation = Animated.loop(Animated.timing(phase, {
      toValue: 1, duration, easing, useNativeDriver: !web, isInteraction: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [active, duration, easing, phase]);
  return phase;
}

export function DeviceScanner({ active, onScan, toast }: { active: boolean; onScan: () => void; toast: (message: string) => void }) {
  const { width, height } = useWindowDimensions();
  const [category, setCategory] = useState('摄像机');
  const [lit, setLit] = useState(false);
  const [sheet, setSheet] = useState<'help' | 'share' | 'album' | null>(null);
  const frameSize = Math.min((web ? Math.min(width, 393) : width) * 0.54, height * 0.3, 250);
  const phase = useLoop(active, 3200);
  const scan = () => {
    setSheet(null);
    if (category === '摄像机') onScan();
    else toast('当前演示支持摄像机，请切换设备类型');
  };
  const close = () => setSheet(null);

  return <>
    <View style={p.scanner}>
      <Image source={assets.scan} resizeMode="cover" style={p.fillImage} />
      {lit && <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, p.lit]} />}
      <View style={p.scanGuide}>
        <View style={[p.scanFrame, { width: frameSize, height: frameSize }]}>
          <Animated.View pointerEvents="none" aria-hidden style={[p.grid, {
            transform: [{ translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [-frameSize * 0.3, frameSize * 0.47] }) }],
          }]}>
            <Svg width="100%" height="100%">
              <Defs><Pattern id="scanner-grid" width={5} height={5} patternUnits="userSpaceOnUse">
                <Path d="M0 5 V0 H5" fill="none" stroke="#fff" strokeWidth={0.55} opacity={0.56} />
              </Pattern></Defs>
              <Rect width="100%" height="100%" fill="url(#scanner-grid)" />
            </Svg>
            <LinearGradient colors={['#f3fffb00', '#f3fffb18', '#f3fffbd9']} style={StyleSheet.absoluteFill} />
            <View style={p.scanLine} />
          </Animated.View>
          <View pointerEvents="none" style={[p.corner, p.topLeft]} /><View pointerEvents="none" style={[p.corner, p.topRight]} />
          <View pointerEvents="none" style={[p.corner, p.bottomLeft]} /><View pointerEvents="none" style={[p.corner, p.bottomRight]} />
          <Pressable accessibilityRole="button" accessibilityLabel={lit ? '关闭手电筒' : '打开手电筒'} onPress={() => setLit(!lit)} style={p.flash}>
            <Icon name={lit ? 'flashlight' : 'flashlight-outline'} size={21} tint="#fff" />
            <Label size={12} tint="#fff">{lit ? '轻触关闭' : '轻触点亮'}</Label>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setSheet('help')} hitSlop={5} style={p.scanHelp}>
          <Label size={14} tint={color.mint}>二维码在哪？</Label>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={scan} style={p.demoScan}>
          <Icon name="scan-outline" size={15} tint="#fff" /><Label size={13} tint="#fff">模拟扫码</Label>
        </Pressable>
      </View>
      <View style={p.scanActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="分享设备" onPress={() => setSheet('share')} style={p.scanAction}>
          <View style={p.scanActionIcon}><Icon name="enter-outline" size={26} tint="#fff" /></View><Label size={14} tint="#fff">分享设备</Label>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="相册" onPress={() => setSheet('album')} style={p.scanAction}>
          <View style={p.scanActionIcon}><Icon name="image" size={25} tint="#fff" /></View><Label size={14} tint="#fff">相册</Label>
        </Pressable>
      </View>
    </View>
    <View style={p.categories}>
      {categories.map(item => <Pressable accessibilityRole="tab" accessibilityState={{ selected: item === category }}
        key={item} style={p.category} onPress={() => setCategory(item)}>
        <Label size={16} tint={item === category ? '#fff' : '#a7a7a7'}>{item}</Label>
      </Pressable>)}
    </View>
    {sheet && <Sheet title={sheet === 'help' ? '二维码在哪？' : sheet === 'share' ? '分享设备' : '相册'} close={close}
      confirm={sheet === 'album' ? scan : close}>
      <Label size={15} style={p.sheetCopy}>
        {sheet === 'help' ? '在摄像机机身底部或铭牌上查找二维码，并将二维码对准扫描框。'
          : sheet === 'share' ? '共享设备的添加入口。此演示可通过「模拟扫码」添加一台示例摄像机。'
          : '在此演示中，点击「确定」使用示例二维码继续。'}
      </Label>
    </Sheet>}
  </>;
}

export function PairingStep({ stage, active, next }: { stage: PairStage; active: boolean; next: () => void }) {
  return <View style={s.fill}>
    <StepProgress stage={stage} />
    {stage === 'prepare' && <Prepare active={active} next={next} />}
    {stage === 'network' && <Network next={next} />}
    {stage === 'connecting' && <Connecting active={active} next={next} />}
  </View>;
}

function StepProgress({ stage }: { stage: PairStage }) {
  const current = stageIndex[stage];
  return <View accessible accessibilityLabel={`配网进度，第 ${current + 1} 步，共 ${steps.length} 步，${steps[current]}`} style={p.stepper}>
    <View style={p.track}><View style={[p.trackDone, { width: `${current / (steps.length - 1) * 100}%` }]} /></View>
    {steps.map((step, index) => <View key={step} style={p.step}>
      <View style={[p.stepHalo, index <= current && p.stepHaloOn]}>
        <View style={[p.stepDot, index <= current && p.stepDotOn]} />
      </View>
      <Label size={16} tint={index <= current ? color.mint : muted}>{step}</Label>
    </View>)}
  </View>;
}

function StepFooter({ label, action, disabled, help }: { label: string; action: () => void; disabled?: boolean; help?: () => void }) {
  const { height } = useWindowDimensions();
  const reserve = Math.max(help ? 38 : 14, Math.min(63, (height - 620) * 0.25));
  return <View style={p.footer}>
    <PrimaryButton label={label} action={action} disabled={disabled} />
    <View style={{ height: reserve }}>
      {help && <Pressable accessibilityRole="button" onPress={help} style={p.helpButton}>
        <Label size={16} tint={color.mint}>未听到设备播报？</Label>
      </Pressable>}
    </View>
  </View>;
}

function Pulse({ connecting = false, active, size }: { connecting?: boolean; active: boolean; size: number }) {
  const phase = useLoop(active, 4300);
  return <View style={[p.pulse, { width: size, height: size }]}>
    <Animated.Image source={connecting ? assets.connectRing : assets.bluetoothRing} style={[p.fillImage, {
      transform: [{ rotate: phase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
    }]} />
    <Image source={connecting ? assets.connect : assets.bluetooth} style={p.pulseSymbol} resizeMode="contain" />
  </View>;
}

function DeviceStatus({ active, mode }: { active: boolean; mode: 'searching' | 'found' | 'connecting' }) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(294, width * 0.75, height * 0.36);
  return <ScrollView style={s.fill} contentContainerStyle={p.statusContent} showsVerticalScrollIndicator={false}>
    <View style={[p.deviceStage, { height: Math.min(369, height * 0.418) }]}>
      {mode === 'found'
        ? <Image accessibilityIgnoresInvertColors source={media.pairCamera} style={{ width: size * 0.6, height: size * 0.6 }} resizeMode="contain" />
        : <Pulse connecting={mode === 'connecting'} active={active} size={size} />}
    </View>
    <Label size={14} tint={mode === 'connecting' ? muted : color.text} accessibilityLiveRegion="polite" style={p.statusText}>
      {mode === 'connecting' ? '扫描CN5设备中，配网过程中请避免设备断电..' : mode === 'found' ? '已发现设备' : '扫描附近CN5设备中..'}
    </Label>
    {mode !== 'connecting' && <Label size={14} tint={muted} style={p.resetText}>（长按Reset键进入CN5配网模式）</Label>}
  </ScrollView>;
}

function Prepare({ active, next }: { active: boolean; next: () => void }) {
  const [found, setFound] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    if (!active || found) return;
    const timer = setTimeout(() => setFound(true), 2100);
    return () => clearTimeout(timer);
  }, [active, found]);
  const close = () => setHelp(false);
  return <>
    <DeviceStatus active={active} mode={found ? 'found' : 'searching'} />
    <StepFooter label="下一步" action={next} disabled={!found} help={found ? () => setHelp(true) : undefined} />
    {help && <Sheet title="未听到设备播报？" close={close} confirm={close}>
      <Label size={15} style={p.sheetCopy}>给摄像机接通电源，长按 Reset 键进入 CN5 配网模式，听到设备提示音后继续。</Label>
    </Sheet>}
  </>;
}

function Network({ next }: { next: () => void }) {
  const { height } = useWindowDimensions();
  const [network, setNetwork] = useState(networks[0]);
  const [draft, setDraft] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const changeNetwork = (value: string) => {
    if (value !== network) {
      setNetwork(value);
      setPassword('');
      setShowPassword(false);
    }
    setDraft(null);
  };
  const submit = () => {
    setPassword('');
    setShowPassword(false);
    next();
  };
  const wifiSize = Math.min(174, height * 0.2);
  return <KeyboardAvoidingView behavior={useKeyboardPadding} style={s.fill}>
    <ScrollView style={s.fill} contentContainerStyle={p.networkContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Image source={assets.wifi} style={{ width: wifiSize, height: wifiSize, alignSelf: 'center' }} resizeMode="contain" />
      <View style={p.networkNotes}>
        <View style={p.note}><View style={p.bullet} /><Label size={14} tint={muted} style={p.noteText}>请确保接入网络可正常使用。</Label></View>
        <View style={p.note}><View style={p.bullet} /><Label size={14} tint={muted} style={p.noteText}>请勿连接公共Wi-Fi、办公Wi-Fi等需要验证码或页面登录的Wi-Fi。</Label></View>
      </View>
      <View style={[s.card, p.networkCard]}>
        <View style={p.networkLabels}><Label size={17}>Wi-Fi名称</Label><Label size={14} tint="#e89e50">仅支持2.4GHz Wi-Fi</Label></View>
        <View style={[s.row, s.divider, p.networkRow]}>
          <Label size={17} numberOfLines={1} style={p.ssid}>{network}</Label>
          <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setDraft(network); }} hitSlop={6}>
            <Label size={15} tint={color.mint}>切换网络</Label>
          </Pressable>
        </View>
        <Label size={17} style={p.passwordLabel}>Wi-Fi密码</Label>
        <View style={[s.divider, p.passwordRow]}>
          <TextInput accessibilityLabel="Wi-Fi密码" placeholder="请输入 Wi-Fi 密码" placeholderTextColor="#b9bdc0"
            secureTextEntry={!showPassword} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false}
            autoComplete="off" returnKeyType="next" onSubmitEditing={submit} style={p.input} />
          <IconButton name={showPassword ? 'eye-outline' : 'eye-off-outline'} label={showPassword ? '隐藏Wi-Fi密码' : '显示Wi-Fi密码'}
            tint="#a0a6aa" onPress={() => setShowPassword(!showPassword)} />
        </View>
      </View>
    </ScrollView>
    <StepFooter label="下一步" action={submit} />
    {draft !== null && <Sheet title="切换网络" close={() => setDraft(null)} confirm={() => changeNetwork(draft)}>
      <View style={p.sheetOptions}>
        {networks.map(item => <Row key={item} label={item} onPress={() => setDraft(item)}>
          <Icon name={item === draft ? 'checkmark-circle' : 'ellipse-outline'} size={21} tint={item === draft ? color.mint : color.muted} />
        </Row>)}
      </View>
    </Sheet>}
  </KeyboardAvoidingView>;
}

function Connecting({ active, next }: { active: boolean; next: () => void }) {
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(next, 2600);
    return () => clearTimeout(timer);
  }, [active, next]);
  return <DeviceStatus active={active} mode="connecting" />;
}

export function DeviceName({ confirm }: { confirm: (name: string) => void }) {
  const [name, setName] = useState('CN5摄像机');
  const input = useRef<TextInput>(null);
  const trimmed = name.trim();
  const submit = () => {
    if (trimmed) confirm(trimmed);
  };
  return <View style={[s.card, p.nameContent]}>
    <View style={p.nameCard}>
      <TextInput ref={input} accessibilityLabel="设备名称" value={name} onChangeText={setName} maxLength={32}
        returnKeyType="done" onSubmitEditing={submit} placeholder="请输入设备名称" placeholderTextColor="#b9bdc0" style={p.input} />
      <IconButton name="close" label="清空设备名称" tint="#a0a6aa" size={24} onPress={() => { setName(''); input.current?.focus(); }} />
    </View>
    <PrimaryButton label="确认名称" action={submit} disabled={!trimmed} />
  </View>;
}

const p = StyleSheet.create({
  emptyHome: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  addDevice: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f9f7', borderRadius: 54 },
  scanner: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#393b3c' },
  fillImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  lit: { backgroundColor: '#ffffff24' },
  scanGuide: { position: 'absolute', top: '25%', width: '100%', alignItems: 'center' },
  scanFrame: { borderWidth: 1, borderColor: '#ffffffd9', overflow: 'hidden', alignItems: 'center' },
  corner: { position: 'absolute', width: 13, height: 13, borderColor: color.mint },
  topLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  grid: { width: '100%', height: '47%', position: 'absolute', top: '13%' },
  scanLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#f6fffc' },
  flash: { position: 'absolute', bottom: '24%', alignItems: 'center', gap: 8, padding: 4 },
  scanHelp: { paddingVertical: 9, marginTop: 2 },
  demoScan: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 17, backgroundColor: '#252927a8' },
  scanActions: { position: 'absolute', bottom: '4%', left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between' },
  scanAction: { minWidth: 57, alignItems: 'center', gap: 7 },
  scanActionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29292985' },
  categories: { height: 79, paddingHorizontal: 11, backgroundColor: '#050505', flexDirection: 'row', alignItems: 'stretch' },
  category: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepper: { position: 'relative', flexDirection: 'row', marginHorizontal: 25, marginTop: 21, height: 65 },
  track: { position: 'absolute', height: 2, top: 12, left: '12.5%', right: '12.5%', backgroundColor: '#c9cbcd' },
  trackDone: { height: '100%', backgroundColor: color.mint },
  step: { flex: 1, alignItems: 'center', gap: 10 },
  stepHalo: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e9eaec6b', alignItems: 'center', justifyContent: 'center' },
  stepHaloOn: { backgroundColor: '#13c7a13d' },
  stepDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#e1e3e5' },
  stepDotOn: { backgroundColor: color.mint },
  footer: { paddingHorizontal: 13, paddingTop: 9 },
  helpButton: { minHeight: 43, paddingTop: 7, justifyContent: 'center', alignItems: 'center' },
  statusContent: { paddingBottom: 12, paddingHorizontal: 18 },
  deviceStage: { alignItems: 'center', justifyContent: 'center' },
  pulse: { justifyContent: 'center', alignItems: 'center' },
  pulseSymbol: { width: '28%', height: '27%' },
  statusText: { textAlign: 'center', marginTop: 2 },
  resetText: { textAlign: 'center', marginTop: 15 },
  networkContent: { paddingHorizontal: 16, paddingTop: 46, paddingBottom: 7 },
  networkNotes: { alignSelf: 'center', width: '78%', marginTop: 11, marginBottom: 15 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: muted, marginTop: 9 },
  noteText: { flex: 1, lineHeight: 21 },
  networkCard: { paddingHorizontal: 17, paddingTop: 13, paddingBottom: 13, borderRadius: 8 },
  networkLabels: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  networkRow: { height: 48 },
  ssid: { flexShrink: 1 },
  passwordLabel: { marginTop: 28 },
  passwordRow: { height: 48, flexDirection: 'row', alignItems: 'center' },
  input: { minWidth: 0, flex: 1, minHeight: 44, color: color.text, fontSize: 16, paddingVertical: 0 },
  sheetOptions: { paddingHorizontal: 17 },
  sheetCopy: { paddingHorizontal: 17, paddingBottom: 24, lineHeight: 24 },
  nameContent: { padding: 14, gap: 12 },
  nameCard: { flexDirection: 'row', alignItems: 'center', minHeight: 45, paddingLeft: 12, borderRadius: 9, backgroundColor: color.canvas },
});
