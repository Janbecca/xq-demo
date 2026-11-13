import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CallAlertPicker, MiyaOnboarding } from './AiOnboarding';
import { Camera, type CameraTab, type PlaybackSample } from './Camera';
import { Care, CareBackground, Detection, type CareDestination } from './Care';
import { ClassicHome, ClassicHomeBackground } from './ClassicHome';
import { defaultDevicePreferences, DeviceSettingDetails, DeviceSettings, deviceSettingTitle, type DevicePreferences, type DeviceSetting, type DeviceSettingsEntry } from './DeviceSettings';
import { defaultRule, initialRules, type Rule } from './demo';
import { Report, Search } from './Insights';
import { MiyaChat } from './Miya';
import type { MiyaDestination } from './MiyaHome';
import { MiyaTaskEditor, MiyaTasks } from './MiyaNotifications';
import { MiyaActivities, MiyaNoticeList, MiyaSummary, MiyaTopicDetails } from './MiyaSummary';
import { defaultTask, demoNoticeEvents, demoPackageNotice, type MiyaContext, type MiyaScope, type MiyaTask, type MiyaThread, type MiyaTopic } from './miyaDemo';
import { useMiyaData, type HomeMode } from './miyaStorage';
import { DeviceScanner, EmptyHome, pairingBackground, PairingStep, type PairStage } from './Pairing';
import { RuleEditor } from './RuleEditor';
import { color, Header, icon, Label, s } from './ui';

type Screen = { id: 'home' | 'pairedHome' | 'deviceSettings' | 'care' | 'scan' | 'miya' | CareDestination | MiyaDestination }
  | { id: 'camera'; tab: CameraTab; playbackSample?: PlaybackSample }
  | { id: 'miyaChat'; context?: MiyaContext; prefill?: string }
  | { id: 'miyaTask'; taskId: string; task?: MiyaTask }
  | { id: 'miyaTopic'; topic: MiyaTopic; date: string; scope: MiyaScope }
  | { id: 'miyaActivities'; date: string; scope: MiyaScope }
  | { id: 'deviceSetting'; section: DeviceSetting }
  | { id: 'rule'; rule: Rule }
  | { id: 'pair'; stage: PairStage };
const web = Platform.OS === 'web';
const titles = {
  deviceSettings: '设置',
  care: 'AI智护', detection: 'AI智能检测', report: '智能看护报告', rule: '分级告警',
  scan: '添加设备', pair: '添加智能摄像机', callAlerts: '微信通话告警',
  miyaTasks: '事件配置', miyaSummary: '今日总结', miyaActivities: '当天活动', miyaNotices: '事件通知',
};

