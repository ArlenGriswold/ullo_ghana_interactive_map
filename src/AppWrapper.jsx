import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import UlloExplorer from "./App";
import { GLOBAL_CSS } from "./theme";

export default function AppWrapper() {
  var [session, setSession] = useState(null);
  var [profile, setProfile] = useState(null);
  var [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    var { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    console.log("Profile fetch result:", data, error);
    setProfile(data);
    setLoading(false);
  }

  useEffect(function() {
    supabase.auth.getSession().then(function({ data: { session } }) {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(event, session) {
      console.log("Auth event:", event);
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return function() { subscription.unsubscribe(); };
  }, []);

  // Enforce @iastate.edu only
  if (session && session.user.email && !session.user.email.endsWith("@iastate.edu")) {
    supabase.auth.signOut();
    return (
      <div className="px" style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--app)", padding:24 }}>
        <style>{GLOBAL_CSS}</style>
        <div className="px-panel" style={{ maxWidth:400, width:"100%" }}>
          <div className="px-bar"><span className="px-sq" style={{ background:"var(--red)" }} /><span className="px-title">Access denied</span></div>
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            <div className="px-callout err">Access is restricted to @iastate.edu accounts.</div>
            <button className="px-btn" style={{ alignSelf:"flex-start" }} onClick={() => supabase.auth.signOut()}>← Back to sign in</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px" style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:"var(--app)" }}>
        <style>{GLOBAL_CSS}</style>
        <div className="px-spin" />
        <div className="px-label">Authenticating</div>
      </div>
    );
  }

  if (!session) return <Auth />;

  return <UlloExplorer session={session} profile={profile} />;
}
