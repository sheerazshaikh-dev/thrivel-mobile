import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding } from '@/context/Branding';

export function AIOrb({ size = 36, speaking = false }: { size?: number; speaking?: boolean }) {
  const b = useBranding();
  const pulse = useRef(new Animated.Value(1)).current;
  const colors = [b.primaryColor || '#7AC7C8', b.gradientMidColor || '#9971B1', b.secondaryColor || '#EC437D', b.accentColor || '#F4946E'] as const;
  useEffect(() => {
    if (!speaking) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 450, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [speaking, pulse]);
  const inset = Math.max(4, Math.round(size * .08));
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: colors[2], opacity: .18 }]} />
    <Animated.View style={{ width: size - inset * 2, height: size - inset * 2, transform: [{ scale: pulse }] }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '64%', height: '64%', borderRadius: size / 2, backgroundColor: 'rgba(10,17,51,.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={colors} style={{ width: '48%', height: '48%', borderRadius: size / 2 }} />
        </View>
      </LinearGradient>
    </Animated.View>
  </View>;
}
