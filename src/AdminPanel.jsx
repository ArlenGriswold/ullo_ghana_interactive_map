import { useState } from "react";
import { supabase } from "./supabase";

const C = {
  blue: "#0065b2", blueLight: "#abcae9", gold: "#D4A843", goldDim: "rgba(212,168,67,0.6)",
  bg: "#0D1117", border: "rgba(0,101,178,0.2)", text: "#ECEFF4",
  textMuted: "rgba(171,202,233,0.7)", textDim: "rgba(171,202,233,0.4)",
  surface: "rgba(255,255,255,0.04)", error: "#E05252",
};

export default function Auth() {
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

  return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:"Roboto,sans-serif", padding:24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Slab:wght@400;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}"}</style>

      <div style={{ maxWidth:420, width:"100%", padding:"48px 40px", textAlign:"center", background:C.surface, border:"1px solid "+C.border, borderRadius:14, backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"14 0%, transparent 60%)" }}>

        {/* Logo / Title */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"Roboto Slab,serif", fontSize:34, color:C.text, fontWeight:700 }}>
            Explore <span style={{ color:C.gold }}>Ullo</span>
          </h1>
          <p style={{ color:C.blue, fontSize:11, letterSpacing:3, textTransform:"uppercase", fontWeight:500, marginTop:6 }}>
            Engineers Without Borders — ISU
          </p>
        </div>

        {/* Mode heading */}
        <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.7, marginBottom:24 }}>
          {mode === "login"  && "Sign in to access the Ullo Community Explorer."}
          {mode === "signup" && "Create an account with your @iastate.edu email."}
          {mode === "forgot" && "Enter your email to receive a password reset link."}
        </p>

        {/* Email input */}
        <input
          type="email" placeholder="you@iastate.edu"
          value={email} onChange={function(e) { setEmail(e.target.value); setMessage(null); }}
          onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }}
          style={{ width:"100%", padding:"12px 14px", background:"rgba(0,0,0,0.35)", border:"1px solid "+C.border, borderRadius:7, color:C.text, fontSize:13, fontFamily:"Roboto,sans-serif", outline:"none", marginBottom:10 }}
        />

        {/* Password input (hidden on forgot) */}
        {mode !== "forgot" && (
          <input
            type="password" placeholder="Password"
            value={password} onChange={function(e) { setPassword(e.target.value); setMessage(null); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }}
            style={{ width:"100%", padding:"12px 14px", background:"rgba(0,0,0,0.35)", border:"1px solid "+C.border, borderRadius:7, color:C.text, fontSize:13, fontFamily:"Roboto,sans-serif", outline:"none", marginBottom:10 }}
          />
        )}

        {/* Message */}
        {message && (
          <div style={{ padding:"10px 14px", borderRadius:7, marginBottom:10, fontSize:12, fontFamily:"Roboto,sans-serif", textAlign:"left", lineHeight:1.5,
            background: message.type === "error" ? "rgba(224,82,82,0.12)" : "rgba(59,168,82,0.12)",
            border: "1px solid " + (message.type === "error" ? "rgba(224,82,82,0.3)" : "rgba(59,168,82,0.3)"),
            color: message.type === "error" ? C.error : "#5DC87A",
          }}>
            {message.text}
          </div>
        )}

        {/* Submit button */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:"13px 20px", borderRadius:7, border:"none", background: loading ? C.blue+"66" : C.blue, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"Roboto,sans-serif", letterSpacing:1, textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer", transition:"background 0.2s", marginBottom:16 }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
        </button>

        {/* Mode switcher links */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {mode === "login" && (
            <>
              <button onClick={function() { setMode("signup"); setMessage(null); }}
                style={{ background:"none", border:"none", color:C.blueLight, fontSize:12, cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>
                Don't have an account? Sign up
              </button>
              <button onClick={function() { setMode("forgot"); setMessage(null); }}
                style={{ background:"none", border:"none", color:C.textDim, fontSize:11, cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>
                Forgot password?
              </button>
            </>
          )}
          {(mode === "signup" || mode === "forgot") && (
            <button onClick={function() { setMode("login"); setMessage(null); }}
              style={{ background:"none", border:"none", color:C.blueLight, fontSize:12, cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>
              ← Back to sign in
            </button>
          )}
        </div>

        <p style={{ marginTop:20, color:"rgba(255,255,255,0.15)", fontSize:11 }}>
          @iastate.edu accounts only
        </p>
      </div>
    </div>
  );
}
