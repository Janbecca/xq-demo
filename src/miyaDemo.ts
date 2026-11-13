import { timeText, weekdays, type Time } from './demo';
import { findMiyaEvents } from './miyaEvents';

export const channels = ['APP通知', '公众号通知'] as const;
export const demoNoticeEvent = '有人举手';
export type MiyaTask = {
  id: string;
  events: string[];
  channels: (typeof channels)[number][];
  days: string[];
  allDay: boolean;
  start: Time;
  end: Time;
};

export const maxCustomMinutes = 8 * 60;
export const defaultTask: Omit<MiyaTask, 'id'> = {
  events: [], channels: ['APP通知'], days: weekdays, allDay: false,
  start: { hour: 10, minute: 0 }, end: { hour: 18, minute: 0 },
};

export function taskDays(days: string[]) {
  if (days.length === weekdays.length) return '每天';
  if (days.join() === weekdays.slice(0, 5).join()) return '工作日';
  return days.length ? days.join('、') : '未选日期';
}

export const minutesOf = ({ hour, minute }: Time) => hour * 60 + minute;
export const timeAt = (minutes: number): Time => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
export const spanMinutes = (start: Time, end: Time) => (minutesOf(end) - minutesOf(start) + 1440) % 1440;

export function taskHours(task: MiyaTask) {
  if (task.allDay) return '全天';
  const nextDay = minutesOf(task.end) < minutesOf(task.start) ? '次日 ' : '';
  return `${timeText(task.start)}–${nextDay}${timeText(task.end)}`;
}

export type MiyaScope = 'all' | 'camera' | 'living';
export type MiyaCamera = Exclude<MiyaScope, 'all'>;
export const scopes: MiyaScope[] = ['all', 'camera', 'living'];
export function scopeName(scope: MiyaScope, pairedName: string) {
  return scope === 'all' ? '全部设备' : scope === 'camera' ? pairedName : '客厅摄像机';
}

export type MiyaClip = {
  id: string;
  title: string;
  time: string;
  device: MiyaCamera;
  attention?: boolean;
};
export type MiyaNotice = {
  id: string;
  event: string;
  title?: string;
  taskId?: string;
  deviceName: string;
  createdAt: number;
  read: boolean;
  description?: string;
  fromFollowed?: boolean;
};
export type MiyaTaskChange = {
  task: MiyaTask;
  kind: 'add' | 'edit' | 'remove';
  status: 'pending' | 'saved' | 'cancelled';
  replace?: { taskId: string; event: string };
  noticeId?: string;
  expanded?: boolean;
};
export const demoPackageNotice = {
  event: '有人把快递放在门口', title: '包裹出现', description: '有人把包裹放在门口，离开时没有带走。',
};
export const demoNoticeEvents = [
  { event: demoNoticeEvent, description: '画面中有人抬起一只手。' },
  { event: '小孩写作业', description: '孩子坐在桌前翻开作业本并写字。' },
  { event: '宠物吃饭/喝水', description: '宠物走到食碗旁进食。' },
  { event: '老人跌倒', description: '画面中的老人失去平衡后倒在地上。' },
  demoPackageNotice,
];
type SummaryEntry = { text: string; time?: string; device?: MiyaCamera };
type Topic = { id: string; title: string; description: string; clipIds: string[]; count?: number; attention?: boolean };
type MiyaDay = {
  updatedAt?: string;
  updating?: boolean;
  entries: SummaryEntry[];
  extra?: string[];
  clips: MiyaClip[];
  topics?: Topic[];
  groups?: string[];
};
export type MiyaTopic = Omit<Topic, 'clipIds' | 'count'> & { clips: MiyaClip[]; count: number };

export const summaryToday = '2026-11-10';
const summaryYesterday = '2026-11-09';
export const summaryDates = [summaryToday, summaryYesterday, '2026-11-08', '2026-11-07', '2026-11-06'];
const dayClips: MiyaClip[] = [
  { id: 'pet-meal', title: '宠物吃饭/喝水', time: '08:22', device: 'camera' },
  { id: 'elder-meal', title: '老人用餐', time: '12:14', device: 'camera' },
  { id: 'kitchen', title: '小孩进入厨房', time: '15:48', device: 'living', attention: true },
  { id: 'pet-play', title: '人宠互动', time: '17:12', device: 'living' },
];
const homework: MiyaClip = { id: 'homework', title: '小孩写作业', time: '16:40', device: 'camera' };

