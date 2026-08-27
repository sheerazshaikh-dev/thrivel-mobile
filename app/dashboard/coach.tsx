import { useEffect, useRef, useState, type RefObject } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding } from '@/context/Branding';
import { COLORS, Muted, Screen } from '@/components/ui';
import { FormattedMessage } from '@/components/FormattedMessage';
import { clearAdvisorMessages, loadAdvisor, sendAdvisorMessage } from '@/services/member';
import { router } from 'expo-router';

export default function Coach() {
  const branding = useBranding();
  const [advisor, setAdvisor] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const colors = [branding.primaryColor || COLORS.teal, branding.gradientMidColor || COLORS.purple, branding.secondaryColor || COLORS.pink, branding.accentColor || COLORS.peach] as const;

  const refresh = async () => setAdvisor(await loadAdvisor());

  useEffect(() => {
    refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'AI Health Coach could not be loaded.'));
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (advisor?.messages?.length || sending || keyboardOpen) {
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), keyboardOpen ? 180 : 90);
    }
  }, [advisor?.messages?.length, sending, keyboardOpen]);

  async function send() {
    const text = message.trim();
    if (!text || sending || !advisor?.enabled) return;
    setSending(true);
    setMessage('');
    try {
      const result: any = await sendAdvisorMessage(text);
      setAdvisor((current: any) => current ? {
        ...current,
        messages: [...(current.messages || []), result.userMessage, result.assistantMessage],
        rateLimit: current.rateLimit ? { ...current.rateLimit, used: current.rateLimit.used + 1, remaining: Math.max(0, current.rateLimit.remaining - 1) } : current.rateLimit,
      } : current);
    } catch (reason) {
      setMessage(text);
      Alert.alert('The coach could not respond', reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => input.current?.focus(), 0);
    }
  }

  function clear() {
    Alert.alert('Clear conversation?', 'Clear your AI Health Coach conversation history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearAdvisorMessages(); await refresh(); } },
    ]);
  }

  if (error) return <Screen><SafeAreaView style={s.fill}><SimpleCoachHeader/><View style={s.center}><View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View></View></SafeAreaView></Screen>;
  if (!advisor) return <Screen><SafeAreaView style={s.fill}><SimpleCoachHeader/><View style={s.center}><View style={s.loadingRow}><Ionicons name="sync" size={15} color="rgba(255,255,255,.6)"/><Muted>Loading AI Health Coach…</Muted></View></View></SafeAreaView></Screen>;
  if (!advisor.entitled) return <State title="AI Health Coach subscription required" text="Chat is available only while your monthly AI Health Coach subscription is active." colors={colors}/>;
  if (!advisor.configured) return <State title="AI Health Coach is not configured" text="The OpenAI key must be configured on the PHP backend. It is never exposed to the app." colors={colors} warning/>;

  const hasConversation = advisor.messages?.length > 0;

  return <Screen><SafeAreaView style={s.fill} edges={['top']}>
    <KeyboardAvoidingView
      style={s.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={s.header}>
        <View style={s.headerIdentity}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to dashboard" onPress={() => router.replace('/dashboard')} style={s.back}>
            <Ionicons name="chevron-back" size={22} color="#fff"/>
          </Pressable>
          <LinearGradient colors={colors} style={s.headerBot}><Ionicons name="chatbubble-ellipses-outline" size={17} color="#fff"/></LinearGradient>
          <View style={s.headerText}><Text numberOfLines={1} style={s.headerTitle}>AI Health Coach</Text><Text numberOfLines={1} style={s.headerSub}>Private · personalized to your {branding.brandName} account</Text></View>
        </View>
        {hasConversation ? <Pressable accessibilityLabel="Clear conversation" onPress={clear} style={s.clear}><Ionicons name="trash-outline" size={17} color="#fff"/></Pressable> : null}
      </View>

      {!hasConversation ? <View style={[s.emptyWrap, keyboardOpen && s.emptyWrapKeyboard]}>
        <ScrollView
          contentContainerStyle={[s.emptyScroll, keyboardOpen && s.emptyScrollKeyboard]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.emptyInner, keyboardOpen && s.emptyInnerKeyboard]}>
            <LinearGradient colors={colors} style={[s.emptyBot, keyboardOpen && s.emptyBotKeyboard]}><Ionicons name="chatbubble-ellipses-outline" size={25} color="#fff"/></LinearGradient>
            <Text style={[s.emptyTitle, keyboardOpen && s.emptyTitleKeyboard]}>How can I help with your health plan?</Text>
            {!keyboardOpen ? <Text style={s.emptyCopy}>Ask about meals, workouts, sleep, recovery, your purchased products, progress, or your reviewer-published plan. If another catalog product fits a new goal, the coach can point you to it for review before checkout. Medication changes and research-product administration remain outside the coach.</Text> : null}
          </View>
        </ScrollView>
        <View style={s.emptyComposerDock}>
          <Composer value={message} setValue={setMessage} send={send} sending={sending} inputRef={input} colors={colors}/>
          {!keyboardOpen ? <Text style={s.limit}>{advisor.rateLimit ? `${advisor.rateLimit.remaining} messages remaining this hour · ` : ''}Health and {branding.brandName} topics only.</Text> : null}
        </View>
      </View> : <>
        <ScrollView
          ref={scroll}
          style={s.fill}
          contentContainerStyle={[s.messages, keyboardOpen && s.messagesKeyboard]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {advisor.messages.map((entry: any) => <View key={entry.id} style={[s.row, entry.role === 'user' ? s.rowUser : s.rowAi]}>
            {entry.role === 'user' ? <LinearGradient colors={colors} style={s.userBubble}><Text style={s.userText}>{entry.content}</Text></LinearGradient> : <View style={s.aiBlock}><View style={s.aiIcon}><Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff"/></View><View style={s.aiCopy}><FormattedMessage content={entry.content}/></View></View>}
          </View>)}
          {sending ? <View style={s.thinking}><View style={s.aiIcon}><Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff"/></View><Ionicons name="sync" size={15} color="rgba(255,255,255,.58)"/><Text style={s.thinkingText}>Thinking…</Text></View> : null}
        </ScrollView>
        <View style={[s.composerDock, keyboardOpen && s.composerDockKeyboard]}>
          <View style={s.composerMax}>
            <Composer value={message} setValue={setMessage} send={send} sending={sending} inputRef={input} colors={colors}/>
            {!keyboardOpen ? <Text style={s.footerNote}>{advisor.rateLimit ? `${advisor.rateLimit.remaining} messages remaining this hour. ` : ''}AI Health Coach can explain and support the published plan but cannot change medication or dosage.</Text> : null}
          </View>
        </View>
      </>}
    </KeyboardAvoidingView>
  </SafeAreaView></Screen>;
}

function Composer({ value, setValue, send, sending, inputRef, colors }: { value: string; setValue: (v: string) => void; send: () => void; sending: boolean; inputRef: RefObject<TextInput | null>; colors: readonly [string,string,string,string] }) {
  return <View style={s.composer}>
    <TextInput ref={inputRef} value={value} onChangeText={setValue} multiline placeholder="Message AI Health Coach…" placeholderTextColor="rgba(255,255,255,.32)" style={s.input} blurOnSubmit={false} returnKeyType="default"/>
    <Pressable accessibilityLabel="Send message" onPress={send} disabled={!value.trim() || sending} style={s.sendHit}><LinearGradient colors={colors} style={[s.send, (!value.trim() || sending) && s.sendDisabled]}><Ionicons name="send" size={16} color="#fff"/></LinearGradient></Pressable>
  </View>;
}

function SimpleCoachHeader() {
  return <View style={s.simpleHeader}><Pressable accessibilityRole="button" accessibilityLabel="Back to dashboard" onPress={() => router.replace('/dashboard')} style={s.back}><Ionicons name="chevron-back" size={22} color="#fff"/></Pressable><Text style={s.simpleHeaderTitle}>AI Health Coach</Text></View>;
}

function State({ title, text, colors, warning = false }: { title: string; text: string; colors: readonly [string,string,string,string]; warning?: boolean }) {
  return <Screen><SafeAreaView style={s.fill}><SimpleCoachHeader/><View style={s.center}><View style={s.stateInner}>{warning ? <View style={s.warnIcon}><Ionicons name="shield-outline" size={25} color={COLORS.warning}/></View> : <LinearGradient colors={colors} style={s.emptyBot}><Ionicons name="sparkles-outline" size={25} color="#fff"/></LinearGradient>}<Text style={s.stateTitle}>{title}</Text><Text style={s.stateText}>{text}</Text></View></View></SafeAreaView></Screen>;
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.10)', paddingHorizontal: 16 },
  simpleHeader: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.10)', paddingHorizontal: 16 },
  simpleHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerIdentity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  headerBot: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { minWidth: 0, flex: 1 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerSub: { color: 'rgba(255,255,255,.45)', fontSize: 10.5, marginTop: 2 },
  clear: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },
  emptyWrapKeyboard: { paddingBottom: 6 },
  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 28 },
  emptyScrollKeyboard: { justifyContent: 'flex-start', paddingTop: 22, paddingBottom: 12 },
  emptyInner: { width: '100%', maxWidth: 768, alignSelf: 'center', transform: [{ translateY: -16 }] },
  emptyInnerKeyboard: { transform: [{ translateY: 0 }] },
  emptyBot: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  emptyBotKeyboard: { width: 44, height: 44, borderRadius: 13 },
  emptyTitle: { color: '#fff', textAlign: 'center', marginTop: 20, fontWeight: '700', letterSpacing: -.6, fontSize: 30, lineHeight: 36 },
  emptyTitleKeyboard: { marginTop: 14, fontSize: 24, lineHeight: 30 },
  emptyCopy: { color: 'rgba(255,255,255,.55)', textAlign: 'center', marginTop: 12, marginBottom: 26, fontSize: 13, lineHeight: 21 },
  emptyComposerDock: { width: '100%', maxWidth: 768, alignSelf: 'center' },
  messages: { width: '100%', maxWidth: 768, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 30, paddingBottom: 32, gap: 28 },
  messagesKeyboard: { paddingBottom: 18 },
  row: { flexDirection: 'row', width: '100%' },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start' },
  userBubble: { maxWidth: '82%', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 },
  userText: { color: '#fff', fontSize: 14, lineHeight: 22 },
  aiBlock: { width: '100%', flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiIcon: { marginTop: 2, width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', backgroundColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center' },
  aiCopy: { flex: 1, paddingTop: 2, minWidth: 0 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinkingText: { color: 'rgba(255,255,255,.55)', fontSize: 13 },
  composerDock: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.10)', backgroundColor: 'rgba(10,17,51,.98)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 10 : 14 },
  composerDockKeyboard: { paddingBottom: 6 },
  composerMax: { width: '100%', maxWidth: 768, alignSelf: 'center' },
  composer: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', backgroundColor: 'rgba(255,255,255,.055)', borderRadius: 28, padding: 7 },
  input: { flex: 1, minHeight: 44, maxHeight: 144, color: '#fff', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  sendHit: { alignSelf: 'flex-end' },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: .42 },
  limit: { color: 'rgba(255,255,255,.35)', fontSize: 10.5, textAlign: 'center', marginTop: 9 },
  footerNote: { color: 'rgba(255,255,255,.35)', fontSize: 9.5, lineHeight: 15, textAlign: 'center', marginTop: 7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  loadingRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  errorBox: { maxWidth: 520, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(248,113,113,.25)', backgroundColor: 'rgba(248,113,113,.10)', padding: 20 },
  errorText: { color: '#fecaca', fontSize: 13, lineHeight: 20 },
  stateInner: { maxWidth: 420, alignItems: 'center' },
  warnIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,196,110,.10)' },
  stateTitle: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 24, lineHeight: 30, marginTop: 20 },
  stateText: { color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 9 },
});
