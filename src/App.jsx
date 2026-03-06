import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const C = {
  blue: "#0065b2", blueLight: "#abcae9", blueDark: "#004A85", lime: "#cedc00",
  brown: "#3d3935", orange: "#b36924", gold: "#D4A843", goldLight: "#E8C876",
  goldDim: "rgba(212,168,67,0.6)", bg: "#0D1117", bgCard: "rgba(13,17,23,0.96)",
  bgPanel: "rgba(0,101,178,0.06)", surface: "rgba(255,255,255,0.04)",
  border: "rgba(0,101,178,0.2)", borderSubtle: "rgba(255,255,255,0.06)",
  text: "#ECEFF4", textMuted: "rgba(171,202,233,0.7)", textDim: "rgba(171,202,233,0.4)",
};

// ── Sections & Sub-locations ──
const SECTIONS = {
  water: {
    label: "Water Distribution",
    icon: "💧",
    color: "#3BA8C4",
    subsections: [
      { id:"w1",  name:"Sama Yiri",             photoUrl:"", lat:10.6912, lng:-2.5660 },
      { id:"w2",  name:"Polytank – Kitchen",     photoUrl:"", lat:10.6914, lng:-2.5662 },
      { id:"w3",  name:"Polytank – Girls Dorm",  photoUrl:"", lat:10.6916, lng:-2.5655 },
      { id:"w4",  name:"Polytank – Boys Dorm",   photoUrl:"", lat:10.6918, lng:-2.5650 },
      { id:"w5",  name:"Polytank – Bungalow 1",  photoUrl:"", lat:10.6908, lng:-2.5645 },
      { id:"w6",  name:"Polytank – Bungalow 2",  photoUrl:"", lat:10.6906, lng:-2.5640 },
      { id:"w7",  name:"Main Line",              photoUrl:"", lat:10.6920, lng:-2.5670 },
      { id:"w8",  name:"School Line",            photoUrl:"", lat:10.6922, lng:-2.5675 },
      { id:"w9",  name:"Solar Borehole 2024",    photoUrl:"", lat:10.6900, lng:-2.5680 },
    ],
  },
  boreholes: {
    label: "Boreholes",
    icon: "⛏️",
    color: "#4A90B8",
    subsections: [
      { id:"b1",  name:"Primary School", photoUrl:"", lat:10.6910, lng:-2.5658, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:12.0,  ph:7.10, ec:222, tds:111, total_chlorine:0.5, notes:null }},
      { id:"b2",  name:"Sama Yiri",      photoUrl:"", lat:10.6912, lng:-2.5660, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:10.4,  ph:7.10, ec:234, tds:117, total_chlorine:0,   notes:null }},
      { id:"b3",  name:"Yir-Paala",      photoUrl:"", lat:10.6914, lng:-2.5655, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:10.0,  ph:6.96, ec:224, tds:112, total_chlorine:0,   notes:null }},
      { id:"b4",  name:"Nindor Yiri",    photoUrl:"", lat:10.6916, lng:-2.5650, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:10.9,  ph:6.75, ec:234, tds:117, total_chlorine:0,   notes:null }},
      { id:"b5",  name:"Islamic",        photoUrl:"", lat:10.6908, lng:-2.5645, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:9.6,   ph:6.78, ec:216, tds:108, total_chlorine:0,   notes:null }},
      { id:"b6",  name:"Chief",          photoUrl:"", lat:10.6906, lng:-2.5640, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:14.1,  ph:7.11, ec:574, tds:297, total_chlorine:1.0, notes:null }},
      { id:"b7",  name:"Mambo",          photoUrl:"", lat:10.6920, lng:-2.5670, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:12.0,  ph:7.25, ec:544, tds:272, total_chlorine:0,   notes:null }},
      { id:"b8",  name:"Old Mambo",      photoUrl:"", lat:10.6922, lng:-2.5675, data:{ operational:"No",  design:"Open Borehole", pump_type:"N/A", flow_wet:null, ph:null, ec:null, tds:null, total_chlorine:null, notes:"Previously mechanized. No pump currently installed." }},
      { id:"b9",  name:"Market",         photoUrl:"", lat:10.6900, lng:-2.5680, data:{ operational:"Yes", design:"Pump", pump_type:"Mechanized", flow_wet:null,  ph:7.32, ec:212, tds:104, total_chlorine:0,   notes:"Mechanized to polytank. 3 taps, 1 tapstand." }},
      { id:"b10", name:"Gate",           photoUrl:"", lat:10.6930, lng:-2.5660, data:{ operational:"Yes", design:"Pump", pump_type:"Mechanized", flow_wet:null,  ph:null, ec:null, tds:null, total_chlorine:null, notes:"Mechanized to kitchen polytank." }},
      { id:"b11", name:"Gate 2",         photoUrl:"", lat:10.6932, lng:-2.5658, data:{ operational:"No",  design:"Open Borehole", pump_type:"N/A", flow_wet:null, ph:null, ec:null, tds:null, total_chlorine:null, notes:"Handpump removed when Gate BH was drilled and mechanized." }},
      { id:"b12", name:"Wall",           photoUrl:"", lat:10.6925, lng:-2.5665, data:{ operational:"Yes", design:"Pump", pump_type:"Mechanized", flow_wet:null,  ph:null, ec:null, tds:null, total_chlorine:null, notes:"Mechanized to polytank by Asst. Headmaster's bungalow." }},
      { id:"b13", name:"Wall 2",         photoUrl:"", lat:10.6927, lng:-2.5662, data:{ operational:"Yes", design:"Pump", pump_type:"Mechanized", flow_wet:null,  ph:null, ec:null, tds:null, total_chlorine:null, notes:"Mechanized to polytank by Asst. Headmaster's bungalow." }},
      { id:"b14", name:"Form",           photoUrl:"", lat:10.6918, lng:-2.5648, data:{ operational:"No",  design:"Pump", pump_type:"Hand Pivot", flow_wet:null,  ph:null, ec:null, tds:null, total_chlorine:null, notes:null }},
      { id:"b15", name:"Girls Dorm",     photoUrl:"", lat:10.6904, lng:-2.5643, data:{ operational:"No",  design:"Pump", pump_type:"Hand Pivot", flow_wet:null,  ph:null, ec:null, tds:null, total_chlorine:null, notes:null }},
      { id:"b16", name:"KG (Gozu)",      photoUrl:"", lat:10.6902, lng:-2.5638, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:18.5,  ph:6.93, ec:154, tds:77,  total_chlorine:4.0, notes:null }},
      { id:"b17", name:"Gozu",           photoUrl:"", lat:10.6898, lng:-2.5635, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:14.1,  ph:7.13, ec:206, tds:103, total_chlorine:0,   notes:null }},
      { id:"b18", name:"Vision",         photoUrl:"", lat:10.6896, lng:-2.5632, data:{ operational:"Yes", design:"Pump", pump_type:"Hand Pivot", flow_wet:10.4,  ph:7.60, ec:180, tds:90,  total_chlorine:0,   notes:null }},
    ],
  },
  dorms: {
    label: "Dorms",
    icon: "🏠",
    color: "#cedc00",
    subsections: [
      { id:"d1", name:"Girls Dorm", photoUrl:"", lat:10.6928, lng:-2.5632 },
      { id:"d2", name:"Boys Dorm",  photoUrl:"", lat:10.6926, lng:-2.5634 },
    ],
  },
  latrines: {
    label: "Latrines",
    icon: "🚻",
    color: "#b36924",
    subsections: [
      { id:"l1", name:"2023 Latrine (South Campus)", photoUrl:"", lat:10.6910, lng:-2.5658 },
      { id:"l2", name:"Girls Latrine",               photoUrl:"", lat:10.6912, lng:-2.5660 },
      { id:"l3", name:"Boys Latrine 1",              photoUrl:"", lat:10.6914, lng:-2.5655 },
      { id:"l4", name:"Boys Latrine 2",              photoUrl:"", lat:10.6916, lng:-2.5650 },
    ],
  },
  polyclinic: {
    label: "PolyClinic",
    icon: "🏥",
    color: "#E05252",
    subsections: [
      { id:"p1", name:"PolyClinic", photoUrl:"", lat:10.6880, lng:-2.5630 },
    ],
  },
  clinic: {
    label: "Clinic",
    icon: "⚕️",
    color: "#E8913A",
    subsections: [
      { id:"c1", name:"Clinic", photoUrl:"", lat:10.6882, lng:-2.5628 },
    ],
  },
};

