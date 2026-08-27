import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AIOrb } from '@/components/AIOrb';
import { COLORS, Logo, Screen } from '@/components/ui';
import { useBranding } from '@/context/Branding';
import { QUESTIONS } from '@/services/questions';
import { read, write, remove, KEY } from '@/services/storage';
import type { Answer, Question } from '@/services/types';
import { matchProducts } from '@/services/catalog';
import { createBodyProfileSession, uploadBodyProfilePhoto, analyzeBodyProfile, clearBodyProfileToken } from '@/services/bodyProfile';

type ChatMessage = { id: string; role: 'ai' | 'user'; text: string; questionId?: string; voice?: boolean };
const CHAT_KEY = 'tiq.native.chatMessages';
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

function optionsFor(q: Question) {
  if (q.type === 'yesno') return ['Yes', 'No'];
  return q.options || undefined;
}
function questionText(q: Question) {
  let text = q.prompt;
  if (q.explanation) text += ` ${q.explanation}`;
  const opts = optionsFor(q);
  if (opts?.length) {
    if (q.type === 'multi') text += '\n\nSelect multiple options.';
    text += '\n\n' + opts.map((o, i) => `${i + 1}. ${o}`).join('\n');
  }
  if (q.optional) text += '\n\n(Optional — you can skip this.)';
  return text;
}
function ack(q: Question, display: string | string[]) {
  if (display === 'Skipped') return 'No problem — this optional question was skipped.';
  if (Array.isArray(display)) return display.length > 1 ? `Understood — I've captured ${display.slice(0, 3).join(', ')}${display.length > 3 ? '…' : ''}.` : `Got it — ${display[0]}.`;
  return display ? `Got it — ${display}.` : "Thanks — I've added that answer.";
}

