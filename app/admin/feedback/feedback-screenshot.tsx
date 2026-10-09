"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../supabase-client';

export default function FeedbackScreenshot({ id }: { id: string }) {
 const [attempt, setAttempt] = useState(0);
 const [image, setImage] = useState<{url:string;extension:string} | null>(null);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 useEffect(() => {
  if (!attempt) return;
  const controller = new AbortController();
  let objectUrl = '';
  let active = true;
  const load = async () => {
   try {
    setLoading(true);setError('');setImage(null);
    const supabase = await getSupabaseClient();
    const {data,error:sessionError} = await supabase.auth.getSession();
    if (sessionError || !data.session) throw new Error('Sign in again before opening the screenshot.');
    const response = await fetch(`/api/admin/feedback/${encodeURIComponent(id)}/screenshot`, {headers:{Authorization:`Bearer ${data.session.access_token}`},cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10_000)])});
    if (!response.ok) throw new Error(response.status===415 ? 'This attachment is not a supported screenshot.' : response.status===403 ? 'Administrator access is required.' : 'The screenshot could not be loaded. Please try again.');
    const blob = await response.blob();
    const extensions:Record<string,string> = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
    if (!extensions[blob.type] || blob.size>8*1024*1024) throw new Error('This attachment is not a supported screenshot.');
    if (!active) return;
    objectUrl=URL.createObjectURL(blob);setImage({url:objectUrl,extension:extensions[blob.type]});
   } catch (cause) {if(active)setError(cause instanceof Error?cause.message:'The screenshot could not be loaded. Please try again.');}
   finally {if(active)setLoading(false);}
  };
  void load();
  return () => {active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[id,attempt]);
 return <div className="admin-screenshot-viewer"><span>Screenshot</span>{image ? <><img src={image.url} alt="Screenshot attached to this feedback"/><a href={image.url} download={`feedback-screenshot.${image.extension}`}>Download screenshot</a><button type="button" onClick={()=>{setAttempt(0);setImage(null);setError('');}}>Close screenshot</button></> : <><button type="button" disabled={loading} onClick={()=>setAttempt(value=>value+1)}>{loading?'Loading screenshot…':attempt?'Retry screenshot':'View screenshot'}</button>{error && <p role="alert">{error}</p>}</>}</div>;
}
