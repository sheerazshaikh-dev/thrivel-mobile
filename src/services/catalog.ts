import {apiRequest} from './api';import type{Answer,Product}from'./types';
export const ANNUAL_DISCOUNT_RATE=.17;export const annualPriceFor=(m:number)=>Math.round(m*12*(1-ANNUAL_DISCOUNT_RATE)*100)/100;
export async function loadProducts(){const r=await apiRequest<{products:Product[]}>('/products');return (r.products||[]).filter(p=>p.active!==false).map(p=>({...p,annualPrice:annualPriceFor(p.price)}))}
export async function matchProducts(answers:Record<string,Answer>){return apiRequest<{matches:{productId:string;score:number;reasons:string[]}[];products:Product[]}>('/recommendations/match',{method:'POST',body:JSON.stringify({answers})})}
