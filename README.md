# 摄像机智护

用 Expo SDK 54、React Native 和 TypeScript 实现的 iOS / Android 摄像机 App 前端，附 Web 预览。

## 启动

```powershell
npm ci
npm start
```

使用与项目 SDK 匹配的 Expo Go。电脑和手机连接同一网络，Android 用 Expo Go 扫描终端二维码，iOS 用相机扫码后在 Expo Go 中打开。连接 Android 模拟器后可以用 `npm run android`，macOS 上可以用 `npm run ios` 启动 iOS 模拟器。

在电脑浏览器里预览时运行 `npm run web`。

线上 Web 演示由 GitHub Pages 托管。在 GitHub Actions 手动运行「Publish Web Demo」，即可发布主分支上的版本。

Miya 的麦克风语音输入需要支持语音识别的浏览器，或包含语音模块的手机开发构建。连接 Android 设备后运行 `npm run android`，在 macOS 上可运行 `npm run ios`。首次点麦克风时按提示授权。

## 已实现的流程

- 初次打开时点击首页的「＋」，通过模拟扫码、设备发现、选择 Wi-Fi、连接和设置名称添加一台样例摄像机。设备名称在本次运行期间有效，刷新后可重走流程。Wi-Fi 密码仅在当前表单中临时使用，继续配网时清空。
- 设备连接后自动进入 Miya 管家的对话式引导，领取 AI 权益并选择最多 4 个关注事件。文字输入停顿后自动提示标准事件，也可添加自定义关注。服务逐项开启后在对话中命名，确认后直接进入 Miya 聊天首页。权益领取、文字匹配和服务配置均为本地演示。
- 首页进入实时视频、回放和动态。实时页可演示画质、云台、全屏、抓拍、录制、声音和对讲控件。
- Miya 对话首页顶部默认展开实时视频预览，点击设备名收起或展开，点击预览进入实时页。聊天顶部显示 Miya 头像和名称，消息使用左右气泡。底部提供文字、按住说话和「我的」，事件配置、今日总结和事件通知可从「我的」打开。每次进入聊天页时显示示例提问，首次发送消息后收起。右上角「设置」里的「首页样式」可切换 Miya 对话与经典首页。详见 [Miya 管家开发记录](docs/miya.md)。
- 在 AI 智护中打开智能检测，编辑或新增分级告警。规则支持场景、类型、开始和结束时间、重复日期与通知方式。保存后的规则在当前运行期间有效。
- 智搜支持输入和快捷问题，以本地样例展示匹配和无结果状态。
- 看护报告可在家人守护和宠物周报之间切换，并查看时长、次数与每日趋势。

摄像机画面取自参考图。实时控制、回放、AI 搜索和推送配置是本地演示，真实设备、视频流、AI 服务和通知尚未接入。

## 检查

```powershell
npm run typecheck
npm run build:web
npx expo export --platform ios --platform android --output-dir dist/native
```

`src/demo.ts` 集中管理摄像机画面、告警选项和初始规则，`src/Insights.tsx` 内含周报样例。