const summaryDays: Record<string, MiyaDay> = {
  [summaryToday]: {
    updatedAt: '18:00',
    entries: [
      { time: '08:22', device: 'camera', text: '宠物到食盆附近进食和喝水。' },
      { time: '12:14', device: 'camera', text: '老人开始用餐。' },
      { time: '15:48', device: 'living', text: '小孩进入厨房，约半分钟后离开。' },
      { time: '17:12', device: 'living', text: '家人与宠物在客厅互动。' },
    ],
    extra: ['上午宠物在食盆旁停留片刻后离开。', '厨房片段已标为「需留意」，可在当天活动中回看。'],
    clips: dayClips, groups: ['日常活动 · 6条', '人员往来 · 4条'],
    topics: [
      { id: 'children', title: '孩童安全', description: '识别到小孩短暂进入厨房。', clipIds: ['kitchen'], attention: true },
      { id: 'pets', title: '宠物日常', description: '记录宠物进食、喝水及与家人的互动。', clipIds: ['pet-meal', 'pet-play'] },
      { id: 'elders', title: '老人用餐', description: '中午记录到老人用餐。', clipIds: ['elder-meal'] },
    ],
  },
  [summaryYesterday]: {
    updatedAt: '17:00', updating: true,
    entries: [{ time: '12:14', device: 'camera', text: '老人开始用餐。' }, { time: '16:40', device: 'camera', text: '小孩在桌前写作业。' }],
    extra: ['后续活动正在整理，已整理的片段可在当天活动中回看。'],
    clips: [dayClips[1], homework], groups: ['室内活动 · 3条'],
    topics: [{ id: 'learning', title: '孩童学习', description: '下午记录到小孩在桌前写作业。', clipIds: ['homework'] }],
  },
  '2026-11-06': {
    updatedAt: '18:30',
    entries: [{ text: '当天主要为室内日常活动与人员往来，已按活动类型归档。' }],
    clips: [], groups: ['室内活动 · 4条', '人员往来 · 2条'],
    topics: [
      { id: 'indoors', title: '室内活动', description: '当天共记录 4 条室内活动。', clipIds: [], count: 4 },
      { id: 'visitors', title: '人员往来', description: '当天共记录 2 条人员往来。', clipIds: [], count: 2 },
    ],
  },
};
export const failedSummaryDate = '2026-11-07';

export function dailySummary(date: string, scope: MiyaScope) {
  const day = summaryDays[date];
  const all = scope === 'all';
  const clips = (day?.clips ?? []).filter(clip => all || clip.device === scope);
  const topics = (day?.topics ?? []).flatMap(({ clipIds, count, ...topic }): MiyaTopic[] => {
    const related = clips.filter(clip => clipIds.includes(clip.id));
    return all || related.length ? [{ ...topic, clips: related, count: count ?? related.length }] : [];
  });
  return {
    entries: (day?.entries ?? []).filter(entry => all || entry.device === scope),
    extra: all ? day?.extra ?? [] : [], updatedAt: day?.updatedAt, updating: day?.updating,
    clips, topics, groups: all ? day?.groups ?? [] : [],
  };
}

export type MiyaContext = { date?: string; scope: MiyaScope };
export type MiyaMessage = { role: 'user' | 'miya'; text: string; clip?: MiyaClip; taskChange?: MiyaTaskChange };
export type MiyaThread = {
  id: string;
  title: string;
  createdAt: number;
  context: MiyaContext;
  messages: MiyaMessage[];
};
export const initialThreads: MiyaThread[] = [{
  id: 'demo-homework', title: '昨天孩子写作业了吗？', createdAt: Date.parse('2026-11-09T19:05:00+08:00'),
  context: { scope: 'camera', date: summaryYesterday },
  messages: [
    { role: 'user', text: '昨天孩子写作业了吗？' },
    { role: 'miya', text: '16:40 有一段小孩写作业的样例片段。', clip: homework },
  ],
}];

export function demoReply(question: string, context: MiyaContext): MiyaMessage {
  const summary = dailySummary(context.date ?? (question.includes('昨天') ? summaryYesterday : summaryToday), context.scope);
  let text = '这组样例里没有匹配的片段。可以换个事件描述，或到今日总结按日期查看。';
  if (/每天|每周|每隔|每两分钟|每\d+分钟/.test(question)) {
    text = '当前为本地演示，暂时无法安排定时查看或发送通知。';
  } else if (/回顾|总结|摘要|发生了什么/.test(question)) {
    text = summary.entries.map(entry => entry.time ? `${entry.time} ${entry.text}` : entry.text).join('\n') ||
      '所选设备在这天没有可用的样例摘要。';
  } else {
    const events = findMiyaEvents(question);
    const clip = summary.clips.find(item => events.some(match => match.event === item.title));
    if (clip) return { role: 'miya', text: `找到了 ${clip.time} 的「${clip.title}」样例片段，可以点开回看。`, clip };
  }
  return { role: 'miya', text };
}
