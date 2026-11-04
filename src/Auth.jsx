import { useState } from "react";
import { supabase } from "./supabase";
import { GLOBAL_CSS } from "./theme";



export default function Auth({ onCancel }) {
  var [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [loading, setLoading] = useState(false);
  var [message, setMessage] = useState(null); // { type: "error"|"success", text: "" }

  var handleSubmit = async function() {
    if (!email || (!password && mode !== "forgot")) return;
    setLoading(true);
    setMessage(null);

    if (mode === "login") {
      var { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type:"error", text: error.message });

    } else if (mode === "signup") {
      if (!email.endsWith("@iastate.edu")) {
        setMessage({ type:"error", text:"Only @iastate.edu email addresses are allowed." });
        setLoading(false);
        return;
      }
      var { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMessage({ type:"error", text: error.message });
      else setMessage({ type:"success", text:"Check your email to confirm your account, then sign in." });

    } else if (mode === "forgot") {
      var { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) setMessage({ type:"error", text: error.message });
      else setMessage({ type:"success", text:"Password reset email sent — check your inbox." });
    }

    setLoading(false);
  };

  var title = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";
  var hint = mode === "login" ? "Sign in to edit locations and upload media. You don't need an account to view the map."
    : mode === "signup" ? "Create an account with your @iastate.edu email. Accounts are for EWB-ISU members who edit or upload content."
    : "Enter your email to receive a password reset link.";

  return (
    <div className="px" style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--app)", padding:24,
      backgroundImage:"linear-gradient(rgba(56,62,71,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(56,62,71,.25) 1px, transparent 1px)", backgroundSize:"32px 32px" }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span className="px-glyph" style={{ width:28, height:28, fontSize:12 }}>U</span>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <span className="px-title" style={{ fontSize:13, letterSpacing:1.8 }}>Ullo Explorer</span>
            <span className="px-mono px-dim" style={{ fontSize:10 }}>ENGINEERS WITHOUT BORDERS · ISU</span>
          </div>
          {onCancel && <button className="px-btn out sm" style={{ marginLeft:"auto" }} onClick={onCancel}>← Back to map</button>}
        </div>

        <div className="px-panel">
          <div className="px-bar">
            <span className="px-title">{title}</span>
            <span className="px-tag" style={{ marginLeft:"auto" }}>@IASTATE.EDU</span>
          </div>
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <p className="px-muted" style={{ fontSize:12.5, lineHeight:1.6 }}>{hint}</p>

            <label className="px-label" htmlFor="auth-email">Email</label>
            <input id="auth-email" className="px-input" type="email" placeholder="you@iastate.edu"
              value={email} onChange={function(e) { setEmail(e.target.value); setMessage(null); }}
              onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }} />

            {mode !== "forgot" && (<>
              <label className="px-label" htmlFor="auth-pw">Password</label>
              <input id="auth-pw" className="px-input" type="password" placeholder="••••••••"
                value={password} onChange={function(e) { setPassword(e.target.value); setMessage(null); }}
                onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }} />
            </>)}

            {message && <div className={"px-callout " + (message.type === "error" ? "err" : "ok")}>{message.text}</div>}

            <button className="px-btn pri lg" onClick={handleSubmit} disabled={loading} style={{ marginTop:4 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              {!loading && <span className="i">→</span>}
            </button>
          </div>
          <div style={{ display:"flex", gap:4, padding:"6px 10px", borderTop:"1px solid var(--line)", background:"var(--panel2)" }}>
            {mode === "login" && (<>
              <button className="px-btn min sm" onClick={function() { setMode("signup"); setMessage(null); }}>Create an account</button>
              <button className="px-btn min sm" style={{ marginLeft:"auto" }} onClick={function() { setMode("forgot"); setMessage(null); }}>Forgot password?</button>
            </>)}
            {(mode === "signup" || mode === "forgot") && (
              <button className="px-btn min sm" onClick={function() { setMode("login"); setMessage(null); }}>← Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
