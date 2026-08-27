import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BrandingProvider,useBranding} from '@/context/Branding';
import {ActivityIndicator,Image,StyleSheet,View} from 'react-native';

function AppStack(){
  const b=useBranding();
  if(!b.brandingLoaded){
    return <View style={[s.preloader,{backgroundColor:b.accentColor||'#F4946E'}]}>
      <StatusBar style="dark"/>
      <Image source={require('../assets/icon.png')} style={s.preloaderIcon} resizeMode="contain"/>
      <ActivityIndicator size="small" color="#0A1133" style={s.spinner}/>
    </View>;
  }
  return <View style={{flex:1,backgroundColor:b.backgroundColor||'#0A1133'}}>
    <StatusBar style="light"/>
    <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:b.backgroundColor||'#0A1133'},animation:'fade_from_bottom',gestureEnabled:true}}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="login"/>
      <Stack.Screen name="signup"/>
      <Stack.Screen name="assessment"/>
      <Stack.Screen name="recommendation"/>
      <Stack.Screen name="checkout"/>
      <Stack.Screen name="account-create"/>
      <Stack.Screen name="dashboard" options={{gestureEnabled:false}}/>
    </Stack>
  </View>;
}
export default function Root(){return <SafeAreaProvider><BrandingProvider><AppStack/></BrandingProvider></SafeAreaProvider>}
const s=StyleSheet.create({preloader:{flex:1,alignItems:'center',justifyContent:'center'},preloaderIcon:{width:112,height:112,borderRadius:26},spinner:{marginTop:20}});
