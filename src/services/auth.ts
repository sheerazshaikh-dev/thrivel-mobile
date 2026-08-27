import {apiRequest,setToken,getToken} from './api';import {read,write,remove,KEY} from './storage';import type{User}from'./types';
export async function login(email:string,password:string){const r=await apiRequest<{user:User;token:string}>('/auth/login',{method:'POST',body:JSON.stringify({email,password,remember:true})});await setToken(r.token);await write(KEY.user,r.user);return r.user}
export async function currentUser(force=false){const c=await read<User|null>(KEY.user,null);if(c&&!force&&await getToken())return c;const r=await apiRequest<{user:User}>('/auth/me');await write(KEY.user,r.user);return r.user}
export async function isAuthenticated(){return !!(await getToken())}
export async function logout(){try{await apiRequest('/auth/logout',{method:'POST'})}catch{}await setToken('');await remove(KEY.user)}
export async function registerAfterPayment(password:string,orderToken:string){const r=await apiRequest<{user:User;token:string}>('/auth/register-after-payment',{method:'POST',body:JSON.stringify({password,orderToken})});await setToken(r.token);await write(KEY.user,r.user);return r.user}
export async function changePassword(currentPassword:string,newPassword:string){await apiRequest('/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})})}
