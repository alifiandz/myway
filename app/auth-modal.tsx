"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, Eye, EyeOff, LockKeyhole, LogOut, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import { useDialogFocus } from "./dialog-focus";
import { getSupabaseClient } from "./supabase-client";

type Mode = "signin" | "signup" | "forgot" | "recovery";

export function AuthModal({ session, recovery, language, close, openProfile }: { session: Session | null; recovery: boolean; language: "en" | "id"; close: () => void; openProfile: () => void }) {
  const dialogRef = useDialogFocus(close);
  const id = language === "id";
  const [mode, setMode] = useState<Mode>(recovery ? "recovery" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => { let current = true; fetch("/api/auth-config", { cache: "no-store", signal: AbortSignal.timeout(10_000) }).then((response) => response.json() as Promise<{ googleEnabled?: boolean }>).then((config: { googleEnabled?: boolean }) => { if (current) setGoogleEnabled(config.googleEnabled === true); }).catch(() => { if (current) setGoogleEnabled(false); }); return () => { current = false; }; }, []);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = await getSupabaseClient();
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setMessage(id ? "Berhasil masuk ke MyWay." : "You are signed in to MyWay.");
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;
        setMessage(data.session ? (id ? "Akunmu siap digunakan." : "Your account is ready.") : (id ? "Periksa emailmu untuk memverifikasi akun." : "Check your email to verify your account."));
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (authError) throw authError;
        setMessage(id ? "Tautan pemulihan telah dikirim jika email tersebut terdaftar." : "A recovery link was sent if that email is registered.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage(id ? "Kata sandi berhasil diperbarui." : "Your password was updated.");
        setMode("signin");
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : (id ? "Terjadi kesalahan. Coba lagi." : "Something went wrong. Try again."));
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true); setError("");
    try {
      const supabase = await getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (authError) throw authError;
    } catch (value) {
      setError(value instanceof Error ? value.message : (id ? "Google tidak dapat dibuka." : "Google sign in could not start."));
      setBusy(false);
    }
  };

  const signOut = async () => { setBusy(true); setError(""); try { const supabase = await getSupabaseClient(); const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) throw signOutError; close(); } catch { setError(id ? "Tidak dapat keluar. Coba lagi." : "Could not sign out. Please try again."); } finally { setBusy(false); } };
  const displayName = session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || session?.user.email?.split("@")[0] || "MyWay user";

  return <div className="modal-backdrop auth-backdrop" data-no-translate onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section ref={dialogRef} tabIndex={-1} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button auth-close" onClick={close} aria-label={id ? "Tutup" : "Close"}><X size={18} /></button>
      <div className="auth-brand"><span><img src="/myway-mark.png" alt="" /></span><strong>MyWay</strong></div>
      {session && mode !== "recovery" ? <div className="auth-account-state">
        <span className="auth-state-icon"><Check size={24} /></span><span className="eyebrow">{id ? "AKUN MYWAY" : "MYWAY ACCOUNT"}</span>
        <h2 id="auth-title">{id ? `Halo, ${displayName}` : `Welcome, ${displayName}`}</h2>
        <p>{session.user.email}</p><div className="auth-secure-note"><ShieldCheck size={17} /><span>{id ? "Sesi aman dan aktif di perangkat ini." : "Your secure session is active on this device."}</span></div>
        <button className="primary-button auth-wide" onClick={() => { openProfile(); close(); }}><UserRound size={16} />{id ? "Buka Profil" : "Open Profile"}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="outline-button auth-wide" disabled={busy} onClick={signOut}><LogOut size={16} />{id ? "Keluar" : "Sign out"}</button>
      </div> : <>
        <header className="auth-heading"><span className="eyebrow">{id ? "AKUN MYWAY" : "MYWAY ACCOUNT"}</span><h2 id="auth-title">{mode === "signup" ? (id ? "Buat akun" : "Create your account") : mode === "forgot" ? (id ? "Pulihkan kata sandi" : "Recover your password") : mode === "recovery" ? (id ? "Buat kata sandi baru" : "Set a new password") : (id ? "Masuk ke MyWay" : "Sign in to MyWay")}</h2><p>{mode === "signup" ? (id ? "Simpan perjalanan universitasmu dengan aman." : "Keep your university journey securely connected to you.") : mode === "forgot" ? (id ? "Kami akan mengirim tautan pemulihan ke emailmu." : "We will send a recovery link to your email.") : mode === "recovery" ? (id ? "Gunakan kata sandi baru yang kuat." : "Choose a strong new password.") : (id ? "Lanjutkan perencanaanmu di perangkat mana pun." : "Continue your planning from any device.")}</p></header>
        {mode !== "forgot" && mode !== "recovery" && <button className="auth-google" disabled={busy || !googleEnabled} onClick={google}><span>G</span>{googleEnabled ? (id ? "Lanjutkan dengan Google" : "Continue with Google") : (id ? "Google sedang disiapkan" : "Google sign in is being set up")}</button>}
        {mode !== "forgot" && mode !== "recovery" && <div className="auth-divider"><span>{id ? "atau gunakan email" : "or use email"}</span></div>}
        <form onSubmit={run}>
          {mode === "signup" && <label><span>{id ? "Nama" : "Name"}</span><div><UserRound size={16} /><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder={id ? "Namamu" : "Your name"} /></div></label>}
          {mode !== "recovery" && <label><span>Email</span><div><Mail size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></div></label>}
          {mode !== "forgot" && <label><span>{id ? "Kata sandi" : "Password"}</span><div><LockKeyhole size={16} /><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={id ? "Minimal 8 karakter" : "At least 8 characters"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? (id ? "Sembunyikan kata sandi" : "Hide password") : (id ? "Tampilkan kata sandi" : "Show password")} aria-pressed={showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
          <button className="primary-button auth-wide" disabled={busy}>{busy ? (id ? "Mohon tunggu" : "Please wait") : mode === "signup" ? (id ? "Buat akun" : "Create account") : mode === "forgot" ? (id ? "Kirim tautan pemulihan" : "Send recovery link") : mode === "recovery" ? (id ? "Perbarui kata sandi" : "Update password") : (id ? "Masuk" : "Sign in")}</button>
        </form>
        <p className="settings-footnote"><a href="/privacy">{id ? "Privasi & bantuan" : "Privacy & support"}</a></p>
        <footer className="auth-footer">{mode === "signin" ? <><button onClick={() => setMode("forgot")}>{id ? "Lupa kata sandi?" : "Forgot password?"}</button><span>{id ? "Belum punya akun?" : "New to MyWay?"} <button onClick={() => setMode("signup")}>{id ? "Daftar" : "Sign up"}</button></span></> : <button onClick={() => setMode("signin")}>{id ? "Kembali untuk masuk" : "Back to sign in"}</button>}</footer>
      </>}
    </section>
  </div>;
}