export default function Assessment() {
  const branding = useBranding();
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [email, setEmail] = useState('');
  const [emailReady, setEmailReady] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{view:'front'|'side'|'back';uri:string;mimeType?:string|null;fileName?:string|null}[]>([]);
  const [bodyConsent, setBodyConsent] = useState(false);
  const [bodyStatus, setBodyStatus] = useState('');
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const colors = [branding.primaryColor || COLORS.teal, branding.gradientMidColor || COLORS.purple, branding.secondaryColor || COLORS.pink, branding.accentColor || COLORS.peach] as const;

  useEffect(() => {
    // Match the web app: opening Take Assessment always starts at the email gate.
    // We only prefill the last email; we do not resume a stale/completed chat.
    (async () => {
      const e = await read<string>(KEY.leadEmail, '');
      if (e) setEmail(e);
    })();
  }, []);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, typing]);

  const q = QUESTIONS[idx];
  const opts = q ? optionsFor(q) : undefined;
  const progress = Math.min(100, Math.round((Object.keys(answers).filter((k) => k !== 'email').length / QUESTIONS.length) * 100));
  const showTextInput = Boolean(q && !opts && q.type !== 'slider' && q.type !== 'number' && q.type !== 'image');

  async function persist(next: ChatMessage[]) { setMessages(next); await write(CHAT_KEY, next); }

  async function seedChat(address: string, questionIndex = 0) {
    const first = QUESTIONS[questionIndex];
    if (!first) return;
    const seed: ChatMessage[] = [
      { id: 'intro', role: 'ai', text: `Hi — I'm the ${branding.brandName} guided health assessment. I'll ask you a series of short questions to understand your goals, lifestyle and preferences. You can tap an option or type an answer.` },
      { id: `q_${first.id}`, role: 'ai', questionId: first.id, text: questionText(first) },
    ];
    await persist(seed);
  }

  async function submitEmail() {
    const address = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) { setEmailError('Enter a valid email address.'); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      // Exact web behavior: a fresh assessment replaces previous guest assessment state.
      await Promise.all([
        remove(KEY.answers),
        remove(KEY.recommended),
        remove(KEY.recommendationMatches),
        remove(KEY.checkoutIds),
        remove(CHAT_KEY),
        clearBodyProfileToken(),
      ]);
      await write(KEY.leadEmail, address);
      const nextAnswers: Record<string, Answer> = { email: { questionId: 'email', value: address, updatedAt: now() } };
      setAnswers(nextAnswers);
      await write(KEY.answers, nextAnswers);
      setMessages([]);
      setDraft('');
      setSelected([]);
      setEmail(address);
      setEmailError('');
      setIdx(0);
      setEmailReady(true);
      await seedChat(address, 0);
    } finally {
      submittingRef.current = false;
    }
  }

  async function advance(value: any, display: string | string[]) {
    if (!q || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const nextAnswers = { ...answers, [q.id]: { questionId: q.id, value, updatedAt: now() } };
      setAnswers(nextAnswers); await write(KEY.answers, nextAnswers);
      const userText = Array.isArray(display) ? display.join(', ') : display;
      let next = [...messages, { id: `u_${Date.now()}`, role: 'user' as const, text: userText, questionId: q.id }];
      await persist(next);
      setDraft(''); setSelected([]); setPhotos([]); setBodyConsent(false); setBodyStatus(''); setTyping(true);
      await delay(430);
      next = [...next, { id: `ack_${Date.now()}`, role: 'ai' as const, text: ack(q, display) }];
      await persist(next);
      const nextIdx = idx + 1;
      if (nextIdx >= QUESTIONS.length) {
        const lines = ['Thank you — I have everything I need.', "I'm reviewing your goals and preferences.", "I'm comparing your responses with the available product catalogue.", "I'm preparing your preliminary recommendations."];
        for (const line of lines) { setTyping(true); await delay(520); next = [...next, { id: `p_${Date.now()}_${Math.random()}`, role: 'ai', text: line }]; await persist(next); }
        setTyping(false); await finish(nextAnswers); return;
      }
      await delay(300);
      const nq = QUESTIONS[nextIdx];
      next = [...next, { id: `q_${nq.id}_${Date.now()}`, role: 'ai', questionId: nq.id, text: questionText(nq) }];
      await persist(next); setTyping(false); setIdx(nextIdx);
    } finally { submittingRef.current = false; setSubmitting(false); }
  }

  async function finish(a: Record<string, Answer>) {
    setBusy(true);
    try {
      const r = await matchProducts(a);
      const matches = (r.matches || []).slice(0, 4);
      const ids = matches.map((m) => m.productId);
      const reasons = Object.fromEntries(matches.map((m) => [m.productId, m.reasons || []]));
      const current = await read<string[]>(KEY.checkoutIds, []);
      const allowed = new Set(ids);
      await write(KEY.recommended, ids); await write(KEY.recommendationMatches, reasons); await write(KEY.checkoutIds, current.filter((id) => allowed.has(id)));
      router.replace('/recommendation');
    } catch (reason) { Alert.alert('Could not create recommendations', reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  function selectOption(option: string) {
    if (!q || submittingRef.current) return;
    if (q.type === 'multi') { setSelected((current) => current.includes(option) ? current.filter((x) => x !== option) : [...current, option]); return; }
    setSelected([option]); void advance(option, option);
  }

  async function pickPhoto(view: 'front' | 'side' | 'back') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photo access required', 'Allow photo access to add an optional body-profile photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .82, allowsEditing: false });
    if (!result.canceled) {
      const a = result.assets[0];
      setPhotos((current) => [...current.filter((p) => p.view !== view), { view, uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }]);
      setBodyStatus('');
    }
  }

  async function submitBodyProfile() {
    if (!q || q.type !== 'image' || submittingRef.current) return;
    const front = photos.find((p) => p.view === 'front');
    const side = photos.find((p) => p.view === 'side');
    if (!bodyConsent) { setBodyStatus('Confirm consent before uploading body photos.'); return; }
    if (!front || !side) { setBodyStatus('Front and side photos are required, or you can skip this optional step.'); return; }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      setBodyStatus('Uploading private photos…');
      let profile = await createBodyProfileSession();
      profile = await uploadBodyProfilePhoto(profile.token, 'front', front);
      profile = await uploadBodyProfilePhoto(profile.token, 'side', side);
      const back = photos.find((p) => p.view === 'back');
      if (back) profile = await uploadBodyProfilePhoto(profile.token, 'back', back);
      let analyzed = false;
      setBodyStatus('Creating a non-diagnostic body profile…');
      try { profile = await analyzeBodyProfile(profile.token, answers); analyzed = true; } catch { /* uploads remain available for reviewer review */ }
      const value = { token: profile.token, status: analyzed ? profile.status : 'uploaded_pending_analysis', visualSummary: profile.visualSummary || '', visibleSignals: profile.visibleSignals || [], goalTags: profile.goalTags || [], confidence: profile.confidence || 'low', hasFront: true, hasSide: true, hasBack: Boolean(back) };
      submittingRef.current = false;
      setSubmitting(false);
      await advance(value, analyzed ? 'Body profile added' : 'Body photos added for reviewer review');
    } catch (reason) {
      setBodyStatus(reason instanceof Error ? reason.message : 'Body photos could not be uploaded. You can skip this step.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (!emailReady) return <Screen><SafeAreaView style={s.fill}><View style={s.emailScreen}>
    <AIOrb size={70}/>
    <Text style={s.eyebrow}>BEFORE WE BEGIN</Text>
    <Text style={s.emailTitle}>Enter your email</Text>
    <Text style={s.emailCopy}>We use this to keep your assessment, recommendations and checkout connected to the same member record.</Text>
    <View style={s.emailComposer}>
      <TextInput ref={input} autoFocus value={email} onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }} onSubmitEditing={submitEmail} autoCapitalize="none" keyboardType="email-address" returnKeyType="go" placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,.35)" style={s.emailInput}/>
      <Pressable onPress={submitEmail}><LinearGradient colors={colors} style={s.roundSend}><Ionicons name="send" size={16} color="#fff"/></LinearGradient></Pressable>
    </View>
    {emailError ? <Text style={s.emailError}>{emailError}</Text> : null}
    <Text style={s.enterHint}>Press Enter to continue.</Text>
  </View></SafeAreaView></Screen>;

  return <Screen><SafeAreaView style={s.fill} edges={['top']}>
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <Logo height={26}/>
        <View style={s.progressWrap}><View style={s.progressTop}><Text style={s.progressText}>Assessment</Text><Text style={s.progressText}>{progress}%</Text></View><View style={s.track}><LinearGradient colors={colors} style={[s.progressFill, { width: `${progress}%` } as any]}/></View></View>
        <Pressable onPress={() => router.push('/login')}><Text style={s.login}>Log in</Text></Pressable>
      </View>

      <ScrollView ref={scroll} style={s.fill} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled">
        {messages.map((message) => message.role === 'ai' ? <View key={message.id} style={s.aiRow}><AIOrb size={36} speaking={typing && message.id === messages[messages.length - 1]?.id}/><View style={s.aiBubble}><Text style={s.aiText}>{message.text}</Text></View></View> : <View key={message.id} style={s.userRow}><LinearGradient colors={colors} style={s.userBubble}>{message.voice ? <Ionicons name="mic" size={12} color="#fff"/> : null}<Text style={s.userText}>{message.text}</Text></LinearGradient></View>)}
        {typing ? <View style={s.typing}><AIOrb size={28} speaking/><Text style={s.typingText}>Coach is typing…</Text></View> : null}
        {busy ? <Text style={s.preparing}>Preparing your preliminary recommendations…</Text> : null}
      </ScrollView>

      {q && !busy ? <View style={s.answerDock}><View style={s.answerMax}>
        {opts ? <View style={s.pills}>{opts.map((option, i) => { const on = selected.includes(option); return <Pressable key={option} disabled={submitting} onPress={() => selectOption(option)} style={s.pillOuter}><LinearGradient colors={on ? colors : ['rgba(255,255,255,.075)','rgba(255,255,255,.075)'] as any} style={[s.pill, on ? s.pillOn : s.pillOff]}><View style={[s.numDot, on ? s.numDotOn : s.numDotOff]}><Text style={s.numText}>{i + 1}</Text></View><Text style={s.pillText}>{option}</Text></LinearGradient></Pressable>; })}</View> : null}

        {q.type === 'number' ? <NumberAnswer q={q} value={draft} setValue={setDraft} colors={colors} submitting={submitting} send={() => { const n = Number(draft); if (Number.isFinite(n) && (q.min == null || n >= q.min) && (q.max == null || n <= q.max)) void advance(n, `${n}${q.unit ? ` ${q.unit}` : ''}`); }} /> : null}
        {q.type === 'slider' ? <SliderAnswer q={q} value={draft} setValue={setDraft} colors={colors} submitting={submitting} send={() => { const n = draft ? Number(draft) : Math.round(((q.min ?? 0) + (q.max ?? 10)) / 2); void advance(n, String(n)); }}/> : null}
        {q.type === 'image' ? <ImageAnswer photos={photos} pickPhoto={pickPhoto} consent={bodyConsent} setConsent={setBodyConsent} status={bodyStatus} send={submitBodyProfile} skip={() => advance('Skipped','Skipped')} colors={colors} submitting={submitting}/> : null}
        {showTextInput ? <View style={s.composer}>
          <TextInput ref={input} value={draft} onChangeText={setDraft} keyboardType={q.type === 'number' ? 'numeric' : 'default'} multiline={q.type === 'text'} placeholder={q.optional ? 'Type an answer or skip…' : 'Type your answer…'} placeholderTextColor="rgba(255,255,255,.35)" style={s.input}/>
          {q.optional && !draft.trim() ? <Pressable onPress={() => advance('Skipped', 'Skipped')} style={s.skip}><Text style={s.skipText}>Skip</Text></Pressable> : null}
          <Pressable disabled={(!draft.trim() && !q.optional) || submitting} onPress={() => advance(draft.trim() || 'Skipped', draft.trim() || 'Skipped')}><LinearGradient colors={colors} style={[s.roundSend, ((!draft.trim() && !q.optional) || submitting) && { opacity: .42 }]}><Ionicons name="send" size={16} color="#fff"/></LinearGradient></Pressable>
        </View> : null}
        {q.type === 'multi' ? <Pressable disabled={!selected.length || submitting} onPress={() => advance(selected, selected)} style={s.multiSendHit}><LinearGradient colors={colors} style={[s.multiSend, (!selected.length || submitting) && { opacity: .42 }]}><Text style={s.multiSendText}>Send</Text><Ionicons name="send" size={14} color="#fff"/></LinearGradient></Pressable> : null}
      </View></View> : null}
    </KeyboardAvoidingView>
  </SafeAreaView></Screen>;
}

