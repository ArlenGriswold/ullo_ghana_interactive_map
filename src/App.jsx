import { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY_HERE";

const C = {
  blue: "#0065b2", blueLight: "#abcae9", blueDark: "#004A85", lime: "#cedc00",
  brown: "#3d3935", orange: "#b36924", gold: "#D4A843", goldLight: "#E8C876",
  goldDim: "rgba(212,168,67,0.6)", bg: "#0D1117", bgCard: "rgba(13,17,23,0.96)",
  bgPanel: "rgba(0,101,178,0.06)", surface: "rgba(255,255,255,0.04)",
  border: "rgba(0,101,178,0.2)", borderSubtle: "rgba(255,255,255,0.06)",
  text: "#ECEFF4", textMuted: "rgba(171,202,233,0.7)", textDim: "rgba(171,202,233,0.4)",
};

const LOCATIONS = [
  { id:1, name:"Ullo Village Center", description:"The heart of the Ullo community, where daily life unfolds beneath ancient baobab trees. This central gathering area is where community meetings are held and the chief addresses the people.", lat:10.6910, lng:-2.5658, category:"community", icon:"\u{1F3D8}\u{FE0F}", photoUrl:"" },
  { id:2, name:"Ullo Senior High School", description:"A 30-year-old rural boarding school with capacity for 1,500 students who travel from all over the Upper West Region to attend. The school is the lifeblood of the community.", lat:10.6925, lng:-2.5640, category:"education", icon:"\u{1F3EB}", photoUrl:"" },
  { id:3, name:"Community Borehole", description:"One of eight boreholes serving the community. During the 9-month dry season, women and students spend up to 5-7 hours waiting in line to collect water here.", lat:10.6895, lng:-2.5675, category:"water", icon:"\u{1F4A7}", photoUrl:"" },
  { id:4, name:"Water Distribution Tank", description:"The water distribution system built in partnership with Engineers Without Borders \u2013 Iowa State University, providing the school and community with improved water access.", lat:10.6930, lng:-2.5650, category:"water", icon:"\u{1F6B0}", photoUrl:"" },
  { id:5, name:"Farmlands", description:"Subsistence farms where community members grow millet, sorghum, groundnuts, and other crops during the brief 3-month rainy season. Agriculture is the primary livelihood here.", lat:10.6945, lng:-2.5690, category:"agriculture", icon:"\u{1F33E}", photoUrl:"" },
  { id:6, name:"Community Clinic", description:"The Ullo health center, serving the community with basic medical care. Plans are underway to expand the facility with support from development partners.", lat:10.6880, lng:-2.5630, category:"health", icon:"\u{1F3E5}", photoUrl:"" },
  { id:7, name:"Chief's Palace", description:"Home of the traditional chief who presides over the Ullo community. The chief plays a central role in governance, dispute resolution, and community development decisions.", lat:10.6905, lng:-2.5665, category:"cultural", icon:"\u{1F451}", photoUrl:"" },
  { id:8, name:"Baobab of Bayon", description:"A sacred baobab tree bearing the footprint of Bayon, the great anti-slave warrior. This tree is a powerful symbol of resistance and heritage for the people of Ullo.", lat:10.6920, lng:-2.5645, category:"cultural", icon:"\u{1F333}", photoUrl:"" },
  { id:9, name:"Sabuli Market", description:"The local market area where community members trade goods, produce, and artisan crafts. Market days are vibrant social occasions that bring surrounding villages together.", lat:10.6898, lng:-2.5680, category:"community", icon:"\u{1F6D2}", photoUrl:"" },
  { id:10, name:"Dam / Reservoir", description:"A dam built by community members with their own hands for irrigation purposes \u2014 a testament to the resilience and determination of the Ullo people.", lat:10.6870, lng:-2.5660, category:"water", icon:"\u{1F30A}", photoUrl:"" },
  { id:11, name:"School Dormitories", description:"Student dormitories at Ullo Senior High. For the first time, students were able to use water at their dormitories when the new distribution system came online in January 2019.", lat:10.6928, lng:-2.5632, category:"education", icon:"\u{1F6CF}\u{FE0F}", photoUrl:"" },
  { id:12, name:"Kitchen & Stoves", description:"Improved kitchen stoves implemented by EWB-ISU, designed to be more fuel-efficient and produce less smoke, improving health outcomes for those who cook here daily.", lat:10.6922, lng:-2.5638, category:"community", icon:"\u{1F525}", photoUrl:"" },
  { id:13, name:"Mosque", description:"The community mosque, one of several places of worship in Ullo. The community includes Muslims, Christians, and those practicing traditional religion, all coexisting peacefully.", lat:10.6902, lng:-2.5655, category:"cultural", icon:"\u{1F54C}", photoUrl:"" },
  { id:14, name:"Road to Jirapa", description:"The main road connecting Ullo to Jirapa, the municipal capital. This route is how students, traders, and visitors reach the community.", lat:10.6950, lng:-2.5610, category:"infrastructure", icon:"\u{1F6E4}\u{FE0F}", photoUrl:"" },
  { id:15, name:"Village Savings Group", description:"Meeting point for the Village Savings & Loan Association (VSLA), where community members pool savings and provide micro-loans to support farming and small businesses.", lat:10.6888, lng:-2.5685, category:"community", icon:"\u{1F4B0}", photoUrl:"" },
  { id:16, name:"Sunset Overlook", description:"A vantage point offering panoramic views of the savannah landscape. The flat terrain stretches endlessly, dotted with baobabs and shea trees under vast golden skies.", lat:10.6955, lng:-2.5625, category:"landscape", icon:"\u{1F305}", photoUrl:"" },
];

const CATEGORIES = {
  all: { label:"All", color:C.gold }, community: { label:"Community", color:C.orange },
  education: { label:"Education", color:C.blue }, water: { label:"Water", color:C.blueLight },
  agriculture: { label:"Agriculture", color:C.lime }, health: { label:"Health", color:"#E05252" },
  cultural: { label:"Heritage", color:C.goldLight }, infrastructure: { label:"Infrastructure", color:"#8B8B8B" },
  landscape: { label:"Landscape", color:C.lime },
};

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
    return (<div style={{ width:"100%", height:320, borderRadius:8, overflow:"hidden", border:"1px solid "+C.border, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", backgroundImage:"radial-gradient(circle at 30% 40%, "+C.blue+"15 0%, transparent 60%)" }}>
      <div style={{ fontSize:48, opacity:0.3, marginBottom:12 }}>{"\u{1F4F7}"}</div>
      <div style={{ color:C.textDim, fontSize:13, fontFamily:"Roboto,sans-serif" }}>360° photo not yet added</div>
      <div style={{ color:C.textDim, fontSize:11, marginTop:6, fontFamily:"monospace", opacity:0.5 }}>Update photoUrl in LOCATIONS array</div>
    </div>);
  }
  return (<div style={{ width:"100%", height:320, borderRadius:8, overflow:"hidden", border:"1px solid "+C.border, background:"#000" }}><div ref={ref} style={{ width:"100%", height:"100%" }} /></div>);
}

export default function UlloExplorer() {
  var [apiKey, setApiKey] = useState(GOOGLE_API_KEY !== "YOUR_GOOGLE_API_KEY_HERE" ? GOOGLE_API_KEY : "");
  var [keyInput, setKeyInput] = useState("");
  var [mapReady, setMapReady] = useState(false);
  var [mapLoading, setMapLoading] = useState(true);
  var [activeLocation, setActiveLocation] = useState(null);
  var [activeCategory, setActiveCategory] = useState("all");
  var [showWelcome, setShowWelcome] = useState(true);
  var mapContainerRef = useRef(null);
  var map3dRef = useRef(null);
  var initRef = useRef(false);
  var filtered = activeCategory === "all" ? LOCATIONS : LOCATIONS.filter(function(l) { return l.category === activeCategory; });

  var flyToLocation = useCallback(function(loc) {
    if (!map3dRef.current) return;
    map3dRef.current.flyCameraTo({ endCamera: { center: { lat:loc.lat, lng:loc.lng, altitude:0 }, range:400, tilt:65, heading:Math.random()*60-30 }, durationMillis:1500 });
  }, []);

  var selectLocation = useCallback(function(loc) { setActiveLocation(loc); flyToLocation(loc); }, [flyToLocation]);

  var addMarkers = useCallback(function(map3d) {
    if (!map3d || !window.google) return;
    map3d.querySelectorAll(".ewb-marker-3d").forEach(function(el) { el.remove(); });
    var locs = activeCategory === "all" ? LOCATIONS : LOCATIONS.filter(function(l) { return l.category === activeCategory; });
    locs.forEach(function(loc) {
      var cat = CATEGORIES[loc.category] || CATEGORIES.all;
      var marker = document.createElement("gmp-marker-3d");
      marker.className = "ewb-marker-3d";
      marker.setAttribute("position", loc.lat + "," + loc.lng);
      marker.setAttribute("altitude-mode", "clamp-to-ground");
      marker.setAttribute("extruded", "");
      var tpl = document.createElement("template");
      tpl.setAttribute("id", "tpl-" + loc.id);
      var div = document.createElement("div");
      div.style.cssText = "cursor:pointer;display:flex;flex-direction:column;align-items:center;";
      div.innerHTML = '<div style="background:'+cat.color+';color:#fff;padding:6px 12px;border-radius:20px;font-size:12px;font-family:Roboto,sans-serif;font-weight:600;white-space:nowrap;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 12px '+cat.color+'66;display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">'+loc.icon+'</span><span>'+loc.name+'</span></div><div style="width:2px;height:16px;background:rgba(255,255,255,0.5);"></div><div style="width:8px;height:4px;border-radius:50%;background:rgba(255,255,255,0.3);"></div>';
      div.addEventListener("click", function(e) { e.stopPropagation(); selectLocation(loc); });
      tpl.content.appendChild(div);
      marker.appendChild(tpl);
      map3d.appendChild(marker);
    });
  }, [activeCategory, selectLocation]);

  var initMap = useCallback(async function(key) {
    if (!mapContainerRef.current || initRef.current) return;
    initRef.current = true;
    if (!window.google || !window.google.maps) {
      await new Promise(function(resolve) {
        var script = document.createElement("script"); script.src = "https://maps.googleapis.com/maps/api/js?key="+key+"&v=alpha&libraries=maps3d"; script.async = true; script.onload = resolve; document.head.appendChild(script);
      });
    }
    var libs = await google.maps.importLibrary("maps3d");
    var map3d = new libs.Map3DElement({ center: { lat:10.6910, lng:-2.5658, altitude:0 }, range:1500, tilt:55, heading:0, mode:"SATELLITE" });
    map3d.style.width = "100%"; map3d.style.height = "100%";
    mapContainerRef.current.appendChild(map3d);
    map3dRef.current = map3d;
    await customElements.whenDefined("gmp-map-3d");
    setMapLoading(false); setMapReady(true);
    setTimeout(function() { addMarkers(map3d); }, 2000);
  }, [addMarkers]);

  useEffect(function() { if (apiKey && !initRef.current) initMap(apiKey); }, [apiKey, initMap]);
  useEffect(function() { if (map3dRef.current && mapReady) addMarkers(map3dRef.current); }, [activeCategory, mapReady, addMarkers]);

  var navLocation = function(dir) {
    if (!activeLocation) return;
    var idx = filtered.findIndex(function(l) { return l.id === activeLocation.id; });
    var next = dir === "next" ? (idx+1) % filtered.length : (idx-1+filtered.length) % filtered.length;
    selectLocation(filtered[next]);
  };
  var activeCat = activeLocation ? (CATEGORIES[activeLocation.category] || CATEGORIES.all) : null;

  if (!apiKey) {
    return (
      <div style={{ width:"100vw", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, fontFamily:"Roboto,sans-serif", padding:24 }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700&display=swap');* { margin:0;padding:0;box-sizing:border-box; }"}</style>
        <div style={{ maxWidth:480, width:"100%", padding:"48px 36px", textAlign:"center", background:C.surface, border:"1px solid "+C.border, borderRadius:12, backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"12 0%, transparent 60%)" }}>
          <h1 style={{ fontFamily:"Roboto Slab,serif", fontSize:32, color:C.text, marginTop:8, fontWeight:700 }}>Explore <span style={{ color:C.gold }}>Ullo</span></h1>
          <p style={{ color:C.blue, fontSize:12, letterSpacing:3, textTransform:"uppercase", fontWeight:500, marginTop:4 }}>Engineers Without Borders {"\u2014"} ISU</p>
          <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.7, margin:"20px 0 28px" }}>Enter your Google Maps API key to load the 3D satellite map of Ullo, Ghana.</p>
          <input type="text" placeholder="AIzaSy..." value={keyInput} onChange={function(e) { setKeyInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter" && keyInput.startsWith("AIza")) setApiKey(keyInput); }}
            style={{ width:"100%", padding:"14px 16px", background:"rgba(0,0,0,0.4)", border:"1px solid "+C.border, borderRadius:6, color:C.text, fontSize:14, fontFamily:"monospace", outline:"none" }} />
          <button onClick={function() { if (keyInput.startsWith("AIza")) setApiKey(keyInput); }}
            style={{ width:"100%", marginTop:12, padding:"14px 24px", background:keyInput.startsWith("AIza") ? C.blue : C.blue+"44", color:"#fff", border:"none", borderRadius:6, fontSize:13, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:keyInput.startsWith("AIza") ? "pointer" : "not-allowed", fontFamily:"Roboto,sans-serif", transition:"all 0.3s" }}>
            Launch Explorer {"\u2192"}</button>
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", marginTop:16, color:C.goldDim, fontSize:12, textDecoration:"none" }}>Get an API key at console.cloud.google.com {"\u2192"}</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width:"100vw", height:"100vh", position:"relative", overflow:"hidden", fontFamily:"Roboto,sans-serif", background:C.bg }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700&display=swap');* { margin:0;padding:0;box-sizing:border-box; }@keyframes spin { to { transform:rotate(360deg); } }@keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 "+C.blue+"44; } 50% { box-shadow:0 0 0 10px "+C.blue+"00; } }"}</style>
      <div ref={mapContainerRef} style={{ position:"absolute", inset:0, zIndex:1 }} />
      {mapLoading && (<div style={{ position:"absolute", inset:0, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.bg }}>
        <div style={{ width:48, height:48, border:"2px solid "+C.blue+"22", borderTopColor:C.blue, borderRadius:"50%", animation:"spin 1s linear infinite" }} />
        <p style={{ marginTop:20, color:C.blue, fontSize:12, letterSpacing:3, textTransform:"uppercase" }}>Loading Ullo</p></div>)}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:100, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", pointerEvents:"none", background:"linear-gradient(180deg, rgba(13,17,23,0.7) 0%, transparent 100%)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, pointerEvents:"auto" }}><div>
          <p style={{ fontFamily:"Roboto Slab,serif", fontSize:20, fontWeight:700, color:C.text, lineHeight:1 }}>Ullo<span style={{ color:C.gold }}>,</span> Ghana</p>
          <p style={{ fontSize:9, color:C.blue, letterSpacing:2.5, textTransform:"uppercase", fontWeight:500, marginTop:2 }}>EWB{"\u2013"}ISU Community Explorer</p>
        </div></div></div>
      <div style={{ position:"absolute", top:72, left:"50%", transform:"translateX(-50%)", zIndex:100, display:"flex", gap:4, padding:"5px 8px", background:C.bgCard, backdropFilter:"blur(16px)", border:"1px solid "+C.border, borderRadius:32, pointerEvents:"auto", flexWrap:"wrap", justifyContent:"center" }}>
        {Object.entries(CATEGORIES).map(function([key, cat]) { var active = activeCategory === key; return (
          <button key={key} onClick={function() { setActiveCategory(key); }} style={{ padding:"5px 12px", borderRadius:16, border:"1px solid "+(active ? cat.color : C.borderSubtle), background:active ? cat.color+"20" : "transparent", color:active ? cat.color : C.textDim, fontSize:10, fontWeight:600, fontFamily:"Roboto,sans-serif", letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer", transition:"all 0.25s", whiteSpace:"nowrap" }}>{cat.label}</button>
        ); })}
      </div>
      {mapReady && showWelcome && !activeLocation && (<div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:150, textAlign:"center", padding:"36px 40px", maxWidth:420, background:C.bgCard, backdropFilter:"blur(20px)", border:"1px solid "+C.border, borderRadius:12, backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"10 0%, transparent 60%)" }}>
        <h3 style={{ fontFamily:"Roboto Slab,serif", fontSize:22, color:C.text, margin:"0 0 10px" }}>Welcome to <span style={{ color:C.gold }}>Ullo</span></h3>
        <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.7 }}>Explore the community through Google Earth 3D satellite imagery. Click and drag to pan, scroll to zoom, right-click drag to tilt and rotate. Tap any marker to view a location with its 360{"\u00B0"} photo.</p>
        <button onClick={function() { setShowWelcome(false); }} style={{ marginTop:20, padding:"10px 28px", background:C.blue, border:"none", borderRadius:6, color:"#fff", fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", cursor:"pointer", fontFamily:"Roboto,sans-serif" }}>Start Exploring</button>
      </div>)}
      <div style={{ position:"absolute", bottom:24, left:24, zIndex:100, display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:C.bgCard, backdropFilter:"blur(12px)", border:"1px solid "+C.border, borderRadius:6, pointerEvents:"auto" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.blue, animation:"pulseGlow 2s infinite" }} />
        <span style={{ color:C.textMuted, fontSize:12 }}><span style={{ color:C.gold, fontWeight:700 }}>{filtered.length}</span> locations{activeCategory !== "all" && <span style={{ color:C.textDim }}> {"\u00B7"} {CATEGORIES[activeCategory].label}</span>}</span>
      </div>
      <div style={{ position:"absolute", bottom:24, right:24, zIndex:100, pointerEvents:"auto" }}>
        <button onClick={function() { if (map3dRef.current) map3dRef.current.flyCameraTo({ endCamera:{ center:{ lat:10.6910, lng:-2.5658, altitude:0 }, range:1500, tilt:55, heading:0 }, durationMillis:1500 }); }}
          style={{ padding:"8px 14px", borderRadius:6, background:C.bgCard, border:"1px solid "+C.border, color:C.blueLight, fontSize:11, fontWeight:600, fontFamily:"Roboto,sans-serif", letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer" }}>{"\u{1F3E0}"} Reset View</button>
      </div>
      <div onClick={function() { setActiveLocation(null); }} style={{ position:"absolute", inset:0, zIndex:500, background:activeLocation ? "rgba(0,0,0,0.35)" : "transparent", pointerEvents:activeLocation ? "auto" : "none", transition:"background 0.4s" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:501, maxHeight:"82vh", background:C.bgCard, backdropFilter:"blur(24px)", borderTop:"2px solid "+C.blue+"55", borderRadius:"16px 16px 0 0", transform:activeLocation ? "translateY(0)" : "translateY(100%)", transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1)", overflow:"hidden", display:"flex", flexDirection:"column", backgroundImage:"radial-gradient(ellipse at 50% 0%, "+C.blue+"08 0%, transparent 40%)" }}>
        {activeLocation && (<>
          <div style={{ width:40, height:4, borderRadius:2, background:C.borderSubtle, margin:"10px auto 0", flexShrink:0 }} />
          <div style={{ padding:"14px 24px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
            <div>
              <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:4, border:"1px solid "+activeCat.color+"33", background:activeCat.color+"12", color:activeCat.color, fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{activeLocation.icon} {activeCat.label}</span>
              <h2 style={{ fontFamily:"Roboto Slab,serif", fontSize:26, fontWeight:700, color:C.text, margin:0, lineHeight:1.2 }}>{activeLocation.name}</h2>
            </div>
            <button onClick={function() { setActiveLocation(null); }} style={{ width:36, height:36, borderRadius:"50%", border:"1px solid "+C.borderSubtle, background:C.surface, color:C.text, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginLeft:12 }}>{"\u2715"}</button>
          </div>
          <div style={{ padding:"0 24px 24px", overflowY:"auto", flex:1 }}>
            <p style={{ color:C.textDim, fontSize:11, fontFamily:"monospace", marginBottom:16 }}>{"\u{1F4CD}"} {activeLocation.lat.toFixed(4)}{"\u00B0"}N, {Math.abs(activeLocation.lng).toFixed(4)}{"\u00B0"}W {"\u00B7"} Jirapa District, Upper West Region</p>
            <PanoViewer photoUrl={activeLocation.photoUrl} locationName={activeLocation.name} />
            <p style={{ color:C.textMuted, fontSize:15, lineHeight:1.8, marginTop:16 }}>{activeLocation.description}</p>
          </div>
          <div style={{ display:"flex", gap:8, padding:"12px 24px 16px", borderTop:"1px solid "+C.borderSubtle, flexShrink:0 }}>
            <button onClick={function() { navLocation("prev"); }} style={{ flex:1, padding:"10px 16px", borderRadius:6, border:"1px solid "+C.border, background:C.bgPanel, color:C.blueLight, fontSize:12, fontWeight:600, fontFamily:"Roboto,sans-serif", cursor:"pointer" }}>{"\u2190"} Previous</button>
            <button onClick={function() { navLocation("next"); }} style={{ flex:1, padding:"10px 16px", borderRadius:6, border:"1px solid "+C.border, background:C.bgPanel, color:C.blueLight, fontSize:12, fontWeight:600, fontFamily:"Roboto,sans-serif", cursor:"pointer" }}>Next {"\u2192"}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
