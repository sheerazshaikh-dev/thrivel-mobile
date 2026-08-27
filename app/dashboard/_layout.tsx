import {useEffect,useState} from 'react';
import {Tabs,router,usePathname} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {ActivityIndicator,BackHandler,Pressable,StyleSheet,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {COLORS,Screen} from '@/components/ui';
import {useBranding} from '@/context/Branding';
import {currentUser,isAuthenticated} from '@/services/auth';

export default function DashboardLayout(){
 const[ready,setReady]=useState(false);const b=useBranding();const pathname=usePathname();
 useEffect(()=>{let live=true;(async()=>{if(!await isAuthenticated()){router.replace('/login');return}try{const u=await currentUser(true);if(u.role!=='customer'){router.replace('/login');return}}catch{if(!await isAuthenticated()){router.replace('/login');return}}if(live)setReady(true)})();return()=>{live=false}},[]);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(!ready)return true;if(pathname!=='/dashboard'&&pathname!=='/dashboard/'){router.replace('/dashboard');return true}return true});return()=>sub.remove()},[pathname,ready]);
 if(!ready)return <Screen><View style={s.center}><ActivityIndicator color={b.primaryColor||COLORS.teal}/></View></Screen>;
 const showCoachFab=pathname!=='/dashboard/coach';
 return <View style={{flex:1}}><Tabs backBehavior="initialRoute" screenOptions={{headerShown:false,tabBarStyle:{height:70,backgroundColor:b.backgroundColor||'#0A1133',borderTopColor:COLORS.border,paddingTop:7,paddingBottom:7},tabBarActiveTintColor:'#fff',tabBarInactiveTintColor:'rgba(255,255,255,.48)',tabBarLabelStyle:{fontSize:9.5,fontWeight:'700'}}}>
   <Tabs.Screen name="index" options={{title:'Dashboard',tabBarIcon:({color})=><Ionicons name="grid-outline" size={21} color={color}/>}}/>
   <Tabs.Screen name="recommendation" options={{title:'Recommend',tabBarIcon:({color})=><Ionicons name="sparkles-outline" size={21} color={color}/>}}/>
   <Tabs.Screen name="plan" options={{title:'Plan',tabBarIcon:({color})=><Ionicons name="clipboard-outline" size={21} color={color}/>}}/>
   <Tabs.Screen name="orders" options={{title:'Orders',tabBarIcon:({color})=><Ionicons name="bag-outline" size={21} color={color}/>}}/>
   <Tabs.Screen name="profile" options={{title:'Profile',tabBarIcon:({color})=><Ionicons name="person-outline" size={21} color={color}/>}}/>
   <Tabs.Screen name="subscription" options={{href:null}}/><Tabs.Screen name="coach" options={{href:null,tabBarStyle:{display:'none'}}}/>
 </Tabs>{showCoachFab?<Pressable accessibilityLabel="Open AI Health Coach" onPress={()=>router.push('/dashboard/coach')} style={s.fabHit}><LinearGradient colors={[b.primaryColor,b.gradientMidColor,b.secondaryColor,b.accentColor] as any} style={s.fab}><Ionicons name="chatbubble-ellipses" size={24} color="#fff"/></LinearGradient></Pressable>:null}</View>
}
const s=StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center'},fabHit:{position:'absolute',right:16,bottom:82,zIndex:20},fab:{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.35,shadowRadius:14,shadowOffset:{width:0,height:8},elevation:10}})
