import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

const avatar = require('../assets/miya-avatar.gif');

export function MiyaAvatar({ style }: { style: StyleProp<ImageStyle> }) {
  return <Image source={avatar} style={style} contentFit="contain" autoplay accessible={false} />;
}