function NumberAnswer({ q, value, setValue, colors, submitting, send }: { q: Question; value: string; setValue: (v: string) => void; colors: readonly [string,string,string,string]; submitting: boolean; send: () => void }) {
  const n = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(n) && (q.min == null || n >= q.min) && (q.max == null || n <= q.max);
  return <View style={s.numberBox}>
    <TextInput value={value} onChangeText={setValue} keyboardType="number-pad" returnKeyType="send" onSubmitEditing={() => valid && send()} placeholder="Enter a number" placeholderTextColor="rgba(255,255,255,.35)" style={s.numberInput}/>
    {q.unit ? <Text style={s.numberUnit}>{q.unit}</Text> : null}
    <Pressable disabled={!valid || submitting} onPress={send}><LinearGradient colors={colors} style={[s.inlineSend, (!valid || submitting) && { opacity: .42 }]}><Ionicons name="send" size={16} color="#fff"/></LinearGradient></Pressable>
  </View>;
}

function SliderAnswer({ q, value, setValue, colors, submitting, send }: { q: Question; value: string; setValue: (v: string) => void; colors: readonly [string,string,string,string]; submitting: boolean; send: () => void }) {
  const min = q.min ?? 1; const max = q.max ?? 10; const current = value || String(Math.round((min + max) / 2));
  const nums = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [q.id, min, max]);
  return <View style={s.sliderBox}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sliderNums}>{nums.map((n) => <Pressable key={n} onPress={() => setValue(String(n))}><LinearGradient colors={current === String(n) ? colors : ['rgba(255,255,255,.055)','rgba(255,255,255,.055)'] as any} style={[s.sliderNum, current === String(n) ? s.pillOn : s.pillOff]}><Text style={s.sliderNumText}>{n}</Text></LinearGradient></Pressable>)}</ScrollView><Pressable disabled={submitting} onPress={send}><LinearGradient colors={colors} style={[s.inlineSend, submitting && { opacity: .42 }]}><Ionicons name="send" size={16} color="#fff"/></LinearGradient></Pressable></View>;
}

