"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Users, UserCheck, CalendarDays, Activity } from "lucide-react";
import { getSupabaseClient } from "../../supabase-client";
export type AccountStats = { registered:number; signed_in:number; last_7_days:number; last_30_days:number; updated_at:string };
export function validAccountStats(value:unknown): value is AccountStats {
 if (!value || typeof value !== "object") return false;
 const v=value as Record<string,unknown>;
 return ["registered","signed_in","last_7_days","last_30_days"].every(k=>Number.isSafeInteger(v[k])&&Number(v[k])>=0) && typeof v.updated_at==="string" && Number.isFinite(Date.parse(v.updated_at)) && Number(v.last_7_days)<=Number(v.last_30_days) && Number(v.last_30_days)<=Number(v.signed_in) && Number(v.signed_in)<=Number(v.registered);
}
export function AccountStatisticsView({data,error,language,refresh}:{data:AccountStats|null;error:boolean;language:"en"|"id";refresh:()=>void}) {
 const id=language==="id",t=(en:string,ind:string)=>id?ind:en;
 const cards=[{key:"registered",label:t("Registered accounts","Akun terdaftar"),icon:Users},{key:"signed_in",label:t("Have signed in","Pernah masuk"),icon:UserCheck},{key:"last_7_days",label:t("Signed in · 7 days","Masuk · 7 hari"),icon:CalendarDays},{key:"last_30_days",label:t("Signed in · 30 days","Masuk · 30 hari"),icon:Activity}] as const;
 return <section className="admin-account-statistics" aria-label={t("Account statistics","Statistik akun")}><div className="section-head"><div><span className="section-label">{t("MYWAY ACCOUNTS","AKUN MYWAY")}</span><h2>{t("Account activity","Aktivitas akun")}</h2><p className="admin-chart-note">{t("Distinct accounts, including owner and test accounts. Recent sign-ins are not an online-user count.","Akun unik, termasuk akun pemilik dan pengujian. Data masuk terbaru bukan jumlah pengguna yang sedang online.")}</p></div><button type="button" className="secondary-button" onClick={refresh}><RefreshCw size={15}/>{t("Refresh","Muat ulang")}</button></div><div className="admin-overview-metrics">{cards.map(({key,label,icon:Icon})=><article className="admin-metric blue" key={key}><span className="admin-metric-icon"><Icon size={20}/></span><span>{label}</span><strong>{data&&!error?data[key]:"…"}</strong></article>)}</div><p className={`admin-account-update ${error?"stale":""}`} role="status">{error?t("Updates unavailable. Retrying automatically. Refresh or sign in again if this continues.","Pembaruan belum tersedia. Mencoba kembali otomatis. Muat ulang atau masuk kembali jika berlanjut."):data?`${t("Updated","Diperbarui")} ${new Date(data.updated_at).toLocaleTimeString(id?"id-ID":"en-GB")} · ${t("Refreshes every 15 seconds while this page is visible","Diperbarui setiap 15 detik saat halaman terlihat")}`:t("Loading account statistics…","Memuat statistik akun…")}</p></section>;
}
export default function AccountStatistics({language}:{language:"en"|"id"}) {
 const [data,setData]=useState<AccountStats|null>(null),[error,setError]=useState(false),[refreshKey,setRefreshKey]=useState(0);
 useEffect(()=>{
  let cancelled=false,busy=false;let controller:AbortController|null=null;
  const load=async()=>{
   if(cancelled||busy||document.visibilityState==="hidden")return;
   busy=true;controller=new AbortController();const timeout=window.setTimeout(()=>controller?.abort(),10000);
   try {const client=await getSupabaseClient();if(cancelled)return;const result=await client.rpc("myway_admin_account_statistics").abortSignal(controller.signal);if(result.error||!validAccountStats(result.data))throw new Error("Unavailable");if(!cancelled){setData(result.data);setError(false);}}
   catch {if(!cancelled){setData(null);setError(true);}}
   finally {window.clearTimeout(timeout);busy=false;}
  };
  void load();const interval=window.setInterval(()=>{void load();},15000);const resume=()=>{void load();};window.addEventListener("focus",resume);document.addEventListener("visibilitychange",resume);
  return ()=>{cancelled=true;controller?.abort();window.clearInterval(interval);window.removeEventListener("focus",resume);document.removeEventListener("visibilitychange",resume);};
 },[refreshKey]);
 return <AccountStatisticsView data={data} error={error} language={language} refresh={()=>setRefreshKey(k=>k+1)}/>;
}