// Flat list for map markers
const ALL_LOCATIONS = Object.entries(SECTIONS).flatMap(function([sectionKey, sec]) {
  return sec.subsections.map(function(sub) {
    return { ...sub, sectionKey, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label };
  });
});

// ── Pannellum 360° Viewer ──
function PanoViewer({ photoUrl, locationName }) {
  var ref = useRef(null);
  var viewerRef = useRef(null);
  useEffect(function() {
    if (!photoUrl || !ref.current) return;
    var load = async function() {
      if (!document.getElementById("pann-css")) { var l = document.createElement("link"); l.id = "pann-css"; l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"; document.head.appendChild(l); }
      if (!window.pannellum) { await new Promise(function(r) { var s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"; s.onload = r; document.head.appendChild(s); }); }
      if (viewerRef.current) viewerRef.current.destroy();
      viewerRef.current = window.pannellum.viewer(ref.current, { type:"equirectangular", panorama:photoUrl, autoLoad:true, autoRotate:-2, compass:true, showZoomCtrl:true, showFullscreenCtrl:true, hfov:110, title:locationName });
    };
    load();
    return function() { if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; } };
  }, [photoUrl, locationName]);

  if (!photoUrl) {
    return (
      <div style={{ width:"100%", height:240, borderRadius:8, overflow:"hidden", border:"1px solid "+C.border, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", backgroundImage:"radial-gradient(circle at 30% 40%, "+C.blue+"15 0%, transparent 60%)" }}>
        <div style={{ fontSize:36, opacity:0.3, marginBottom:8 }}>📷</div>
        <div style={{ color:C.textDim, fontSize:12, fontFamily:"Roboto,sans-serif" }}>360° photo not yet added</div>
      </div>
    );
  }
  return (<div style={{ width:"100%", height:240, borderRadius:8, overflow:"hidden", border:"1px solid "+C.border, background:"#000" }}><div ref={ref} style={{ width:"100%", height:"100%" }} /></div>);
}

// ── Borehole Data Card ──
function BoreholeDataCard({ data }) {
  if (!data) return null;
  var operational = data.operational === "Yes";
  var hasWaterQuality = data.ph !== null && data.ph !== undefined;

  function StatPill({ label, value, unit, warn }) {
    return (
      <div style={{ background: warn ? "rgba(224,82,82,0.12)" : "rgba(255,255,255,0.04)", border:"1px solid "+(warn ? "rgba(224,82,82,0.3)" : "rgba(255,255,255,0.08)"), borderRadius:8, padding:"8px 10px", flex:"1 1 70px" }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"Roboto,sans-serif", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:15, fontWeight:700, color: warn ? "#E05252" : "#fff", fontFamily:"Roboto,sans-serif", lineHeight:1 }}>
          {value ?? "—"}
          {value !== null && value !== undefined && <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginLeft:2 }}>{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:14 }}>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, fontFamily:"Roboto,sans-serif", letterSpacing:0.5, background: operational ? "rgba(59,168,82,0.18)" : "rgba(224,82,82,0.18)", border:"1px solid "+(operational ? "rgba(59,168,82,0.4)" : "rgba(224,82,82,0.4)"), color: operational ? "#5DC87A" : "#E05252" }}>
          {operational ? "● Operational" : "● Non-operational"}
        </span>
        <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontFamily:"Roboto,sans-serif", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)" }}>
          {data.pump_type}
        </span>
      </div>
      {data.flow_wet !== null && data.flow_wet !== undefined && (
        <div style={{ display:"flex", gap:6 }}>
          <StatPill label="Flow Rate (Wet Season)" value={data.flow_wet} unit="L/min" />
        </div>
      )}
      {hasWaterQuality && (
        <>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"Roboto,sans-serif", textTransform:"uppercase", letterSpacing:1.5, marginTop:2 }}>Water Quality · July 2022</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <StatPill label="pH"  value={data.ph}  unit=""      warn={data.ph < 6.5 || data.ph > 8.5} />
            <StatPill label="TDS" value={data.tds} unit="ppm"   warn={data.tds > 500} />
            <StatPill label="EC"  value={data.ec}  unit="μS/cm" />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <StatPill label="Total Chlorine" value={data.total_chlorine} unit="mg/L" warn={data.total_chlorine > 4} />
          </div>
        </>
      )}
      {data.notes && (
        <div style={{ padding:"8px 10px", borderRadius:8, fontSize:11, lineHeight:1.5, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.45)", fontFamily:"Roboto,sans-serif", fontStyle:"italic" }}>
          {data.notes}
        </div>
      )}
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.18)", fontFamily:"Roboto,sans-serif", textAlign:"right" }}>
        Source: UTA Borehole Investigation, July 2022
      </div>
    </div>
  );
}

