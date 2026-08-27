import {apiRequest} from './api';
import {read,write,remove} from './storage';
import type {Answer,BodyProfile} from './types';
const TOKEN_KEY='tiq.bodyProfileToken';
export async function createBodyProfileSession(){const r=await apiRequest<{bodyProfile:BodyProfile}>('/assessment/body-profile/session',{method:'POST',body:JSON.stringify({consent:true})});await write(TOKEN_KEY as any,r.bodyProfile.token as any);return r.bodyProfile}
export async function getBodyProfileToken(){return read<string>(TOKEN_KEY as any,'')}
export async function uploadBodyProfilePhoto(token:string,view:'front'|'side'|'back',asset:{uri:string;mimeType?:string|null;fileName?:string|null}){const form=new FormData();form.append('view',view);form.append('file',{uri:asset.uri,type:asset.mimeType||'image/jpeg',name:asset.fileName||`${view}.jpg`} as any);const r=await apiRequest<{bodyProfile:BodyProfile}>(`/assessment/body-profile/${encodeURIComponent(token)}/upload`,{method:'POST',body:form,timeoutMs:45000});return r.bodyProfile}
export async function analyzeBodyProfile(token:string,answers:Record<string,Answer>){const r=await apiRequest<{bodyProfile:BodyProfile}>(`/assessment/body-profile/${encodeURIComponent(token)}/analyze`,{method:'POST',body:JSON.stringify({answers}),timeoutMs:45000});return r.bodyProfile}
export async function clearBodyProfileToken(){await remove(TOKEN_KEY as any)}
