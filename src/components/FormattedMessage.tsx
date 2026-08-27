import React from 'react';
import { Text, View } from 'react-native';

function inline(text: string, key: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return <Text key={key}>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <Text key={i} style={{ fontWeight: '800', color: '#fff' }}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*')) return <Text key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
    return <Text key={i}>{part}</Text>;
  })}</Text>;
}

export function FormattedMessage({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n');
  return <View style={{ gap: 6 }}>{lines.map((line, i) => {
    const bullet = line.match(/^\s*[-•]\s+(.+)/);
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (bullet) return <View key={i} style={{ flexDirection: 'row', gap: 8, paddingRight: 6 }}><Text style={{ color: 'rgba(255,255,255,.82)', lineHeight: 22 }}>•</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 14, lineHeight: 22 }}>{inline(bullet[1], `b${i}`)}</Text></View>;
    if (numbered) return <View key={i} style={{ flexDirection: 'row', gap: 8, paddingRight: 6 }}><Text style={{ color: 'rgba(255,255,255,.82)', lineHeight: 22 }}>{numbered[1]}.</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 14, lineHeight: 22 }}>{inline(numbered[2], `n${i}`)}</Text></View>;
    if (!line.trim()) return <View key={i} style={{ height: 3 }} />;
    return <Text key={i} style={{ color: 'rgba(255,255,255,.82)', fontSize: 14, lineHeight: 22 }}>{inline(line, `p${i}`)}</Text>;
  })}</View>;
}