// ── Main App ──
export default function UlloExplorer({ session, profile }) {
  var [apiKey, setApiKey] = useState(GOOGLE_API_KEY || "");
  var [keyInput, setKeyInput] = useState("");
  var [mapReady, setMapReady] = useState(false);
  var [mapLoading, setMapLoading] = useState(true);
  var [activeLocation, setActiveLocation] = useState(null);
  var [activeSection, setActiveSection] = useState(null);
  var [showWelcome, setShowWelcome] = useState(true);
  var [showAdmin, setShowAdmin] = useState(false);
  var mapContainerRef = useRef(null);
  var map3dRef = useRef(null);
  var initRef = useRef(false);

  var visibleLocations = activeSection
    ? ALL_LOCATIONS.filter(function(l) { return l.sectionKey === activeSection; })
    : ALL_LOCATIONS;

  var flyToLocation = useCallback(function(loc) {
    if (!map3dRef.current) return;
    map3dRef.current.flyCameraTo({ endCamera:{ center:{ lat:loc.lat, lng:loc.lng, altitude:0 }, range:400, tilt:65, heading:Math.random()*60-30 }, durationMillis:1500 });
  }, []);

  var selectLocation = useCallback(function(loc) { setActiveLocation(loc); flyToLocation(loc); }, [flyToLocation]);

  var addMarkers = useCallback(function(map3d, sectionKey) {
    if (!map3d || !window.google) return;
    map3d.querySelectorAll(".ewb-marker-3d").forEach(function(el) { el.remove(); });
    var locs = sectionKey
      ? ALL_LOCATIONS.filter(function(l) { return l.sectionKey === sectionKey; })
      : ALL_LOCATIONS;
    locs.forEach(function(loc) {
      var marker = document.createElement("gmp-marker-3d");
      marker.className = "ewb-marker-3d";
      marker.setAttribute("position", loc.lat + "," + loc.lng);
      marker.setAttribute("altitude-mode", "clamp-to-ground");
      marker.setAttribute("extruded", "");
      var tpl = document.createElement("template");
      tpl.setAttribute("id", "tpl-" + loc.id);
      var div = document.createElement("div");
      div.style.cssText = "cursor:pointer;display:flex;flex-direction:column;align-items:center;";
      div.innerHTML = '<div style="background:'+loc.sectionColor+';color:#fff;padding:5px 11px;border-radius:20px;font-size:11px;font-family:Roboto,sans-serif;font-weight:600;white-space:nowrap;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 12px '+loc.sectionColor+'66;display:flex;align-items:center;gap:5px;"><span style="font-size:14px;">'+loc.sectionIcon+'</span><span>'+loc.name+'</span></div><div style="width:2px;height:14px;background:rgba(255,255,255,0.5);"></div><div style="width:6px;height:3px;border-radius:50%;background:rgba(255,255,255,0.3);"></div>';
      div.addEventListener("click", function(e) { e.stopPropagation(); selectLocation(loc); });
      tpl.content.appendChild(div);
      marker.appendChild(tpl);
      map3d.appendChild(marker);
    });
  }, [selectLocation]);

  var initMap = useCallback(async function(key) {
    if (!mapContainerRef.current || initRef.current) return;
    initRef.current = true;
    if (!window.google || !window.google.maps) {
      await new Promise(function(resolve) {
        var script = document.createElement("script"); script.src = "https://maps.googleapis.com/maps/api/js?key="+key+"&v=alpha&libraries=maps3d"; script.async = true; script.onload = resolve; document.head.appendChild(script);
      });
    }
    var libs = await google.maps.importLibrary("maps3d");
    var map3d = new libs.Map3DElement({ center:{ lat:10.6910, lng:-2.5658, altitude:0 }, range:1500, tilt:55, heading:0, mode:"SATELLITE" });
    map3d.style.width = "100%"; map3d.style.height = "100%";
    mapContainerRef.current.appendChild(map3d);
    map3dRef.current = map3d;
    await customElements.whenDefined("gmp-map-3d");
    setMapLoading(false); setMapReady(true);
    setTimeout(function() { addMarkers(map3d, null); }, 2000);
  }, [addMarkers]);

  useEffect(function() { if (apiKey && !initRef.current) initMap(apiKey); }, [apiKey, initMap]);
  useEffect(function() { if (map3dRef.current && mapReady) addMarkers(map3dRef.current, activeSection); }, [activeSection, mapReady, addMarkers]);

  var navLocation = function(dir) {
    if (!activeLocation) return;
    var subs = activeSection ? SECTIONS[activeSection].subsections : ALL_LOCATIONS;
    var idx = subs.findIndex(function(l) { return l.id === activeLocation.id; });
    var next = dir === "next" ? (idx+1) % subs.length : (idx-1+subs.length) % subs.length;
    var loc = subs[next];
    var secKey = activeSection || loc.sectionKey;
    var sec = SECTIONS[secKey];
    selectLocation({ ...loc, sectionKey: secKey, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label });
  };

  // ── API Key screen (fallback if .env not set) ──
  if (!apiKey) {
    return (
      <div style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:"Roboto,sans-serif", padding:24 }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700&display=swap');* { margin:0;padding:0;box-sizing:border-box; }"}</style>
        <div style={{ maxWidth:480, width:"100%", padding:"48px 36px", textAlign:"center", background:C.surface, border:"1px solid "+C.border, borderRadius:12, backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"12 0%, transparent 60%)" }}>
          <h1 style={{ fontFamily:"Roboto Slab,serif", fontSize:32, color:C.text, marginTop:8, fontWeight:700 }}>Explore <span style={{ color:C.gold }}>Ullo</span></h1>
          <p style={{ color:C.blue, fontSize:12, letterSpacing:3, textTransform:"uppercase", fontWeight:500, marginTop:4 }}>Engineers Without Borders — ISU</p>
          <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.7, margin:"20px 0 28px" }}>Google Maps API key missing from .env file.</p>
          <input type="text" placeholder="AIzaSy..." value={keyInput} onChange={function(e) { setKeyInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter" && keyInput.startsWith("AIza")) setApiKey(keyInput); }}
            style={{ width:"100%", padding:"14px 16px", background:"rgba(0,0,0,0.4)", border:"1px solid "+C.border, borderRadius:6, color:C.text, fontSize:14, fontFamily:"monospace", outline:"none" }} />
          <button onClick={function() { if (keyInput.startsWith("AIza")) setApiKey(keyInput); }}
            style={{ width:"100%", marginTop:12, padding:"14px 24px", background:keyInput.startsWith("AIza") ? C.blue : C.blue+"44", color:"#fff", border:"none", borderRadius:6, fontSize:13, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:keyInput.startsWith("AIza") ? "pointer" : "not-allowed", fontFamily:"Roboto,sans-serif", transition:"all 0.3s" }}>
            Launch Explorer →
          </button>
        </div>
      </div>
    );
  }

  // ── Main Explorer ──
  return (
    <div style={{ width:"100vw", height:"100vh", position:"relative", overflow:"hidden", fontFamily:"Roboto,sans-serif", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 ${C.blue}44; } 50% { box-shadow:0 0 0 10px ${C.blue}00; } }
        .sidebar-scroll::-webkit-scrollbar { width:4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background:transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
        .loc-btn:hover { background:rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Map */}
      <div ref={mapContainerRef} style={{ position:"absolute", inset:0, zIndex:1 }} />

      {/* Loading */}
      {mapLoading && (
        <div style={{ position:"absolute", inset:0, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.bg }}>
          <div style={{ width:48, height:48, border:"2px solid "+C.blue+"22", borderTopColor:C.blue, borderRadius:"50%", animation:"spin 1s linear infinite" }} />
          <p style={{ marginTop:20, color:C.blue, fontSize:12, letterSpacing:3, textTransform:"uppercase" }}>Loading Ullo</p>
        </div>
      )}

      {/* ── Top Header ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:100, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", pointerEvents:"none", background:"linear-gradient(180deg, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.6) 60%, transparent 100%)" }}>

        {/* Left: Title */}
        <div style={{ display:"flex", alignItems:"center", gap:10, pointerEvents:"auto" }}>
          <div>
            <p style={{ fontFamily:"Roboto Slab,serif", fontSize:20, fontWeight:700, color:C.text, lineHeight:1 }}>Ullo<span style={{ color:C.gold }}>,</span> Ghana</p>
            <p style={{ fontSize:9, color:C.blue, letterSpacing:2.5, textTransform:"uppercase", fontWeight:500, marginTop:2 }}>EWB–ISU Community Explorer</p>
          </div>
        </div>

        {/* Right: User info + admin button + sign out */}
        <div style={{ display:"flex", alignItems:"center", gap:10, pointerEvents:"auto" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:C.blueLight, fontFamily:"Roboto,sans-serif" }}>
              {session?.user?.user_metadata?.full_name || session?.user?.email}
            </div>
            <div style={{ fontSize:9, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700,
              color: profile?.role === "admin" ? C.gold : profile?.role === "member" ? C.lime : C.textDim,
              fontFamily:"Roboto,sans-serif", marginTop:2 }}>
              {profile?.role || "supporter"}
            </div>
          </div>
          {profile?.role === "admin" && (
            <button onClick={function() { setShowAdmin(true); }}
              style={{ padding:"6px 12px", borderRadius:6, background:"rgba(212,168,67,0.12)", border:"1px solid rgba(212,168,67,0.3)", color:C.gold, fontSize:11, cursor:"pointer", fontFamily:"Roboto,sans-serif", fontWeight:600 }}>
              ⚙ Users
            </button>
          )}
          <button onClick={function() { supabase.auth.signOut(); }}
            style={{ padding:"6px 12px", borderRadius:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>
            Sign out
          </button>
        </div>

      </div>{/* ── End Top Header ── */}

      {/* ── Section Filter Bar ── */}
      <div style={{
        position:"absolute", top:62, left:"50%", transform:"translateX(-50%)",
        zIndex:100, display:"flex", gap:3, padding:"5px 6px",
        background:"rgba(10,14,20,0.82)", backdropFilter:"blur(24px) saturate(180%)",
        border:"1px solid rgba(255,255,255,0.08)", borderRadius:12,
        boxShadow:"0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        pointerEvents:"auto", flexWrap:"nowrap", alignItems:"center",
      }}>
        {Object.entries(SECTIONS).map(function([key, sec]) {
          var active = activeSection === key;
          return (
            <button key={key}
              onClick={function() { setActiveSection(active ? null : key); setActiveLocation(null); }}
              style={{
                position:"relative", padding:"7px 13px", borderRadius:8, border:"none",
                background: active ? "linear-gradient(135deg,"+sec.color+"35,"+sec.color+"18)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
                fontSize:11, fontWeight: active ? 700 : 500,
                fontFamily:"Roboto,sans-serif", letterSpacing:0.5,
                textTransform:"uppercase", cursor:"pointer",
                transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", whiteSpace:"nowrap",
                boxShadow: active ? "0 0 0 1px "+sec.color+"55" : "none",
                outline:"none",
              }}>
              <span style={{ marginRight:5 }}>{sec.icon}</span>{sec.label}
              {active && (
                <span style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", width:3, height:3, borderRadius:"50%", background:sec.color, boxShadow:"0 0 6px "+sec.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Left Sidebar ── */}
      {activeSection && (
        <div style={{
          position:"absolute", top:110, left:16, bottom:24,
          width:248, zIndex:100, pointerEvents:"auto",
          display:"flex", flexDirection:"column",
          background:"rgba(10,14,20,0.85)", backdropFilter:"blur(20px)",
          border:"1px solid rgba(255,255,255,0.08)", borderRadius:12,
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)", overflow:"hidden",
        }}>
          <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:SECTIONS[activeSection].color, fontFamily:"Roboto,sans-serif", fontWeight:700, marginBottom:3 }}>
                {SECTIONS[activeSection].icon} {SECTIONS[activeSection].label}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"Roboto,sans-serif" }}>
                {SECTIONS[activeSection].subsections.length} locations
              </div>
            </div>
            <button onClick={function() { setActiveSection(null); setActiveLocation(null); }} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, color:"rgba(255,255,255,0.4)", width:26, height:26, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
          </div>
          <div className="sidebar-scroll" style={{ overflowY:"auto", flex:1, padding:"6px 0" }}>
            {SECTIONS[activeSection].subsections.map(function(sub, i) {
              var isActive = activeLocation && activeLocation.id === sub.id;
              var sec = SECTIONS[activeSection];
              return (
                <button key={sub.id} className="loc-btn"
                  onClick={function() { selectLocation({ ...sub, sectionKey:activeSection, sectionColor:sec.color, sectionIcon:sec.icon, sectionLabel:sec.label }); }}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 14px", border:"none", background: isActive ? sec.color+"18" : "transparent", borderLeft: isActive ? "2px solid "+sec.color : "2px solid transparent", cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, background: isActive ? sec.color+"30" : "rgba(255,255,255,0.05)", border:"1px solid "+(isActive ? sec.color+"60" : "rgba(255,255,255,0.1)"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color: isActive ? sec.color : "rgba(255,255,255,0.3)", fontFamily:"Roboto,sans-serif", fontWeight:700 }}>
                    {i+1}
                  </div>
                  <span style={{ fontSize:12, fontFamily:"Roboto,sans-serif", color: isActive ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: isActive ? 600 : 400, lineHeight:1.3 }}>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome overlay */}
      {mapReady && showWelcome && !activeLocation && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:150, textAlign:"center", padding:"36px 40px", maxWidth:420, background:C.bgCard, backdropFilter:"blur(20px)", border:"1px solid "+C.border, borderRadius:12, backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"10 0%, transparent 60%)" }}>
          <h3 style={{ fontFamily:"Roboto Slab,serif", fontSize:22, color:C.text, margin:"0 0 10px" }}>Welcome to <span style={{ color:C.gold }}>Ullo</span></h3>
          <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.7 }}>Explore the community through Google Earth 3D satellite imagery. Click and drag to pan, scroll to zoom, right-click drag to tilt and rotate. Select a category above to filter locations.</p>
          <button onClick={function() { setShowWelcome(false); }} style={{ marginTop:20, padding:"10px 28px", background:C.blue, border:"none", borderRadius:6, color:"#fff", fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>Start Exploring</button>
        </div>
      )}

      {/* Location count */}
      <div style={{ position:"absolute", bottom:24, left: activeSection ? 280 : 24, zIndex:100, display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:C.bgCard, backdropFilter:"blur(12px)", border:"1px solid "+C.border, borderRadius:6, pointerEvents:"auto", transition:"left 0.3s" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.blue, animation:"pulseGlow 2s infinite" }} />
        <span style={{ color:C.textMuted, fontSize:12 }}>
          <span style={{ color:C.gold, fontWeight:700 }}>{visibleLocations.length}</span> locations
          {activeSection && <span style={{ color:C.textDim }}> · {SECTIONS[activeSection].label}</span>}
        </span>
      </div>

      {/* Reset View */}
      <div style={{ position:"absolute", bottom:24, right:24, zIndex:100, pointerEvents:"auto" }}>
        <button onClick={function() { if (map3dRef.current) map3dRef.current.flyCameraTo({ endCamera:{ center:{ lat:10.6910, lng:-2.5658, altitude:0 }, range:1500, tilt:55, heading:0 }, durationMillis:1500 }); }}
          style={{ padding:"8px 14px", borderRadius:6, background:C.bgCard, border:"1px solid "+C.border, color:C.blueLight, fontSize:11, fontWeight:600, fontFamily:"Roboto,sans-serif", letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer" }}>
          🏠 Reset View
        </button>
      </div>

      {/* Backdrop */}
      <div onClick={function() { setActiveLocation(null); }} style={{ position:"absolute", inset:0, zIndex:500, background: activeLocation ? "rgba(0,0,0,0.35)" : "transparent", pointerEvents: activeLocation ? "auto" : "none", transition:"background 0.4s" }} />

      {/* ── Location Detail Panel ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:501,
        maxHeight:"80vh", background:C.bgCard, backdropFilter:"blur(24px)",
        borderTop:"2px solid "+C.blue+"55", borderRadius:"16px 16px 0 0",
        transform: activeLocation ? "translateY(0)" : "translateY(100%)",
        transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1)",
        overflow:"hidden", display:"flex", flexDirection:"column",
        backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"08 0%, transparent 40%)",
      }}>
        {activeLocation && (
          <>
            <div style={{ width:40, height:4, borderRadius:2, background:C.borderSubtle, margin:"10px auto 0", flexShrink:0 }} />
            <div style={{ padding:"12px 20px 8px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
              <div>
                <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:4, border:"1px solid "+(activeLocation.sectionColor||C.blue)+"33", background:(activeLocation.sectionColor||C.blue)+"12", color:(activeLocation.sectionColor||C.blue), fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                  {activeLocation.sectionIcon} {activeLocation.sectionLabel}
                </span>
                <h2 style={{ fontFamily:"Roboto Slab,serif", fontSize:24, fontWeight:700, color:C.text, margin:0, lineHeight:1.2 }}>{activeLocation.name}</h2>
              </div>
              <button onClick={function() { setActiveLocation(null); }} style={{ width:34, height:34, borderRadius:"50%", border:"1px solid "+C.borderSubtle, background:C.surface, color:C.text, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginLeft:12 }}>✕</button>
            </div>
            <div style={{ padding:"0 20px 20px", overflowY:"auto", flex:1 }}>
              <p style={{ color:C.textDim, fontSize:11, fontFamily:"monospace", marginBottom:12 }}>
                📍 {activeLocation.lat.toFixed(4)}°N, {Math.abs(activeLocation.lng).toFixed(4)}°W · Jirapa District, Upper West Region
              </p>
              <PanoViewer photoUrl={activeLocation.photoUrl} locationName={activeLocation.name} />
              {activeLocation.sectionKey === "boreholes" && activeLocation.data && (
                <BoreholeDataCard data={activeLocation.data} />
              )}
            </div>
            <div style={{ display:"flex", gap:8, padding:"10px 20px 14px", borderTop:"1px solid "+C.borderSubtle, flexShrink:0 }}>
              <button onClick={function() { navLocation("prev"); }} style={{ flex:1, padding:"9px 16px", borderRadius:6, border:"1px solid "+C.border, background:C.bgPanel, color:C.blueLight, fontSize:12, fontWeight:600, fontFamily:"Roboto,sans-serif", cursor:"pointer" }}>← Previous</button>
              <button onClick={function() { navLocation("next"); }} style={{ flex:1, padding:"9px 16px", borderRadius:6, border:"1px solid "+C.border, background:C.bgPanel, color:C.blueLight, fontSize:12, fontWeight:600, fontFamily:"Roboto,sans-serif", cursor:"pointer" }}>Next →</button>
            </div>
          </>
        )}
      </div>

      {/* ── Admin Panel ── */}
      {showAdmin && (
        <AdminPanel currentUser={session?.user} onClose={function() { setShowAdmin(false); }} />
      )}

    </div>
  );
}
