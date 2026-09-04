import {useEffect} from 'react';
import {router} from 'expo-router';
import {ActivityIndicator,StyleSheet,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Screen,COLORS} from '@/components/ui';
import {useBranding} from '@/context/Branding';
import {currentUser,isAuthenticated} from '@/services/auth';

export default function Index(){
  const b=useBranding();

  useEffect(()=>{
    let live=true;
    (async()=>{
      try{
        if(await isAuthenticated()){
          const user=await currentUser(true);
          if(live&&user.role==='customer'){
            router.replace('/dashboard');
            return;
          }
        }
      }catch{}
      if(live) router.replace('/login');
    })();
    return()=>{live=false};
  },[]);

  return <Screen><SafeAreaView style={s.fill}><View style={s.center}><ActivityIndicator color={b.primaryColor||COLORS.teal}/></View></SafeAreaView></Screen>;
}

const s=StyleSheet.create({
  fill:{flex:1},
  center:{flex:1,alignItems:'center',justifyContent:'center'}
});