function ImageAnswer({ photos, pickPhoto, consent, setConsent, status, send, skip, colors, submitting }: { photos: {view:'front'|'side'|'back';uri:string}[]; pickPhoto: (view:'front'|'side'|'back') => void; consent:boolean; setConsent:(v:boolean)=>void; status:string; send: () => void; skip:()=>void; colors: readonly [string,string,string,string]; submitting: boolean }) {
  return <View style={s.imageCard}><View style={s.imageHead}><LinearGradient colors={colors} style={s.imageIcon}><Ionicons name="image-outline" size={18} color="#fff"/></LinearGradient><View style={{ flex: 1 }}><Text style={s.imageTitle}>Optional body profile</Text><Text style={s.imageCopy}>Front and side photos are required for analysis. Face visibility is not required. Photos are private and used only as a secondary wellness signal.</Text></View></View>
    <View style={{gap:8}}>{(['front','side','back'] as const).map((view)=>{const p=photos.find(x=>x.view===view);return <Pressable key={view} onPress={()=>pickPhoto(view)} style={s.upload}><Ionicons name={p?'checkmark-circle':'cloud-upload-outline'} size={20} color={p?COLORS.green:COLORS.teal}/><Text style={s.uploadText}>{p?`${view[0].toUpperCase()+view.slice(1)} photo selected`:`Choose ${view} photo${view==='back'?' (optional)':''}`}</Text></Pressable>})}</View>
    {photos.length?<ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{photos.map((p) => <Image key={p.view} source={{ uri:p.uri }} style={s.thumb}/>)}</ScrollView>:null}
    <Pressable onPress={()=>setConsent(!consent)} style={{flexDirection:'row',alignItems:'flex-start',gap:9}}><Ionicons name={consent?'checkbox':'square-outline'} size={20} color={consent?COLORS.teal:'rgba(255,255,255,.55)'}/><Text style={[s.imageCopy,{flex:1,marginTop:0}]}>I consent to private body-photo analysis and human review. This is non-diagnostic and optional.</Text></Pressable>
    {status?<Text style={{color:status.toLowerCase().includes('upload')||status.toLowerCase().includes('creating')?COLORS.teal:'#fda4af',fontSize:11,lineHeight:16}}>{status}</Text>:null}
    <Pressable disabled={submitting||!consent||!photos.find(p=>p.view==='front')||!photos.find(p=>p.view==='side')} onPress={send}><LinearGradient colors={colors} style={[s.imageContinue,(submitting||!consent||!photos.find(p=>p.view==='front')||!photos.find(p=>p.view==='side'))&&{opacity:.42}]}><Text style={s.multiSendText}>{submitting?'Uploading…':'Continue with photos'}</Text></LinearGradient></Pressable><Pressable disabled={submitting} onPress={skip} style={{alignItems:'center',padding:8}}><Text style={s.skipText}>Skip optional photos</Text></Pressable></View>;
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: { height: 64, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.10)', flexDirection: 'row', alignItems: 'center' },
  progressWrap: { flex: 1, marginHorizontal: 14 }, progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }, progressText: { color: 'rgba(255,255,255,.55)', fontSize: 10 },
  track: { height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden' }, progressFill: { height: 4, borderRadius: 99 }, login: { color: 'rgba(255,255,255,.72)', fontSize: 11, fontWeight: '700' },
  emailScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 54 }, eyebrow: { marginTop: 22, color: 'rgba(255,255,255,.50)', fontSize: 10.5, letterSpacing: 2.2, fontWeight: '700' }, emailTitle: { marginTop: 8, color: '#fff', fontSize: 31, lineHeight: 37, fontWeight: '800' }, emailCopy: { maxWidth: 460, marginTop: 8, color: 'rgba(255,255,255,.60)', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emailComposer: { width: '100%', maxWidth: 520, minHeight: 62, marginTop: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: 'rgba(255,255,255,.055)', borderRadius: 18, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }, emailInput: { flex: 1, color: '#fff', fontSize: 16, paddingHorizontal: 10, paddingVertical: 11 }, emailError: { color: '#fda4af', fontSize: 12, marginTop: 8 }, enterHint: { color: 'rgba(255,255,255,.40)', fontSize: 10.5, marginTop: 11 },
  messages: { width: '100%', maxWidth: 768, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 28, gap: 20 }, aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, aiBubble: { maxWidth: '85%', borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: 'rgba(255,255,255,.065)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', paddingHorizontal: 16, paddingVertical: 13 }, aiText: { color: 'rgba(255,255,255,.90)', fontSize: 15, lineHeight: 23 }, userRow: { flexDirection: 'row', justifyContent: 'flex-end' }, userBubble: { maxWidth: '85%', borderRadius: 18, borderTopRightRadius: 4, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, userText: { color: '#fff', fontSize: 15, lineHeight: 22, fontWeight: '600' }, typing: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 48 }, typingText: { color: 'rgba(255,255,255,.60)', fontSize: 11 }, preparing: { color: 'rgba(255,255,255,.70)', fontSize: 13, textAlign: 'center', paddingVertical: 18 },
  answerDock: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.10)', backgroundColor: 'rgba(10,17,51,.98)', paddingHorizontal: 16, paddingVertical: 13 }, answerMax: { width: '100%', maxWidth: 768, alignSelf: 'center', gap: 11 }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, pillOuter: { borderRadius: 99 }, pill: { minHeight: 38, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }, pillOn: { borderWidth: 0 }, pillOff: { borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, numDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, numDotOn: { backgroundColor: 'rgba(255,255,255,.25)' }, numDotOff: { backgroundColor: 'rgba(255,255,255,.10)' }, numText: { color: 'rgba(255,255,255,.90)', fontSize: 10, fontWeight: '800' }, pillText: { color: 'rgba(255,255,255,.88)', fontSize: 13 },
  composer: { minHeight: 62, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', backgroundColor: 'rgba(255,255,255,.055)', borderRadius: 24, padding: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }, input: { flex: 1, minHeight: 46, maxHeight: 132, color: '#fff', fontSize: 14, lineHeight: 20, paddingHorizontal: 11, paddingVertical: 11, textAlignVertical: 'top' }, roundSend: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, skip: { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 8 }, skipText: { color: 'rgba(255,255,255,.60)', fontSize: 12, fontWeight: '700' },
  numberBox: { minHeight: 58, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', backgroundColor: 'rgba(255,255,255,.055)', borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, numberInput: { flex: 1, color: '#fff', fontSize: 18, paddingVertical: 12 }, numberUnit: { color: 'rgba(255,255,255,.55)', fontSize: 12 },
  multiSendHit: { alignSelf: 'flex-end' }, multiSend: { height: 42, borderRadius: 21, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, multiSendText: { color: '#fff', fontSize: 13, fontWeight: '800' }, sliderBox: { flexDirection: 'row', gap: 8, alignItems: 'center' }, sliderNums: { gap: 7, paddingRight: 2 }, sliderNum: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, sliderNumText: { color: '#fff', fontSize: 13, fontWeight: '700' }, inlineSend: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  imageCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: 'rgba(255,255,255,.05)', padding: 14, gap: 12 }, imageHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, imageIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, imageTitle: { color: '#fff', fontSize: 14, fontWeight: '700' }, imageCopy: { color: 'rgba(255,255,255,.57)', fontSize: 10.5, lineHeight: 16, marginTop: 4 }, upload: { minHeight: 72, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(122,199,200,.35)', alignItems: 'center', justifyContent: 'center', gap: 4 }, uploadText: { color: '#fff', fontSize: 12, fontWeight: '700' }, thumb: { width: 68, height: 68, borderRadius: 10 }, imageContinue: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