function CameraCare() {
  const safeArea = useSafeAreaInsets();
  const [fontsReady, fontError] = useFonts(icon.font);
  const [stack, setStack] = useState<Screen[]>([{ id: 'home' }]);
  const [pairedName, setPairedName] = useState('');
  const [devicePreferences, setDevicePreferences] = useState(defaultDevicePreferences);
  const [callAlerts, setCallAlerts] = useState<readonly string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState(initialRules);
  const [miyaData, setMiyaData] = useMiyaData();
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
      return [...items.slice(0, -1), { id: 'miya' }];
    });
  }, []);
  const pairCamera = (name: string, events: readonly string[]) => {
    Keyboard.dismiss();
    setPairedName(name);
    setCallAlerts(events);
    const id = 'task-pair-' + Date.now();
    setMiyaData(current => {
      if (!current) return current;
      const newEvents = events.filter(event => !current.tasks.some(task => task.events.includes(event)));
      const tasks = newEvents.length ? [...current.tasks, { ...defaultTask, id, events: newEvents }] : current.tasks;
      const packageTask = tasks.find(task => task.events.includes(demoPackageNotice.event));
      const notices = !current.notices.length && (!tasks.some(task => task.events.length) || packageTask) ? [{
        ...demoPackageNotice, id: 'demo-package', deviceName: '门口摄像机', createdAt: Date.parse('2026-11-10T18:32:00+08:00'),
        read: false, taskId: packageTask?.id, fromFollowed: !!packageTask,
      }] : current.notices;
      return { ...current, tasks, notices };
    });
    setStack([{ id: 'pairedHome' }]);
  };
  const saveCallAlerts = (events: readonly string[]) => {
    setCallAlerts(events);
    back();
    toast('微信通话告警设置已保存');
  };
  const openCamera = (tab: CameraTab) => open({ id: 'camera', tab });
  const openSettings = () => open({ id: 'deviceSettings' });
  const openCare = () => open({ id: 'care' });
  const restartDevice = () => toast('样例设备已重启');
  const updateDevice = (patch: Partial<DevicePreferences>) => setDevicePreferences(current => ({ ...current, ...patch }));
  function openSetting(section: DeviceSettingsEntry) {
    if (section === 'detection') open({ id: 'detection' });
    else if (section === 'messages') open({ id: 'miyaTasks' });
    else open({ id: 'deviceSetting', section });
  }
  function chooseHomeMode(homeMode: HomeMode) {
    setMiyaData(current => current && { ...current, homeMode });
    setStack([{ id: 'pairedHome' }]);
  }
  function removeDevice() {
    Keyboard.dismiss();
    setPairedName('');
    setCallAlerts([]);
    setDevicePreferences(defaultDevicePreferences);
    setStack([{ id: 'home' }]);
    toast('已删除样例设备');
  }
  const play = (playbackSample: PlaybackSample) => open({ id: 'camera', tab: '回放', playbackSample });
  const saveMiyaThread = (thread: MiyaThread) => {
    setMiyaData(current => current && { ...current,
      threads: [thread, ...current.threads.filter(item => item.id !== thread.id)].sort((a, b) => b.createdAt - a.createdAt),
    });
  };
  const simulateMiyaNotice = () => {
    const createdAt = Date.now();
    if (!miyaData) return;
    const configured = miyaData.tasks.some(task => task.events.length > 0);
    const detected = demoNoticeEvents.flatMap(sample => {
      const task = miyaData.tasks.find(item => item.events.includes(sample.event));
      if (configured && !task) return [];
      return [{ ...sample, taskId: task?.id, fromFollowed: !!task }];
    });
    if (!detected.length) {
      toast('这批样例未检测到已关注的事件');
      return;
    }
    setMiyaData(current => current && { ...current, notices: [
      ...detected.map((item, index) => ({
        ...item, id: `notice-${createdAt}-${current.notices.length}-${index}`, deviceName: pairedName, createdAt, read: false,
      })),
      ...current.notices,
    ] });
  };
  const readMiyaNotice = (id: string) => {
    setMiyaData(current => current && { ...current,
      notices: current.notices.map(notice => notice.id === id ? { ...notice, read: true } : notice),
    });
  };
  const saveMiyaTask = (task: MiyaTask) => {
    setMiyaData(current => current && { ...current, tasks: upsertTask(current.tasks, task) });
    back();
    toast('通知任务已保存');
  };
  const removeMiyaTask = (id: string) => {
    setMiyaData(current => current && { ...current, tasks: current.tasks.filter(item => item.id !== id) });
    back();
    toast('通知任务已删除');
  };
  const resolveMiyaChange = (threadId: string, index: number, confirmed?: MiyaTask) => {
    setMiyaData(current => {
      if (!current) return current;
      const thread = current.threads.find(item => item.id === threadId);
      const message = thread?.messages[index];
      const change = message?.taskChange;
      if (!thread || !message || change?.status !== 'pending') return current;
      let { tasks, notices } = current;
      if (confirmed) {
        const replacement = change.replace;
        if (replacement) {
          tasks = tasks.map(task => task.id === replacement.taskId
            ? { ...task, events: task.events.filter(event => event !== replacement.event) }
            : task).filter(task => task.events.length);
        }
        if (change.kind !== 'remove') tasks = upsertTask(tasks, confirmed);
        notices = notices.map(notice => {
          const wasReplaced = !!replacement && notice.taskId === replacement.taskId && notice.event === replacement.event;
          if (notice.id !== change.noticeId && !wasReplaced) return notice;
          const taskId = change.kind !== 'remove' && confirmed.events.includes(notice.event) ? confirmed.id : undefined;
          return { ...notice, taskId };
        });
      }
      const messages = thread.messages.map((item, position) => position === index ? {
        ...message, taskChange: { ...change, task: confirmed ?? change.task, status: confirmed ? 'saved' as const : 'cancelled' as const },
      } : item);
      const threads = current.threads.map(item => item.id === threadId ? { ...thread, messages } : item);
      return { ...current, tasks, notices, threads };
    });
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length === 1) return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back, stack.length]);
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

  if ((!fontsReady && !fontError) || !miyaData) return <View style={app.stage} />;

  const classicMode = miyaData.homeMode === 'classic';
  const miyaChatProps = {
    pairedName, threads: miyaData.threads, notices: miyaData.notices, tasks: miyaData.tasks,
    open: (id: MiyaDestination) => open({ id }), openLive: () => openCamera('实时视频'), openSettings,
    save: saveMiyaThread, play, simulateNotice: simulateMiyaNotice, readNotice: readMiyaNotice, resolveChange: resolveMiyaChange,
  };
  return <View style={app.stage}>
    <StatusBar style={active.id === 'camera' ? 'light' : 'dark'} />
    <View style={app.phone}>
      {stack.map((screen, index) => {
        const { id } = screen;
        const show = index === stack.length - 1;
        const ownBottom = id === 'camera' || id === 'home' || id === 'search' || (id === 'pairedHome' && classicMode);
        const onboarding = id === 'scan' || id === 'pair';
        const background = id === 'home' ? '#fff' : id === 'camera' ? '#090909' : onboarding ? pairingBackground : color.canvas;
        return <View key={`${id}-${index}`} accessibilityElementsHidden={!show} importantForAccessibility={show ? 'auto' : 'no-hide-descendants'}
          style={[app.page, {
            paddingTop: web ? id === 'report' ? 0 : 39 : safeArea.top,
            paddingBottom: ownBottom ? 0 : safeBottom,
            backgroundColor: background,
            display: show ? 'flex' : 'none',
          }]}>
          {id === 'care' && <CareBackground />}
          {id === 'pairedHome' && classicMode && <ClassicHomeBackground />}
          {(id === 'report' || id === 'miyaSummary' || id === 'miyaTopic' || id === 'miyaActivities') &&
            <LinearGradient colors={['#bdcff7', '#e7edf8', color.canvas]} locations={[0, 0.13, 0.36]} style={StyleSheet.absoluteFill} />}
          {id !== 'camera' && id !== 'home' && id !== 'pairedHome' && id !== 'miya' && id !== 'miyaChat' && id !== 'miyaTask' &&
            <Header title={id === 'search' ? pairedName : id === 'miyaTopic' ? screen.topic.title
              : id === 'deviceSetting' ? deviceSettingTitle(screen.section) : titles[id]} back={back} compact={id === 'report'}
              onTitlePress={id === 'search' ? () => toast('当前设备 · ' + pairedName) : undefined} />}
          {id === 'home' && <EmptyHome add={() => open({ id: 'scan' })} />}
          {id === 'pairedHome' && <>
            <View style={[s.fill, classicMode && app.hidden]} aria-hidden={classicMode}>
              <MiyaChat {...miyaChatProps} active={show && !classicMode} />
            </View>
            <View style={[s.fill, !classicMode && app.hidden]} aria-hidden={!classicMode}>
              <ClassicHome deviceName={pairedName} openCamera={openCamera} openCare={openCare} openSettings={openSettings}
                openMiya={() => open({ id: 'miyaChat' })} miyaUnread={miyaData.notices.some(notice => !notice.read)} toast={toast} safeBottom={safeBottom} />
            </View>
          </>}
          {id === 'scan' && <DeviceScanner active={show} onScan={() => open({ id: 'pair', stage: 'prepare' })} toast={toast} />}
          {id === 'pair' && <PairingStep stage={screen.stage} active={show} next={
            screen.stage === 'prepare' ? () => open({ id: 'pair', stage: 'network' })
              : screen.stage === 'network' ? () => open({ id: 'pair', stage: 'connecting' })
                : finishConnecting
          } />}
          {id === 'miya' && <MiyaOnboarding back={back} confirm={pairCamera} />}
          {id === 'callAlerts' && <CallAlertPicker initial={callAlerts} save={saveCallAlerts} />}
          {id === 'camera' && <View style={app.cameraCanvas}><Camera initialTab={screen.tab} playbackSample={screen.playbackSample}
            back={back} toast={toast} safeBottom={safeBottom} openSettings={openSettings} quality={devicePreferences.quality}
            sound={devicePreferences.sound} setQuality={quality => updateDevice({ quality })} setSound={sound => updateDevice({ sound })} /></View>}
          {id === 'deviceSettings' && <DeviceSettings deviceName={pairedName} mode={miyaData.homeMode}
            chooseMode={chooseHomeMode} open={openSetting} restart={restartDevice} remove={removeDevice} toast={toast} />}
          {id === 'deviceSetting' && <DeviceSettingDetails id={screen.section} deviceName={pairedName} preferences={devicePreferences} update={updateDevice}
            rename={name => { setPairedName(name); back(); toast('设备名称已保存'); }} restart={restartDevice}
            viewRecordings={() => openCamera('回放')} toast={toast} />}
          {id === 'care' && <Care open={destination => open({ id: destination })} toast={toast} />}
          {id === 'detection' && <Detection enabled={enabled} setEnabled={setEnabled} rules={rules}
            toggle={(id, value) => setRules(items => items.map(rule => rule.id === id ? { ...rule, enabled: value } : rule))}
            edit={rule => open({ id: 'rule', rule: rule ?? defaultRule })} />}
          {id === 'rule' && <RuleEditor initial={screen.rule} save={save} />}
          {id === 'search' && <Search safeBottom={safeBottom} play={() => play({ title: '写作业', time: '06.25 18:32' })} />}
          {id === 'report' && <Report />}
          {id === 'miyaChat' && <MiyaChat {...miyaChatProps} active={show} initialContext={screen.context} prefill={screen.prefill} back={back} />}
          {id === 'miyaTasks' && <MiyaTasks tasks={miyaData.tasks} add={() => open({ id: 'miyaTask', taskId: 'task-' + Date.now() })}
            edit={task => open({ id: 'miyaTask', taskId: task.id, task })} />}
          {id === 'miyaTask' && <MiyaTaskEditor id={screen.taskId} initial={screen.task}
            savedEvents={miyaData.tasks.flatMap(task => task.events)} save={saveMiyaTask}
            remove={() => removeMiyaTask(screen.taskId)} cancel={back} />}
          {id === 'miyaSummary' && <MiyaSummary pairedName={pairedName}
            openTopic={(topic, date, scope) => open({ id: 'miyaTopic', topic, date, scope })}
            openActivities={(date, scope) => open({ id: 'miyaActivities', date, scope })}
            ask={(date, scope) => open({ id: 'miyaChat', context: { date, scope }, prefill: `帮我回顾 ${date} 这一天发生了什么。` })} />}
          {id === 'miyaNotices' && <MiyaNoticeList notices={miyaData.notices} />}
          {id === 'miyaTopic' && <MiyaTopicDetails topic={screen.topic} date={screen.date} scope={screen.scope} pairedName={pairedName} />}
          {id === 'miyaActivities' && <MiyaActivities date={screen.date} scope={screen.scope} pairedName={pairedName} play={play} />}
        </View>;
      })}
      {!!message && <View pointerEvents="none" style={[app.toast, { bottom: safeBottom + (active.id === 'miyaChat' || (active.id === 'pairedHome' && !classicMode) ? 112 : 73) }]}>
        <Label accessibilityLiveRegion="polite" size={13} tint="#fff">{message}</Label>
      </View>}
    </View>
  </View>;
}

function upsertTask(tasks: MiyaTask[], task: MiyaTask) {
  return tasks.some(item => item.id === task.id)
    ? tasks.map(item => item.id === task.id ? task : item)
    : [...tasks, task];
}

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics} style={s.fill}><CameraCare /></SafeAreaProvider>;
}

const app = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', backgroundColor: '#e1e6eb' },
  phone: { flex: 1, width: '100%', maxWidth: web ? 393 : undefined, backgroundColor: color.canvas, position: 'relative' },
  page: { flex: 1, minHeight: 0 },
  hidden: { display: 'none' },
  cameraCanvas: { flex: 1, backgroundColor: color.canvas },
  toast: { position: 'absolute', alignSelf: 'center', maxWidth: '88%', backgroundColor: '#23272ce8', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, zIndex: 10 },
});
