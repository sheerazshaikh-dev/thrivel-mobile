import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const configured=(Constants.expoConfig?.extra?.apiBaseUrl||'https://thrivel-iq.brandandbrains.com') as string;
export const API_BASE=configured.replace(/\/$/,'');
const TOKEN='tiq.apiToken';
const DEFAULT_TIMEOUT=20000;

export async function getToken(){return (await SecureStore.getItemAsync(TOKEN))||''}
export async function setToken(v:string){if(v) await SecureStore.setItemAsync(TOKEN,v,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}); else await SecureStore.deleteItemAsync(TOKEN)}
export function absoluteUrl(value?:string){if(!value)return ''; if(/^https?:\/\//i.test(value)) return value; return `${API_BASE}${value.startsWith('/')?'':'/'}${value}`}

export async function apiRequest<T=any>(path:string,options:RequestInit & {timeoutMs?:number}={}){
  const {timeoutMs=DEFAULT_TIMEOUT,...fetchOptions}=options;
  const h=new Headers(fetchOptions.headers||{});
  h.set('Accept','application/json');
  if(fetchOptions.body && !(fetchOptions.body instanceof FormData)&&!h.has('Content-Type'))h.set('Content-Type','application/json');
  const token=await getToken();if(token)h.set('Authorization',`Bearer ${token}`);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  let r:Response;
  try{r=await fetch(`${API_BASE}${path}`,{...fetchOptions,headers:h,signal:controller.signal})}
  catch(e:any){if(e?.name==='AbortError')throw new Error('The request timed out. Check your connection and try again.');throw new Error(`Could not reach the Thrivel ID backend. Check your internet connection.`)}
  finally{clearTimeout(timer)}
  const raw=await r.text();let body:any={};
  try{body=raw?JSON.parse(raw):{}}catch{body={message:`Backend returned an invalid response (${r.status}).`}}
  if(!r.ok){if(r.status===401)await setToken('');throw new Error(body?.message||body?.error||`API request failed (${r.status}).`)}
  return body as T;
}
