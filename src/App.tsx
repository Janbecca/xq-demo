import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CallAlertPicker, MiyaOnboarding, PairedWelcome } from './AiOnboarding';
import { Camera, Home, HomeBackground, type CameraTab } from './Camera';
import { Care, CareBackground, Detection, type CareDestination } from './Care';
import { defaultRule, initialRules, type Rule } from './demo';
import { Report, Search } from './Insights';
import { DeviceScanner, EmptyHome, pairingBackground, PairingStep, type PairStage } from './Pairing';
import { RuleEditor } from './RuleEditor';
import { color, Header, icon, Label, s } from './ui';

type Screen = { id: 'home' | 'care' | 'scan' | 'miya' | 'pairedWelcome' | CareDestination }
  | { id: 'camera'; tab: CameraTab; searchSample?: boolean }
  | { id: 'rule'; rule: Rule }
  | { id: 'pair'; stage: PairStage };
const web = Platform.OS === 'web';
const titles = {
  care: 'AI智护', detection: 'AI智能检测', report: '智能看护报告', rule: '分级告警',
  scan: '添加设备', pair: '添加智能摄像机', callAlerts: '微信通话告警',
};

function CameraCare() {
  const safeArea = useSafeAreaInsets();
  const [fontsReady, fontError] = useFonts(icon.font);
  const [stack, setStack] = useState<Screen[]>([{ id: 'home' }]);
  const [pairedName, setPairedName] = useState('');
  const [callAlerts, setCallAlerts] = useState<readonly string[]>([]);
  const [banner, setBanner] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState(initialRules);
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextRuleId = useRef(4);
  const active = stack[stack.length - 1];
  const safeBottom = web ? 16 : safeArea.bottom;

  const toast = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 2300);
  }, []);
  const back = useCallback(() => {
    Keyboard.dismiss();
    setMessage('');
    setStack(items => items.length > 1 ? items.slice(0, -1) : items);
  }, []);
  const open = useCallback((screen: Screen) => {
    Keyboard.dismiss();
    setMessage('');
    setStack(items => [...items, screen]);
  }, []);
  const finishConnecting = useCallback(() => {
    setStack(items => {
      const current = items[items.length - 1];
      if (current.id !== 'pair' || current.stage !== 'connecting') return items;
      return [...items.slice(0, -1), { id: 'pair', stage: 'success' }];
    });
  }, []);
  const finishWelcome = useCallback(() => {
    setStack(items => items[items.length - 1].id === 'pairedWelcome' ? [{ id: 'home' }] : items);
  }, []);
  const pairCamera = (name: string, events: readonly string[]) => {
    Keyboard.dismiss();
    setPairedName(name);
    setCallAlerts(events);
    setStack([{ id: 'pairedWelcome' }]);
  };
  const saveCallAlerts = (events: readonly string[]) => {
    setCallAlerts(events);
    back();
    toast('微信通话告警设置已保存');
  };
  const openCamera = (tab: CameraTab) => open({ id: 'camera', tab });
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (active.id === 'pairedWelcome') return true;
      if (stack.length === 1) return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [active.id, back, stack.length]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = (rule: Rule) => {
    if (rule.id === 0) {
      const id = nextRuleId.current++;
      setRules(items => [...items, { ...rule, id, enabled: true }]);
    } else {
      setRules(items => items.map(item => item.id === rule.id ? rule : item));
    }
    back();
    toast('告警规则已保存');
  };

  if (!fontsReady && !fontError) return <View style={app.stage} />;

  return <View style={app.stage}>
    <StatusBar style={active.id === 'camera' ? 'light' : 'dark'} />
    <View style={app.phone}>
      {stack.map((screen, index) => {
        const { id } = screen;
        const show = index === stack.length - 1;
        const ownBottom = id === 'camera' || id === 'home' || id === 'search';
        const onboarding = id === 'scan' || id === 'pair';
        const background = id === 'home' ? pairedName ? '#d7e7f1' : '#fff' : id === 'camera' ? '#090909' : onboarding ? pairingBackground : color.canvas;
        return <View key={`${id}-${index}`} accessibilityElementsHidden={!show} importantForAccessibility={show ? 'auto' : 'no-hide-descendants'}
          style={[app.page, {
            paddingTop: web ? id === 'report' ? 0 : 39 : safeArea.top,
            paddingBottom: ownBottom ? 0 : safeBottom,
            backgroundColor: background,
            display: show ? 'flex' : 'none',
          }]}>
          {id === 'care' && <CareBackground />}
          {id === 'home' && !!pairedName && <HomeBackground />}
          {id === 'report' && <LinearGradient colors={['#bdcff7', '#e7edf8', color.canvas]} locations={[0, 0.13, 0.36]} style={StyleSheet.absoluteFill} />}
          {id !== 'camera' && id !== 'home' && id !== 'miya' && id !== 'pairedWelcome' && <Header title={id === 'search' ? pairedName : titles[id]} back={back} compact={id === 'report'}
            onTitlePress={id === 'search' ? () => toast('当前设备 · ' + pairedName) : undefined} />}
          {id === 'home' && (pairedName
            ? <Home deviceName={pairedName} openCamera={openCamera} openCare={() => open({ id: 'care' })} toast={toast}
              banner={banner} dismissBanner={() => setBanner(false)} safeBottom={safeBottom} />
            : <EmptyHome add={() => open({ id: 'scan' })} />)}
          {id === 'scan' && <DeviceScanner active={show} onScan={() => open({ id: 'pair', stage: 'prepare' })} toast={toast} />}
          {id === 'pair' && <PairingStep stage={screen.stage} active={show} next={
            screen.stage === 'prepare' ? () => open({ id: 'pair', stage: 'network' })
              : screen.stage === 'network' ? () => open({ id: 'pair', stage: 'connecting' })
                : screen.stage === 'connecting' ? finishConnecting : () => open({ id: 'miya' })
          } />}
          {id === 'miya' && <MiyaOnboarding back={back} confirm={pairCamera} />}
          {id === 'pairedWelcome' && <PairedWelcome name={pairedName} next={finishWelcome} />}
          {id === 'callAlerts' && <CallAlertPicker initial={callAlerts} save={saveCallAlerts} />}
          {id === 'camera' && <View style={app.cameraCanvas}><Camera initialTab={screen.tab} searchSample={screen.searchSample} back={back} toast={toast} safeBottom={safeBottom} /></View>}
          {id === 'care' && <Care open={destination => open({ id: destination })} toast={toast} />}
          {id === 'detection' && <Detection enabled={enabled} setEnabled={setEnabled} rules={rules}
            toggle={(id, value) => setRules(items => items.map(rule => rule.id === id ? { ...rule, enabled: value } : rule))}
            edit={rule => open({ id: 'rule', rule: rule ?? defaultRule })} />}
          {id === 'rule' && <RuleEditor initial={screen.rule} save={save} />}
          {id === 'search' && <Search safeBottom={safeBottom} play={() => open({ id: 'camera', tab: '回放', searchSample: true })} />}
          {id === 'report' && <Report />}
        </View>;
      })}
      {!!message && <View pointerEvents="none" style={[app.toast, { bottom: safeBottom + 73 }]}>
        <Label accessibilityLiveRegion="polite" size={13} tint="#fff">{message}</Label>
      </View>}
    </View>
  </View>;
}

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics} style={s.fill}><CameraCare /></SafeAreaProvider>;
}

const app = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', backgroundColor: '#e1e6eb' },
  phone: { flex: 1, width: '100%', maxWidth: web ? 393 : undefined, backgroundColor: color.canvas, position: 'relative' },
  page: { flex: 1, minHeight: 0 },
  cameraCanvas: { flex: 1, backgroundColor: color.canvas },
  toast: { position: 'absolute', alignSelf: 'center', maxWidth: '88%', backgroundColor: '#23272ce8', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, zIndex: 10 },
});
