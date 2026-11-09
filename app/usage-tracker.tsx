"use client";
import {useEffect} from "react";
import {getSupabaseClient} from "./supabase-client";
export const USAGE_PAGES = ["dashboard","explore","pathway","tasks","progress","profile","settings"] as const;
export function activeSample(seconds:number,visible:boolean,focused:boolean,idleMs:number){return visible&&focused&&idleMs<60000?Math.min(2,Math.max(0,seconds)):0;}
export default function UsageTracker({page,userId}:{page:string;userId:string}){
 useEffect(()=>{
  if(!USAGE_PAGES.includes(page as typeof USAGE_PAGES[number]))return;
  const visit=crypto.randomUUID();let active=0,lastTick=performance.now(),lastInput=Date.now(),busy=false;
  const input=()=>{lastInput=Date.now();};const visibility=()=>{lastTick=performance.now();};
  const send=async(initial=false)=>{if(busy)return;const seconds=Math.min(30,Math.floor(active));if(!initial&&!seconds)return;busy=true;
   try{const client=await getSupabaseClient();const {data}=await client.auth.getSession();if(data.session?.user.id!==userId)return;const {error}=await client.rpc("myway_record_usage",{p_visit:visit,p_page:page,p_seconds:seconds}).abortSignal(AbortSignal.timeout(10000));if(!error)active=Math.max(0,active-seconds);}catch{/* Analytics must never interrupt planning. */}finally{busy=false;}};
  void send(true);
  const tick=window.setInterval(()=>{const now=performance.now();active+=activeSample((now-lastTick)/1000,document.visibilityState==="visible",document.hasFocus(),Date.now()-lastInput);lastTick=now;},1000);
  const flush=window.setInterval(()=>{void send();},30000);
  for(const event of ["pointerdown","keydown","scroll","touchstart"])window.addEventListener(event,input,{passive:true});document.addEventListener("visibilitychange",visibility);
  return()=>{window.clearInterval(tick);window.clearInterval(flush);for(const event of ["pointerdown","keydown","scroll","touchstart"])window.removeEventListener(event,input);document.removeEventListener("visibilitychange",visibility);void send();};
 },[page,userId]);
 return null;
}
