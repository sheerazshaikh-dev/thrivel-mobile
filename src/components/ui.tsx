import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBranding, remoteBrandImage } from '@/context/Branding';

export const COLORS = {
  bg: '#0A1133',
  panel: '#101943',
  panel2: '#0E173D',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,.62)',
  border: 'rgba(255,255,255,.12)',
  teal: '#7AC7C8',
  purple: '#9971B1',
  pink: '#EC437D',
  peach: '#F4946E',
  green: '#70D6B2',
  warning: '#F4C46E',
};

export const grad = ['#7AC7C8', '#9971B1', '#EC437D', '#F4946E'] as const;

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const b = useBranding();
  return <View style={[styles.screen, { backgroundColor: b.backgroundColor || COLORS.bg }, style]}>{children}</View>;
}

export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const b = useBranding();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: b.panelColor || COLORS.panel },
        style as any,
      ]}
    >
      {children}
    </View>
  );
}

export function GradientButton({
  title,
  onPress,
  disabled = false,
  icon,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const b = useBranding();
  const colors = [
    b.primaryColor || COLORS.teal,
    b.gradientMidColor || COLORS.purple,
    b.secondaryColor || COLORS.pink,
    b.accentColor || COLORS.peach,
  ] as const;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.55 : 1 }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {icon ? <Ionicons name={icon} size={17} color="#fff" /> : null}
        <Text style={styles.btnText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable onPress={onPress} style={styles.outline}>
      {icon ? <Ionicons name={icon} size={16} color="#fff" /> : null}
      <Text style={styles.outlineText}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  keyboardType,
  multiline,
  ...rest
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor="rgba(255,255,255,.3)"
        value={value as string}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          !editable && { opacity: 0.55 },
          multiline && { minHeight: 100, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

const localFallbacks = {
  logoDark: require('../../assets/logo-dark.png'),
  logoLight: require('../../assets/logo-light.png'),
  hero: require('../../assets/hero-wellness.png'),
  auth: require('../../assets/auth-wellness.png'),
  checkout: require('../../assets/checkout-stack.png'),
  dashboard: require('../../assets/dashboard-progress.png'),
  assessment: require('../../assets/assessment-wellness.png'),
  product: require('../../assets/product-default.png'),
} as const;

type BrandImageKind = keyof typeof localFallbacks;

function brandAssetUrl(kind: BrandImageKind, branding: ReturnType<typeof useBranding>): string {
  const value =
    kind === 'logoDark'
      ? branding.logoDarkUrl
      : kind === 'logoLight'
        ? branding.logoLightUrl
        : kind === 'hero'
          ? branding.heroImageUrl
          : kind === 'auth'
            ? branding.authImageUrl
            : kind === 'checkout'
              ? branding.checkoutImageUrl
              : kind === 'dashboard'
                ? branding.dashboardImageUrl
                : kind === 'assessment'
                  ? branding.assessmentImageUrl
                  : branding.defaultProductImageUrl;
  return remoteBrandImage(value);
}

function RemoteFirstImage({
  remote,
  fallback,
  style,
  contentFit = 'cover',
  accessibilityLabel,
}: {
  remote?: string;
  fallback: number;
  style: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  accessibilityLabel?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [remote]);
  const source = !failed && remote ? remote : fallback;
  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={150}
      accessibilityLabel={accessibilityLabel}
      onError={() => {
        if (remote) setFailed(true);
      }}
    />
  );
}

export function Logo({ height = 29, light = false }: { height?: number; light?: boolean }) {
  const b = useBranding();
  const kind: BrandImageKind = light ? 'logoLight' : 'logoDark';
  const remote = brandAssetUrl(kind, b);
  const width = Math.max(145, Math.round(height * 5.5));
  return (
    <RemoteFirstImage
      remote={remote}
      fallback={localFallbacks[kind]}
      contentFit="contain"
      accessibilityLabel={b.brandName}
      style={{ width, height }}
    />
  );
}

export function BrandImage({
  kind = 'product',
  uri,
  style,
  contentFit = 'cover',
}: {
  kind?: Exclude<BrandImageKind, 'logoDark' | 'logoLight'>;
  uri?: string;
  style: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}) {
  const b = useBranding();
  const remote = remoteBrandImage(uri) || brandAssetUrl(kind, b);
  return (
    <RemoteFirstImage
      remote={remote}
      fallback={localFallbacks[kind]}
      contentFit={contentFit}
      style={style}
    />
  );
}

export function Title({ children, size = 28 }: { children: React.ReactNode; size?: number }) {
  return <Text style={{ color: '#fff', fontSize: size, fontWeight: '800', lineHeight: size * 1.15 }}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export { styles };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  panel: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  btn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  outline: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,.04)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  outlineText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.2)',
    backgroundColor: 'rgba(255,255,255,.035)',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 14,
  },
  muted: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
});
