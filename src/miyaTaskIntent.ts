import { weekdays, type Time } from './demo';
import { channels, defaultTask, demoNoticeEvent, maxCustomMinutes, spanMinutes, type MiyaNotice, type MiyaTask, type MiyaTaskChange } from './miyaDemo';
import { findMiyaEvents } from './miyaEvents';

export function linkedNoticeTask(tasks: MiyaTask[], notice: MiyaNotice) {
  const matching = tasks.filter(task => task.events.includes(notice.event));
  return matching.find(task => task.id === notice.taskId) ?? matching[0];
}

function readDays(text: string) {
  if (/每天|每日|每一天/.test(text)) return weekdays;
  if (/工作日/.test(text)) return weekdays.slice(0, 5);
  if (/周末|双休日/.test(text)) return weekdays.slice(5);
  const dayNames = '一二三四五六日';
  const dayIndex = (day: string) => dayNames.indexOf(day === '天' ? '日' : day);
  const range = text.match(/(?:周|星期)([一二三四五六日天])\s*(?:到|至|[-—～~])\s*(?:(?:周|星期))?([一二三四五六日天])/);
  if (range) {
    const from = dayIndex(range[1]), to = dayIndex(range[2]);
    return from <= to ? weekdays.slice(from, to + 1) : [...weekdays.slice(from), ...weekdays.slice(0, to + 1)];
  }
  const named = [...text.matchAll(/(?:周|星期)([一二三四五六日天])/g)].map(match => dayIndex(match[1]));
  return named.length ? weekdays.filter((_, index) => named.includes(index)) : undefined;
}

function clockNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits = '零一二三四五六七八九';
  const digit = (s: string) => s === '两' ? 2 : digits.indexOf(s);
  if (!value.includes('十')) return digit(value);
  const [tens, units] = value.split('十');
  return (tens ? digit(tens) : 1) * 10 + (units ? digit(units) : 0);
}

function readTimeRange(text: string): Pick<MiyaTask, 'allDay' | 'start' | 'end'> | 'invalid' | undefined {
  if (/全天|全时段|24小时/.test(text)) return { allDay: true, start: defaultTask.start, end: defaultTask.end };
  const clock = '(早上|上午|中午|下午|晚上)?\\s*(\\d{1,2}|[零一二两三四五六七八九十]{1,3})(?:[:：](\\d{1,2})|点(半|\\d{1,2}分?)?)';
  const range = text.match(new RegExp(clock + '\\s*(?:到|至|[-–—～~])\\s*' + clock));
  if (range) {
    const parse = (period: string | undefined, hourText: string, digits: string | undefined, afterPoint: string | undefined): Time => {
      let hour = clockNumber(hourText);
      const minute = afterPoint === '半' ? 30 : Number(digits ?? afterPoint?.replace('分', '') ?? 0);
      if (period && /下午|晚上/.test(period) && hour < 12) hour += 12;
      return { hour, minute };
    };
    const start = parse(range[1], range[2], range[3], range[4]);
    const end = parse(range[5] ?? range[1], range[6], range[7], range[8]);
    if (end.hour === 24 && end.minute === 0) end.hour = 0;
    const duration = spanMinutes(start, end);
    if ([start, end].some(time => time.hour < 0 || time.hour > 23 || time.minute > 59) || !duration || duration > maxCustomMinutes) return 'invalid';
    return { allDay: false, start, end };
  }
  if (/\d{1,2}[:：]\d{1,2}|[一二两三四五六七八九十\d]点/.test(text)) return 'invalid';
  const period = text.match(/上午|早上|下午|晚上/);
  if (period) {
    const hours = period[0] === '下午' ? [12, 18] : period[0] === '晚上' ? [18, 23] : [6, 12];
    return { allDay: false, start: { hour: hours[0], minute: 0 }, end: { hour: hours[1], minute: 0 } };
  }
}

