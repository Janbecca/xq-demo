import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionErrorCode } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;
type VoiceStatus = 'idle' | 'starting' | 'listening' | 'stopping';
type VoiceSession = { stop: () => void; cancel: () => void };
const noSpeech = '没有识别到语音，请再试一次。';
const unavailable = '当前设备的语音识别服务不可用。';
const failed = '语音识别失败，请重试。';
const permissionDenied = '请在设置中允许麦克风和语音识别权限。';
const finishTimeout = 4000;
let activeSession: VoiceSession | undefined;

function speechModule(): SpeechModule | undefined {
  if (Platform.OS !== 'web' && !requireOptionalNativeModule('ExpoSpeechRecognition')) return;
  const speech: typeof import('expo-speech-recognition') = require('expo-speech-recognition');
  return speech.ExpoSpeechRecognitionModule;
}

function errorMessage(error: ExpoSpeechRecognitionErrorCode) {
  switch (error) {
    case 'not-allowed':
      return Platform.OS === 'web' ? '请在浏览器设置中允许此站点使用麦克风。' : permissionDenied;
    case 'audio-capture':
      return '无法使用麦克风，请检查麦克风是否可用。';
    case 'no-speech':
      return noSpeech;
    case 'network':
      return '语音识别连接失败，请检查网络后重试。';
    case 'service-not-allowed':
    case 'language-not-supported':
      return unavailable;
    default:
      return failed;
  }
}

export function useMiyaVoice(active: boolean, onText: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [message, setMessage] = useState('');
  const sessionRef = useRef<VoiceSession | null>(null);
  const cancel = useCallback(() => sessionRef.current?.cancel(), []);

  useEffect(() => {
    if (!active) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') cancel();
    });
    return () => {
      subscription.remove();
      cancel();
    };
  }, [active, cancel]);

  async function toggle() {
    if (sessionRef.current) {
      sessionRef.current.stop();
      return;
    }
    if (!active) return;
    if (activeSession) {
      setMessage('上一段语音正在结束，请稍后重试。');
      return;
    }
    let module: SpeechModule | undefined;
    try { module = speechModule(); }
    catch {
      setMessage(unavailable);
      return;
    }
    const speech = module;
    if (!speech) {
      setMessage('请使用开发构建体验语音输入。');
      return;
    }
    if (!speech.isRecognitionAvailable()) {
      setMessage(Platform.OS === 'web' ? '当前浏览器不支持语音输入。' : unavailable);
      return;
    }

    let started = false;
    let listening = false;
    let stopping = false;
    let cancelled = false;
    let transcript = '';
    let error = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscriptions: { remove: () => void }[] = [];

    function finish() {
      if (activeSession !== session) return;
      activeSession = undefined;
      sessionRef.current = null;
      clearTimeout(timer);
      subscriptions.forEach(subscription => subscription.remove());
      if (cancelled) return;
      setStatus('idle');
      if (error) setMessage(error);
      else if (transcript) onText(transcript);
      else setMessage(noSpeech);
    }

    const waitForEnd = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        finish();
        if (!cancelled) {
          try { speech.abort(); } catch {}
        }
      }, finishTimeout);
    };

    const session: VoiceSession = {
      stop() {
        if (!listening || stopping || cancelled) return;
        stopping = true;
        setStatus('stopping');
        waitForEnd();
        try { speech.stop(); }
        catch { error = failed; finish(); }
      },
      cancel() {
        if (cancelled) return;
        cancelled = true;
        sessionRef.current = null;
        setStatus('idle');
        if (!started) {
          finish();
          return;
        }
        waitForEnd();
        try { speech.abort(); }
        catch { finish(); }
      },
    };
    sessionRef.current = session;
    activeSession = session;
    setMessage('');
    setStatus('starting');

    try {
      if (Platform.OS !== 'web') {
        const { granted } = await speech.requestPermissionsAsync();
        if (cancelled) return;
        if (!granted) {
          error = permissionDenied;
          finish();
          return;
        }
      }
      subscriptions.push(
        speech.addListener('start', () => {
          if (activeSession !== session || cancelled || stopping) return;
          listening = true;
          setStatus('listening');
        }),
        speech.addListener('result', result => {
          if (activeSession !== session || cancelled || !result.isFinal) return;
          transcript = result.results[0]?.transcript.trim() ?? '';
        }),
        speech.addListener('error', event => {
          if (activeSession !== session || cancelled) return;
          error = errorMessage(event.error);
          stopping = true;
          setStatus('stopping');
          waitForEnd();
        }),
        speech.addListener('end', finish),
      );
      started = true;
      speech.start({ lang: 'zh-CN', continuous: false, interimResults: false });
    } catch {
      error = failed;
      finish();
    }
  }

  return { status, message, toggle, cancel };
}
