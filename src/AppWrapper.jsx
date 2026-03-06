import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import UlloExplorer from "./App";

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
      <div style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0D1117", color:"#ECEFF4", fontFamily:"Roboto,sans-serif", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:16 }}>Access restricted to @iastate.edu accounts.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ padding:"8px 20px", background:"#0065b2", border:"none", borderRadius:6, color:"#fff", cursor:"pointer" }}>Back to Sign In</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0D1117" }}>
        <div style={{ width:40, height:40, border:"2px solid #0065b222", borderTopColor:"#0065b2", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  if (!session) return <Auth />;

  return <UlloExplorer session={session} profile={profile} />;
}