export function interpretTaskRequest(question: string, tasks: MiyaTask[], id: string, adding = false):
  { text: string; taskChange?: MiyaTaskChange } | undefined {
  const removing = /不再关注|取消关注|停止关注|不要再推送|不再推送/.test(question);
  const explicitlyAdding = adding || /^(?:我想关注|想关注|新增关注|添加关注|新建|帮我关注|关注)/.test(question);
  const known = [...new Set([...tasks.flatMap(task => task.events), demoNoticeEvent])];
  const matches = [...new Set([
    ...known.filter(event => question.includes(event)),
    ...findMiyaEvents(question.replace(/不再关注|取消关注|停止关注|不要再推送|不再推送/g, '')).map(match => match.event),
  ])];
  const event = matches[0];
  const linked = tasks.find(task => task.events.includes(event));
  const days = readDays(question);
  const time = readTimeRange(question);
  const requestedChannels = channels.filter(channel => channel === 'APP通知' ? /\bAPP\b|应用内|手机通知/i.test(question) : /公众号|微信通知/.test(question));
  const wantsSettings = explicitlyAdding || removing ||
    /^管理事件|改成|改为|调整|通知我|提醒我|给我推送|给我发|设置.*(?:关注|通知)|减少.*推送|(?:公众号|APP).*(?:推送|通知)|(?:推送|通知).*(?:公众号|APP)/i.test(question) ||
    (!!linked && !!(days || time || requestedChannels.length));
  if (!wantsSettings) return;
  if (matches.length > 1 && (!explicitlyAdding || tasks.some(task => task.events.some(name => matches.includes(name))))) {
    return { text: '请告诉我这次先修改哪一项关注事件。' };
  }

  if (removing) {
    if (!event || !linked) return { text: '请告诉我要取消哪一项已配置的关注事件。' };
    return { text: '确认后会取消这项关注。', taskChange: {
      task: { ...linked, events: [event] }, status: 'pending', kind: 'remove', replace: { taskId: linked.id, event },
    } };
  }

  if (time === 'invalid') return { text: '请告诉我完整的开始和结束时间，例如 16:00–19:00。自定义时段最长 8 小时。' };
  if (/减少.*推送|每(?:隔)?[一二两三四五六七八九十\d]+分钟/.test(question) && !days && !time && !requestedChannels.length) {
    return { text: '你希望在哪些日期和时段收到通知？可以告诉我一个时段，例如工作日 16:00–19:00。' };
  }
  const description = question.replace(/^(?:我想关注|想关注|新增关注(?:事件)?|添加关注|新建(?:关注(?:事件)?)?|帮我关注|关注|管理事件)\s*[：:]?\s*/, '')
    .replace(/[，,]\s*(?:每天|工作日|周末|周[一二三四五六日天]|上午|下午|晚上|\d{1,2}[:：]).*$/, '')
    .replace(/(?:时)?(?:给我推送.*|并通知我|通知我|提醒我)[。！!]?$/, '').replace(/[，,。！!]+$/, '').trim();
  const events = matches.length > 1 && explicitlyAdding ? matches : event ? [event] : [description.slice(0, 80)];
  if (!events[0] || !/[^\s:：，。？?！!]/.test(events[0]) ||
      (!event && !explicitlyAdding && /^(管理|改|调整|设置)|改成|改为/.test(description))) {
    return { text: '你想配置哪个关注事件？可以直接描述，例如孩子写作业。' };
  }
  if (linked && !days && !time && !requestedChannels.length && !explicitlyAdding) {
    return { text: '你想调整这项关注的通知时段还是通知方式？' };
  }

  const base = linked ?? defaultTask;
  const split = linked && linked.events.some(name => !events.includes(name));
  const task: MiyaTask = {
    ...base, ...time, id: split || !linked ? id : linked.id, events,
    days: days ?? base.days, channels: requestedChannels.length ? requestedChannels : base.channels,
  };
  return { text: '我整理了这项通知设置，请确认。', taskChange: {
    task, status: 'pending', kind: linked ? 'edit' : 'add',
    replace: split && event ? { taskId: linked.id, event } : undefined,
  } };
}
