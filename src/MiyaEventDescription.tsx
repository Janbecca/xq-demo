import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { findMiyaEvents } from './miyaEvents';
import { color, Label } from './ui';

export function MiyaEventDescription({ selected, add, atLimit = false, knownCustom = [] }: {
  selected: readonly string[]; add: (event: string) => void; atLimit?: boolean; knownCustom?: readonly string[];
}) {
  const [draft, setDraft] = useState('');
  const [checkedText, setCheckedText] = useState('');
  const description = draft.trim();
  useEffect(() => {
    if (!description || checkedText === description) return;
    const timer = setTimeout(() => setCheckedText(description), 420);
    return () => clearTimeout(timer);
  }, [checkedText, description]);

  const settled = !!description && checkedText === description;
  const matches = settled
    ? knownCustom.includes(description) ? [{ event: description, source: description }] : findMiyaEvents(description)
    : [];

  return <View style={descriptionStyles.box}>
    <Label size={13} bold>用一句话描述</Label>
    <TextInput accessibilityLabel="描述关注事件" placeholder="例如：老人摔倒、狗叫"
      placeholderTextColor="#829091" maxLength={80} value={draft} onChangeText={setDraft}
      onBlur={() => setCheckedText(description)} onSubmitEditing={() => setCheckedText(description)}
      returnKeyType="done" style={descriptionStyles.input} />
    {matches.map(({ event, source }) => {
      const alreadySelected = selected.includes(event);
      const disabled = alreadySelected || atLimit;
      const customMatch = knownCustom.includes(event);
      return <View key={event} style={descriptionStyles.suggestion}>
        <Label size={13} tint={color.mintText} accessibilityLiveRegion="polite">
          {customMatch ? `已找到自定义事件「${event}」` : `检测到已有识别项，替换成【${event}】识别效果更准确噢~`}
        </Label>
        <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }}
          style={[descriptionStyles.action, disabled && descriptionStyles.disabled]}
          onPress={() => {
            const replacement = draft.replace(source, () => event);
            setDraft(replacement);
            setCheckedText(replacement.trim());
            add(event);
          }}>
          <Label size={13} bold tint={color.mintText}>
            {alreadySelected ? '已选 ' + event : (customMatch ? '选择' : '替换为') + event}
          </Label>
        </Pressable>
      </View>;
    })}
    {settled && matches.length === 0 && <View style={descriptionStyles.suggestion}>
      <Label size={13} tint={color.secondaryText} accessibilityLiveRegion="polite">暂未匹配到已有识别项</Label>
      <Pressable accessibilityRole="button" disabled={atLimit || selected.includes(description)}
        accessibilityState={{ disabled: atLimit || selected.includes(description) }}
        style={[descriptionStyles.action, (atLimit || selected.includes(description)) && descriptionStyles.disabled]}
        onPress={() => { add(description); setDraft(''); setCheckedText(''); }}>
        <Label size={13} bold tint={color.mintText}>添加为自定义事件</Label>
      </Pressable>
    </View>}
  </View>;
}

const descriptionStyles = StyleSheet.create({
  box: { padding: 10, borderRadius: 10, backgroundColor: color.canvas, gap: 7 },
  input: { minHeight: 41, borderRadius: 8, backgroundColor: color.surface, paddingHorizontal: 10, color: color.text, fontSize: 15 },
  suggestion: { padding: 9, backgroundColor: color.mintSurface, borderRadius: 9, gap: 4 },
  action: { minHeight: 31, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 6 },
  disabled: { opacity: 0.55 },
});
