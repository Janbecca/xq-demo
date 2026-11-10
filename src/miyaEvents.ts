import { callAlertCategories, type CallAlertEvent } from './demo';

const aliases: Record<CallAlertEvent, RegExp> = {
  '宠物吃饭/喝水': /(?:宠物|猫|狗).{0,4}(?:吃饭|喝水|进食)/,
  宠物躺地: /(?:宠物|猫|狗).{0,4}(?:躺地|躺在地上|趴在地上)/,
  宠物吠叫: /吠叫|狗.{0,3}叫|汪汪/,
  宠物挠门: /挠门|抓门/,
  人宠互动: /(?:陪|和).{0,3}(?:宠物|猫|狗).{0,2}玩/,
  宠物鼻子凑近摄像头: /(?:宠物|猫|狗|鼻子).{0,8}(?:凑近|靠近|贴近).{0,3}(?:摄像头|镜头)/,
  老人跌倒: /(?:老人|长辈|爷爷|奶奶|外公|外婆).{0,5}(?:跌倒|摔倒|摔跤)/,
  老人用餐: /(?:老人|长辈|爷爷|奶奶|外公|外婆).{0,5}(?:用餐|吃饭|进食)/,
  老人试用灶具: /(?:老人|长辈|爷爷|奶奶|外公|外婆).{0,8}(?:灶具|燃气|煤气|做饭)/,
  婴儿跌落床铺: /(?:婴儿|宝宝).{0,7}(?:跌落|掉下床|摔下床|掉床)/,
  有人抱起婴儿: /(?:抱起|抱走|抱).{0,4}(?:婴儿|宝宝)/,
  婴儿翻滚: /(?:婴儿|宝宝).{0,6}(?:翻滚|翻身)/,
  婴儿哭闹: /(?:婴儿|宝宝).{0,6}(?:哭闹|哭)/,
  小孩摔倒: /(?:小孩|孩子|儿童|孩童).{0,5}(?:跌倒|摔倒|摔跤)/,
  小孩进入厨房: /(?:小孩|孩子|儿童|孩童).{0,6}(?:进|去|到).{0,3}厨房/,
  '小孩玩刀/火': /(?:小孩|孩子|儿童|孩童).{0,6}(?:玩刀|玩火|拿刀)/,
  小孩攀爬室内窗户: /(?:小孩|孩子|儿童|孩童).{0,7}(?:爬|攀|翻).{0,5}窗/,
  小孩写作业: /(?:小孩|孩子|儿童|孩童).{0,7}(?:作业|功课)/,
  小孩打架: /(?:小孩|孩子|儿童|孩童).{0,6}(?:打架|打起来)/,
};

export const presetCallAlerts = callAlertCategories.flatMap(category => category.groups.flatMap(group => [...group.events]));

export function findMiyaEvents(text: string) {
  const parts = text.split(/[，,、。；;！？!？\n]/);
  const matches = new Map<CallAlertEvent, string>();
  for (const part of parts) {
    if (/不要|不想|不关注|不需要|不提醒|别选|别提醒|取消|去掉/.test(part)) continue;
    for (const event of presetCallAlerts) {
      const matched = part.includes(event) ? event : part.match(aliases[event])?.[0];
      if (matched && !matches.has(event)) matches.set(event, matched);
    }
  }
  return Array.from(matches, ([event, source]) => ({ event, source }));
}
