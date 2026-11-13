export const media = {
  cover: require('../assets/camera-cover.jpg'),
  frame: require('../assets/camera-frame.jpg'),
  playback: require('../assets/shortcut-playback.png'),
  events: require('../assets/shortcut-events.png'),
  life: require('../assets/shortcut-life.png'),
  ai: require('../assets/shortcut-ai.png'),
  cloud: require('../assets/tile-cloud.png'),
  album: require('../assets/tile-album.png'),
  call: require('../assets/tile-call.png'),
  summaryFootage: require('../assets/miya-summary-footage.jpg'),
  detection: require('../assets/detection-illustration.jpg'),
  camera: require('../assets/camera-avatar.png'),
  pairCamera: require('../assets/pair-camera.png'),
};

export const callAlertCategories = [
  { label: '宠物', groups: [{ label: '宠物', events: ['宠物吃饭/喝水', '宠物躺地', '宠物吠叫', '宠物挠门', '人宠互动', '宠物鼻子凑近摄像头'] }] },
  { label: '老人', groups: [{ label: '老人', events: ['老人跌倒', '老人用餐', '老人试用灶具'] }] },
  { label: '孩童', groups: [
    { label: '婴儿', events: ['婴儿跌落床铺', '有人抱起婴儿', '婴儿翻滚', '婴儿哭闹'] },
    { label: '儿童', events: ['小孩摔倒', '小孩进入厨房', '小孩玩刀/火', '小孩攀爬室内窗户', '小孩写作业', '小孩打架'] },
  ] },
] as const;

export type CallAlertEvent = typeof callAlertCategories[number]['groups'][number]['events'][number];

export const scenes = ['老人', '孩童', '宠物'] as const;
export type Scene = typeof scenes[number];
export const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const alertTypes: Record<Scene, string[][]> = {
  老人: [['有老人', '老人跌倒'], ['老人长时间静止', '老人离家']],
  孩童: [
    ['有婴儿', '婴儿跌落床铺', '婴儿哭闹'],
    ['有人抱起婴儿', '婴儿翻滚', '有小孩'],
    ['小孩摔倒', '小孩攀爬室内窗户'],
    ['小孩靠近水域', '小孩玩火玩刀'],
    ['小孩进入厨房', '小孩写作业'],
  ],
  宠物: [['有宠物', '宠物吠叫', '宠物挠门'], ['宠物吃饭喝水', '家具损坏']],
};

export type Time = { hour: number; minute: number };
export type Rule = {
  id: number; scene: Scene; type: string; start: Time; end: Time;
  days: string[]; channel: string; enabled: boolean;
};
export const defaultRule: Rule = {
  id: 0, scene: '孩童', type: '小孩写作业', start: { hour: 8, minute: 0 },
  end: { hour: 22, minute: 0 }, days: weekdays, channel: '微信通知', enabled: false,
};
export const initialRules: Rule[] = [
  { ...defaultRule, id: 1 },
  { ...defaultRule, id: 2, type: '小孩摔倒' },
  { ...defaultRule, id: 3, scene: '老人', type: '老人跌倒' },
];

export const twoDigits = (value: number) => String(value).padStart(2, '0');
export const timeText = ({ hour, minute }: Time) => `${twoDigits(hour)}:${twoDigits(minute)}`;
