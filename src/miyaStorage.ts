import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { initialThreads, type MiyaNotice, type MiyaTask, type MiyaThread } from './miyaDemo';

type MiyaData = { tasks: MiyaTask[]; threads: MiyaThread[]; notices: MiyaNotice[] };
const key = '@camera-care/miya-v1';
const initialData: MiyaData = { tasks: [], threads: initialThreads, notices: [] };

async function loadData(): Promise<MiyaData> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const data: Partial<MiyaData> = JSON.parse(stored);
      if (Array.isArray(data?.tasks) && Array.isArray(data?.threads)) {
        return { tasks: data.tasks, threads: data.threads, notices: Array.isArray(data.notices) ? data.notices : [] };
      }
    }
  } catch {
    // Storage can be unavailable in a browser's private mode.
  }
  return initialData;
}

export function useMiyaData() {
  const [data, setData] = useState<MiyaData | null>(null);
  const lastSnapshot = useRef<MiyaData | null>(null);
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void loadData().then(loaded => {
      if (!active) return;
      lastSnapshot.current = loaded;
      setData(loaded);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!data || lastSnapshot.current === data) return;
    lastSnapshot.current = data;
    const snapshot = JSON.stringify(data);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(key, snapshot)).catch(() => {});
  }, [data]);
  return [data, setData] as const;
}
