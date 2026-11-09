"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../supabase-client";

const ADMIN_ORIGIN = process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? "";

export default function AdminConnection() {
  const [message, setMessage] = useState("Connecting your MyWay administrator account…");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!ADMIN_ORIGIN) throw new Error("The administrator portal origin is not configured.");
        const supabase = await getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Sign in to MyWay first, then try again.");
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.session.user.id).maybeSingle();
        if (profile?.role !== "admin") throw new Error("This account does not have MyWay administrator access.");
        if (!window.opener) throw new Error("Return to the admin page and choose Connect MyWay account again.");
        window.opener.postMessage({ type: "myway-admin-session", accessToken: data.session.access_token, refreshToken: data.session.refresh_token }, ADMIN_ORIGIN);
        if (active) setMessage("Connected. You can close this window.");
        window.setTimeout(() => window.close(), 700);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "The administrator account could not be connected.");
      }
    })();
    return () => { active = false; };
  }, []);

  return <main className="admin-connect-page"><section><span className="admin-connect-mark">M</span><h1>MyWay Admin</h1><p>{message}</p></section></main>;
}
