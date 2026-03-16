import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";

// ─── Constants ───────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const WORLD = { lat: 10.6910, lng: -2.5658, altitude: 290 };

const C = {
  blue:"#0065b2", blueLight:"#abcae9", lime:"#cedc00", brown:"#3d3935",
  orange:"#b36924", gold:"#D4A843",
  bg:"#0D1117", bgCard:"rgba(13,17,23,0.96)", bgPanel:"rgba(0,101,178,0.06)",
  surface:"rgba(255,255,255,0.04)", border:"rgba(0,101,178,0.2)",
  borderSubtle:"rgba(255,255,255,0.06)", text:"#ECEFF4",
  textMuted:"rgba(171,202,233,0.7)", textDim:"rgba(171,202,233,0.4)",
};

// ─── Location Data ───────────────────────────────────────────────────────────
const SECTIONS = {
  community:{label:"Community",icon:"🏘️",color:"#D4A843",subsections:[
    {id:"cm1",lodTier:1,name:"Ullo",             photoUrl:"",lat:10.6910,lng:-2.5658,labelScale:3.0,realCoords:true,description:"",tags:[]},
    {id:"cm2",lodTier:2,name:"Elementary School",photoUrl:"",lat:10.6931,lng:-2.5699,labelScale:1.2,realCoords:true,description:"Ullo Elementary School",tags:[]},
    {id:"cm3",lodTier:2,name:"Dante Dam",        photoUrl:"",lat:10.6928,lng:-2.5607,labelScale:1.5,realCoords:true,description:"The Ullo Dante Dam is a completed water infrastructure project developed in partnership with the community of Ullo, Ghana.",tags:["#ullodam","#waterinfrastructure"]},
  ]},
  school:{label:"Senior High School",icon:"🏫",color:"#6B9EE8",subsections:[
    {id:"sh1",lodTier:3, name:"USHS Entrance",            photoUrl:"",lat:10.6910,lng:-2.5657,realCoords:true,description:"Classic Ullo Senior High School sign!",tags:["#ulloseniorhighschool"]},
    {id:"sh2",lodTier:3, name:"Gate Borehole",             photoUrl:"",lat:10.6908,lng:-2.5663,realCoords:true,description:"The gate borehole which is found by the main gate inside the senior high school. This borehole has been electrified since February 2025 and uses grid power.",tags:["#gridpower","#ulloseniorhighschool"]},
    {id:"sh3",lodTier:2, name:"Kitchen",                   photoUrl:"",lat:10.6894,lng:-2.5661,realCoords:true,description:"The Ullo Senior High School kitchen provides students with 3 meals per day.\n\nIowa State EWB ASHRAE team has installed 2 solar water heaters providing on demand hot water.",tags:["#ulloseniorhighschool","#solarpower"]},
    {id:"sh4",lodTier:2, name:"Male Student Dormitory",    photoUrl:"",lat:10.6892,lng:-2.5683,realCoords:true,description:"Male Student dormitory on campus. In summer 2025 the Clinic Electric Team in partnership with ASHRAE installed lighting and ceiling fans.",tags:["#ulloseniorhighschool","#solarpower"]},
    {id:"sh5",lodTier:3, name:"Male Pit Latrines",         photoUrl:"",lat:10.6892,lng:-2.5685,realCoords:true,description:"The winter 2025 Travel Team installed both pit latrines in January 2026. This effort was led by Jenna Hellman and team lead John Beuter.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh6",lodTier:3, name:"Male Dormitory Water Tanks",photoUrl:"",lat:10.6891,lng:-2.5680,realCoords:true,description:"",tags:["#ulloseniorhighschool","#polytank"]},
    {id:"sh7",lodTier:2, name:"School Solar Borehole 2025",photoUrl:"",lat:10.6896,lng:-2.5706,realCoords:true,description:"The winter 2024 Travel Team installed an electrical pump and solar panel. Led by John Beuter and team lead Brian Cacioppo.",tags:["#ulloseniorhighschool","#borehole","#solarpower"]},
    {id:"sh8",lodTier:3, name:"Female Pit Latrine 2023",   photoUrl:"",lat:10.6863,lng:-2.5672,realCoords:true,description:"The winter 2023 Travel Team installed a pit latrine for the female students on campus.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh9",lodTier:3, name:"Female Pit Latrine 2024",   photoUrl:"/pano/female_pit_latrine_2024/IMG_20260101_034848_00_004.jpg",photoUrls:[
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_034848_00_004.jpg",yaw:-65.5,pitch:8.5,hfov:120},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041619_00_008.jpg",yaw:-11.0,pitch:-2.2,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041743_00_009.jpg",yaw:-15.6,pitch:-6.5,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041812_00_010.jpg",yaw:-10.0,pitch:0.8,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041833_00_011.jpg",yaw:-7.9,pitch:-2.0,hfov:110},
    ],lat:10.6883,lng:-2.5667,realCoords:true,description:"The winter 2024 Travel Team installed a pit latrine. Led by Bryan Cacioppo, Kayla Worachek, Arissa Kramer, Sarah Broeker, and community partners Paul and Justin.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh10",lodTier:2,name:"Female Student Dormitory",  photoUrl:"",lat:10.6882,lng:-2.5663,realCoords:true,description:"",tags:["#ulloseniorhighschool"]},
  ]},
  water:{label:"Water Distribution",icon:"💧",color:"#3BA8C4",subsections:[
    {id:"w1",name:"Sama Yiri",             photoUrl:"",lat:10.6912,lng:-2.5660,realCoords:false,description:"",tags:[]},
    {id:"w2",name:"Polytank – Kitchen",   photoUrl:"",lat:10.6914,lng:-2.5662,realCoords:false,description:"",tags:[]},
    {id:"w3",name:"Polytank – Girls Dorm",photoUrl:"",lat:10.6916,lng:-2.5655,realCoords:false,description:"",tags:[]},
    {id:"w4",name:"Polytank – Boys Dorm", photoUrl:"",lat:10.6918,lng:-2.5650,realCoords:false,description:"",tags:[]},
    {id:"w5",name:"Polytank – Bungalow 1",photoUrl:"",lat:10.6908,lng:-2.5645,realCoords:false,description:"",tags:[]},
    {id:"w6",name:"Polytank – Bungalow 2",photoUrl:"",lat:10.6906,lng:-2.5640,realCoords:false,description:"",tags:[]},
    {id:"w7",name:"Main Line",             photoUrl:"",lat:10.6920,lng:-2.5670,realCoords:false,description:"",tags:[]},
    {id:"w8",name:"School Line",           photoUrl:"",lat:10.6922,lng:-2.5675,realCoords:false,description:"",tags:[]},
  ]},
  boreholes:{label:"Boreholes",icon:"⛏️",color:"#4A90B8",subsections:[
    {id:"b1", name:"Primary School",photoUrl:"",lat:10.6910,lng:-2.5658,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:12.0,ph:7.10,ec:222,tds:111,total_chlorine:0.5,notes:null}},
    {id:"b2", name:"Sama Yiri",     photoUrl:"",lat:10.6912,lng:-2.5660,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.4,ph:7.10,ec:234,tds:117,total_chlorine:0,notes:null}},
    {id:"b3", name:"Yir-Paala",    photoUrl:"",lat:10.6914,lng:-2.5655,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.0,ph:6.96,ec:224,tds:112,total_chlorine:0,notes:null}},
    {id:"b4", name:"Nindor Yiri",  photoUrl:"",lat:10.6916,lng:-2.5650,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.9,ph:6.75,ec:234,tds:117,total_chlorine:0,notes:null}},
    {id:"b5", name:"Islamic",      photoUrl:"",lat:10.6908,lng:-2.5645,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:9.6,ph:6.78,ec:216,tds:108,total_chlorine:0,notes:null}},
    {id:"b6", name:"Chief",        photoUrl:"",lat:10.6906,lng:-2.5640,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:14.1,ph:7.11,ec:574,tds:297,total_chlorine:1.0,notes:null}},
    {id:"b7", name:"Mambo",        photoUrl:"",lat:10.6920,lng:-2.5670,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:12.0,ph:7.25,ec:544,tds:272,total_chlorine:0,notes:null}},
    {id:"b8", name:"Old Mambo",    photoUrl:"",lat:10.6922,lng:-2.5675,realCoords:false,description:"",tags:[],data:{operational:"No",pump_type:"N/A",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Previously mechanized. No pump currently installed."}},
    {id:"b9", name:"Market",       photoUrl:"",lat:10.6900,lng:-2.5680,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:7.32,ec:212,tds:104,total_chlorine:0,notes:"Mechanized to polytank. 3 taps, 1 tapstand."}},
    {id:"b10",name:"Gate",         photoUrl:"",lat:10.6908,lng:-2.5663,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to kitchen polytank."}},
    {id:"b11",name:"Gate 2",       photoUrl:"",lat:10.6932,lng:-2.5658,realCoords:false,description:"",tags:[],data:{operational:"No",pump_type:"N/A",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Handpump removed when Gate BH was drilled."}},
    {id:"b12",name:"Wall",         photoUrl:"",lat:10.6925,lng:-2.5665,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to polytank by Asst. Headmaster's bungalow."}},
    {id:"b13",name:"Wall 2",       photoUrl:"",lat:10.6927,lng:-2.5662,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to polytank by Asst. Headmaster's bungalow."}},
    {id:"b14",name:"Form",         photoUrl:"",lat:10.6918,lng:-2.5648,realCoords:false,description:"",tags:[],data:{operational:"No",pump_type:"Hand Pivot",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:null}},
    {id:"b15",name:"Girls Dorm BH",photoUrl:"",lat:10.6904,lng:-2.5643,realCoords:false,description:"",tags:[],data:{operational:"No",pump_type:"Hand Pivot",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:null}},
    {id:"b16",name:"KG (Gozu)",    photoUrl:"",lat:10.6902,lng:-2.5638,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:18.5,ph:6.93,ec:154,tds:77,total_chlorine:4.0,notes:null}},
    {id:"b17",name:"Gozu",         photoUrl:"",lat:10.6898,lng:-2.5635,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:14.1,ph:7.13,ec:206,tds:103,total_chlorine:0,notes:null}},
    {id:"b18",name:"Vision",       photoUrl:"",lat:10.6896,lng:-2.5632,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.4,ph:7.60,ec:180,tds:90,total_chlorine:0,notes:null}},
  ]},
  latrines:{label:"Latrines",icon:"🚹",color:"#b36924",subsections:[
    {id:"l1",name:"2023 Latrine S. Campus",photoUrl:"",lat:10.6863,lng:-2.5672,realCoords:false,description:"",tags:[]},
    {id:"l2",name:"Girls Latrine",          photoUrl:"",lat:10.6883,lng:-2.5667,realCoords:false,description:"",tags:[]},
    {id:"l3",name:"Boys Latrine 1",         photoUrl:"",lat:10.6892,lng:-2.5685,realCoords:false,description:"",tags:[]},
    {id:"l4",name:"Boys Latrine 2",         photoUrl:"",lat:10.6916,lng:-2.5650,realCoords:false,description:"",tags:[]},
  ]},
  clinic:{label:"Clinic",icon:"⚕️",color:"#E8913A",subsections:[
    {id:"c1",lodTier:2,name:"Ullo Clinic Site",photoUrl:"",lat:10.6887,lng:-2.5624,labelScale:1.8,realCoords:true,description:"The Ullo Health Clinic is our largest project to date. Once completed, the clinic will serve approximately 15,000 people in Ullo and the surrounding area. Construction is underway, with walls now completed, and EWB-ISU is actively fundraising to support installation of the roof.",tags:["#clinic"]},
    {id:"c2",lodTier:2,name:"Ullo Clinic",     photoUrl:"",lat:10.6922,lng:-2.5578,realCoords:true,description:"Current clinic serving the community.",tags:["#clinic"]},
  ]},
};

const ALL_LOCATIONS = Object.entries(SECTIONS).flatMap(([sk, sec]) =>
  sec.subsections.map(sub => ({ ...sub, sectionKey: sk, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label }))
);
const LABELED_LOCATIONS = ALL_LOCATIONS.filter(l => l.realCoords);

// ─── Label Image Builder ─────────────────────────────────────────────────────
function buildLabelImg(name, sectionLabel, icon, color, scale) {
  const s = Math.min(scale || 1, 1.4), DPR = 2;
  const mainPx = Math.round(13 * s), subPx = Math.round(8 * s), pad = 7;
  const tmp = document.createElement("canvas").getContext("2d");
  tmp.font = `900 ${mainPx}px "Roboto Slab",Georgia,serif`;
  const mw = tmp.measureText(name.toUpperCase()).width;
  tmp.font = `600 ${subPx}px Roboto,Arial,sans-serif`;
  const sw = tmp.measureText(`${icon} ${sectionLabel}`.toUpperCase()).width;
  const cw = Math.max(mw, sw) + pad * 2, ch = mainPx + pad * 1.4;
  const cv = document.createElement("canvas");
  cv.width = cw * DPR; cv.height = ch * DPR;
  const ctx = cv.getContext("2d");
  ctx.scale(DPR, DPR);
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = `900 ${mainPx}px "Roboto Slab",Georgia,serif`;
  ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.globalAlpha = 0.7;
  ctx.fillStyle = color; ctx.fillText(name.toUpperCase(), cw / 2, pad);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff"; ctx.fillText(name.toUpperCase(), cw / 2, pad);
  const img = document.createElement("img");
  img.src = cv.toDataURL("image/png"); img.width = cw; img.height = ch;
  return img;
}

// ─── Altitude Stagger (prevents label overlap) ──────────────────────────────
function staggerAltitudes(locations) {
  const THRESH = 0.0008, MIN_ALT = 20;
  const alts = new Array(locations.length).fill(MIN_ALT);
  for (let i = 0; i < locations.length; i++) {
    const neighbors = [];
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(locations[i].lat - locations[j].lat, locations[i].lng - locations[j].lng);
      if (d < THRESH) neighbors.push(alts[j]);
    }
    if (neighbors.length) {
      const used = new Set(neighbors);
      let alt = 35;
      while (used.has(alt)) alt += 35;
      alts[i] = alt;
    }
  }
  return alts;
}

// ─── MarkerManager ───────────────────────────────────────────────────────────
// Single class that owns ALL marker lifecycle: create, destroy, LOD, isolate.
class MarkerManager {
  constructor(map3d, locations, MarkerClass, onSelect) {
    this.map3d = map3d;
    this.locations = locations;
    this.MarkerClass = MarkerClass;
    this.onSelect = onSelect;
    this.altitudes = staggerAltitudes(locations);
    this.live = [];           // { el, loc, idx, attached }
    this.sectionFilter = null;
    this.frozen = false;      // true = LOD polling paused (isolation mode)
    this.lastRange = -1;
    this.rafId = null;
    this._build();
    this._startLOD();
  }

  // LOD thresholds per tier
  static LOD = { 1: Infinity, 2: 2800, 3: 1400 };

  // Create one marker element
  _create(loc, idx) {
    const alt = this.altitudes[idx];
    const el = new this.MarkerClass({
      position: { lat: loc.lat, lng: loc.lng, altitude: alt },
      altitudeMode: "RELATIVE_TO_GROUND",
      extruded: true,
    });
    const img = buildLabelImg(loc.name, loc.sectionLabel, loc.sectionIcon, loc.sectionColor, loc.labelScale);
    const tmpl = document.createElement("template");
    tmpl.content.appendChild(img);
    el.appendChild(tmpl);
    el.addEventListener("gmp-click", (e) => { this.onSelect(loc); e.stopPropagation(); });
    return el;
  }

  // Build all markers and attach to map
  _build() {
    this._destroyAll();
    for (let i = 0; i < this.locations.length; i++) {
      const loc = this.locations[i];
      const el = this._create(loc, i);
      this.map3d.appendChild(el);
      this.live.push({ el, loc, idx: i, attached: true });
    }
  }

  // Remove all marker elements from DOM
  _destroyAll() {
    for (const m of this.live) {
      try { m.el.remove(); } catch (_) {}
    }
    this.live = [];
  }

  // Attach or detach a single marker
  _attach(m) {
    if (!m.attached) { this.map3d.appendChild(m.el); m.attached = true; }
  }
  _detach(m) {
    if (m.attached) { try { m.el.remove(); } catch (_) {} m.attached = false; }
  }

  // Apply LOD + section filter visibility
  _applyLOD(range) {
    if (this.frozen) return;
    this.lastRange = range;
    for (const m of this.live) {
      const secOk = !this.sectionFilter || m.loc.sectionKey === this.sectionFilter;
      const tier = m.loc.lodTier ?? 3;
      const vis = secOk && range <= (MarkerManager.LOD[tier] ?? MarkerManager.LOD[3]);
      vis ? this._attach(m) : this._detach(m);
    }
  }

  // rAF loop for LOD
  _startLOD() {
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      if (this.frozen) return;
      const r = this.map3d.range;
      if (typeof r === "number" && r > 0 && Math.abs(r - this.lastRange) > 10) {
        this._applyLOD(r);
      }
    };
    tick();
    this._applyLOD(this.map3d.range || 1500);
  }

  // ── Public API ──

  setSection(key) {
    this.sectionFilter = key || null;
    if (this.frozen) { this.frozen = false; this._build(); }
    this.lastRange = -1;
    this._applyLOD(this.map3d.range || 1500);
  }

  clearSection() { this.setSection(null); }

  // Destroy everything, rebuild only the one with keepId
  isolate(keepId) {
    this.frozen = true;
    this._destroyAll();
    if (keepId) {
      const idx = this.locations.findIndex(l => l.id === keepId);
      if (idx >= 0) {
        const loc = this.locations[idx];
        const el = this._create(loc, idx);
        this.map3d.appendChild(el);
        this.live.push({ el, loc, idx, attached: true });
      }
    }
  }

  // Rebuild everything and resume LOD
  restore() {
    this.frozen = false;
    this._build();
    this.lastRange = -1;
    this._applyLOD(this.map3d.range || 1500);
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._destroyAll();
  }
}

// ─── CameraController ────────────────────────────────────────────────────────
// Single place for all camera movement: fly, orbit, reset, stop.
class CameraController {
  constructor(map3dRef) {
    this.map3dRef = map3dRef;
    this.orbitTimer = null;
  }

  get map3d() { return this.map3dRef.current; }

  stop() {
    if (this.orbitTimer) { clearTimeout(this.orbitTimer); this.orbitTimer = null; }
  }

  flyAndOrbit(loc) {
    if (!this.map3d) return;
    this.stop();
    const heading = Math.random() * 360;
    this.map3d.flyCameraTo({
      endCamera: { center: { lat: loc.lat, lng: loc.lng, altitude: WORLD.altitude }, range: 420, tilt: 60, heading },
      durationMillis: 2500,
    });
    this.orbitTimer = setTimeout(() => {
      if (!this.map3d) return;
      this.map3d.flyCameraAround({
        camera: { center: { lat: loc.lat, lng: loc.lng, altitude: WORLD.altitude }, range: 350, tilt: 60, heading },
        durationMillis: 60000, rounds: 1,
      });
    }, 2700);
  }

  resetView() {
    if (!this.map3d) return;
    this.stop();
    this.map3d.flyCameraTo({
      endCamera: { center: { lat: WORLD.lat, lng: WORLD.lng, altitude: WORLD.altitude }, range: 1500, tilt: 55, heading: 0 },
      durationMillis: 1500,
    });
  }
}

// ─── PanoViewer Component ────────────────────────────────────────────────────
// photoUrls can be strings OR objects: { url, yaw, pitch, hfov }
function PanoViewer({ photoUrl, photoUrls, locationName, tall }) {
  // Normalize: always work with { url, yaw, pitch, hfov } objects
  const photos = (photoUrls?.length > 0 ? photoUrls : photoUrl ? [photoUrl] : []).map(p =>
    typeof p === "string" ? { url: p, yaw: 0, pitch: 0, hfov: 110 } : { yaw: 0, pitch: 0, hfov: 110, ...p }
  );
  const [idx, setIdx] = useState(0);
  const ref = useRef(null), vRef = useRef(null);
  const photo = photos[idx] || null;
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); }, [locationName]);
  useEffect(() => {
    if (!photo || !ref.current) return;
    (async () => {
      if (!document.getElementById("pann-css")) { const l = document.createElement("link"); l.id = "pann-css"; l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"; document.head.appendChild(l); }
      if (!window.pannellum) { await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"; s.onload = r; document.head.appendChild(s); }); }
      if (vRef.current) vRef.current.destroy();
      vRef.current = window.pannellum.viewer(ref.current, {
        type: "equirectangular", panorama: photo.url, autoLoad: true,
        yaw: photo.yaw, pitch: photo.pitch, hfov: photo.hfov,
        compass: true, showZoomCtrl: true, showFullscreenCtrl: true, title: locationName,
      });
    })();
    return () => { if (vRef.current) { vRef.current.destroy(); vRef.current = null; } };
  }, [photo, locationName]);

  if (!photos.length) return (
    <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>📷</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>360° photo not yet added</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border }}>
        <div ref={ref} style={{ width: "100%", height: "100%" }} />
      </div>
      {photos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "Roboto,sans-serif", minWidth: 50, textAlign: "center" }}>{idx + 1} / {photos.length}</span>
          <button onClick={() => setIdx((idx + 1) % photos.length)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
        </div>
      )}
    </div>
  );
}

// ─── BoreholeDataCard Component ──────────────────────────────────────────────
function BoreholeDataCard({ data }) {
  if (!data) return null;
  const op = data.operational === "Yes", hasWQ = data.ph != null;
  const Pill = ({ label, value, unit, warn }) => (
    <div style={{ background: warn ? "rgba(224,82,82,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid " + (warn ? "rgba(224,82,82,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 8, padding: "8px 10px", flex: "1 1 70px" }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "Roboto,sans-serif", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: warn ? "#E05252" : "#fff", fontFamily: "Roboto,sans-serif", lineHeight: 1 }}>{value ?? "—"}{value != null && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>{unit}</span>}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "Roboto,sans-serif", background: op ? "rgba(59,168,82,0.18)" : "rgba(224,82,82,0.18)", border: "1px solid " + (op ? "rgba(59,168,82,0.4)" : "rgba(224,82,82,0.4)"), color: op ? "#5DC87A" : "#E05252" }}>{op ? "● Operational" : "● Non-operational"}</span>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontFamily: "Roboto,sans-serif", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>{data.pump_type}</span>
      </div>
      {data.flow_wet != null && <div style={{ display: "flex", gap: 6 }}><Pill label="Flow Rate (Wet)" value={data.flow_wet} unit="L/min" /></div>}
      {hasWQ && <>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "Roboto,sans-serif", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2 }}>Water Quality · July 2022</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill label="pH" value={data.ph} unit="" warn={data.ph < 6.5 || data.ph > 8.5} />
          <Pill label="TDS" value={data.tds} unit="ppm" warn={data.tds > 500} />
          <Pill label="EC" value={data.ec} unit="μS/cm" />
        </div>
        <div style={{ display: "flex", gap: 6 }}><Pill label="Total Chlorine" value={data.total_chlorine} unit="mg/L" warn={data.total_chlorine > 4} /></div>
      </>}
      {data.notes && <div style={{ padding: "8px 10px", borderRadius: 8, fontSize: 11, lineHeight: 1.5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", fontFamily: "Roboto,sans-serif", fontStyle: "italic" }}>{data.notes}</div>}
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "Roboto,sans-serif", textAlign: "right" }}>Source: UTA Borehole Investigation, July 2022</div>
    </div>
  );
}

// ─── PanoVideo Component (Three.js 360° video player) ────────────────────────
// Loads Three.js from CDN, renders equirectangular video on inverted sphere.
function PanoVideo({ videoUrls, locationName, tall }) {
  const videos = videoUrls || [];
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef(null);
  const stateRef = useRef(null); // { renderer, scene, camera, video, animId }
  const current = videos[idx] || null;
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); setPlaying(false); }, [locationName]);

  // Cleanup helper
  const cleanup = () => {
    const s = stateRef.current;
    if (!s) return;
    if (s.animId) cancelAnimationFrame(s.animId);
    if (s.video) { s.video.pause(); s.video.src = ""; }
    if (s.onResize) window.removeEventListener("resize", s.onResize);
    if (s.renderer) { s.renderer.dispose(); s.renderer.domElement.remove(); }
    stateRef.current = null;
  };

  useEffect(() => {
    if (!current || !containerRef.current) return;
    cleanup();

    const url = typeof current === "string" ? current : current.url;

    (async () => {
      // Load Three.js from CDN if not loaded
      if (!window.THREE) {
        await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; s.onload = r; document.head.appendChild(s); });
      }
      const THREE = window.THREE;
      const container = containerRef.current;
      const w = container.clientWidth, ht = container.clientHeight;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, ht);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Scene + Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, w / ht, 0.1, 1000);

      // Video element
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.loop = true;
      video.muted = false;
      video.src = url;

      // Texture + Sphere (inside-out)
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      const geo = new THREE.SphereGeometry(500, 60, 40);
      geo.scale(-1, 1, 1); // Invert for inside view
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture }));
      scene.add(mesh);

      // Mouse drag controls
      let isDragging = false, prevX = 0, prevY = 0;
      let lon = 0, lat = 0;

      const onDown = (e) => { isDragging = true; const p = e.touches ? e.touches[0] : e; prevX = p.clientX; prevY = p.clientY; };
      const onMove = (e) => {
        if (!isDragging) return;
        const p = e.touches ? e.touches[0] : e;
        lon -= (p.clientX - prevX) * 0.2;
        lat += (p.clientY - prevY) * 0.2;
        lat = Math.max(-85, Math.min(85, lat));
        prevX = p.clientX; prevY = p.clientY;
      };
      const onUp = () => { isDragging = false; };

      renderer.domElement.addEventListener("mousedown", onDown);
      renderer.domElement.addEventListener("mousemove", onMove);
      renderer.domElement.addEventListener("mouseup", onUp);
      renderer.domElement.addEventListener("mouseleave", onUp);
      renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
      renderer.domElement.addEventListener("touchmove", onMove, { passive: true });
      renderer.domElement.addEventListener("touchend", onUp);

      // Render loop
      const state = { renderer, scene, camera, video, animId: null, onResize: null };
      stateRef.current = state;
      const animate = () => {
        state.animId = requestAnimationFrame(animate);
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );
        renderer.render(scene, camera);
      };
      animate();

      // Resize
      state.onResize = () => {
        const nw = container.clientWidth, nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", state.onResize);
    })();

    return cleanup;
  }, [current, locationName]);

  // Play/pause control
  const togglePlay = () => {
    const s = stateRef.current;
    if (!s?.video) return;
    if (s.video.paused) { s.video.play(); setPlaying(true); }
    else { s.video.pause(); setPlaying(false); }
  };

  if (!videos.length) return (
    <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>🎥</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>360° video not yet added</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: "#000", cursor: "grab" }} />
      {/* Play/pause overlay */}
      <button onClick={togglePlay} style={{ position: "absolute", bottom: 12, left: 12, padding: "8px 16px", borderRadius: 980, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
        {playing ? "⏸ Pause" : "▶ Play"}
      </button>
      {videos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button onClick={() => { setIdx((idx - 1 + videos.length) % videos.length); setPlaying(false); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "Roboto,sans-serif", minWidth: 50, textAlign: "center" }}>{idx + 1} / {videos.length}</span>
          <button onClick={() => { setIdx((idx + 1) % videos.length); setPlaying(false); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
        </div>
      )}
    </div>
  );
}

// ─── MediaViewer (tabs: Photos / Video) ──────────────────────────────────────
function MediaViewer({ loc, tall }) {
  const hasPhotos = loc.photoUrls?.length > 0 || loc.photoUrl;
  const hasVideo = loc.videoUrls?.length > 0;
  const tabs = [];
  if (hasPhotos) tabs.push("photos");
  if (hasVideo) tabs.push("video");
  const [activeTab, setActiveTab] = useState(tabs[0] || "photos");

  // Reset tab when location changes
  useEffect(() => { setActiveTab(tabs[0] || "photos"); }, [loc.id]);

  if (!tabs.length) return (
    <div style={{ width: "100%", height: 240, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>📷</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>No media added yet</div>
    </div>
  );

  return (
    <div>
      {/* Only show tabs if both types exist */}
      {tabs.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid " + (activeTab === tab ? C.blue + "55" : "rgba(255,255,255,0.1)"), background: activeTab === tab ? C.blue + "18" : "transparent", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", textTransform: "capitalize", fontFamily: "Roboto,sans-serif" }}>
              {tab === "photos" ? "📷 Photos" : "🎥 Video"}
            </button>
          ))}
        </div>
      )}
      {activeTab === "photos" && <PanoViewer photoUrl={loc.photoUrl} photoUrls={loc.photoUrls} locationName={loc.name} tall={tall} />}
      {activeTab === "video" && <PanoVideo videoUrls={loc.videoUrls} locationName={loc.name} tall={tall} />}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UlloExplorer({ session, profile }) {
  const [apiKey, setApiKey]           = useState(GOOGLE_API_KEY || "");
  const [keyInput, setKeyInput]       = useState("");
  const [mapReady, setMapReady]       = useState(false);
  const [mapLoading, setMapLoading]   = useState(true);
  const [activeLoc, setActiveLoc]     = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAdmin, setShowAdmin]     = useState(false);
  const [showPanel, setShowPanel]     = useState(false);
  const [panelMin, setPanelMin]       = useState(false);

  const mapRef    = useRef(null);
  const map3dRef  = useRef(null);
  const initRef   = useRef(false);
  const markers   = useRef(null);  // MarkerManager
  const camera    = useRef(null);  // CameraController

  const visibleLocs = activeSection ? ALL_LOCATIONS.filter(l => l.sectionKey === activeSection) : ALL_LOCATIONS;

  // ── Actions (each one does ONE thing, calls the right manager) ──

  const selectLoc = useCallback((loc) => {
    setActiveLoc(loc);
    setShowPanel(false);
    setPanelMin(false);
    markers.current?.isolate(loc.id);
    camera.current?.flyAndOrbit(loc);
  }, []);

  const closeLoc = useCallback(() => {
    camera.current?.resetView();
    markers.current?.restore();
    setActiveLoc(null);
    setShowPanel(false);
  }, []);

  const openPanel = useCallback(() => {
    setShowPanel(true);
    setPanelMin(false);
  }, []);

  const changeSection = useCallback((key) => {
    camera.current?.stop();
    markers.current?.setSection(key);
    setActiveSection(key);
    setActiveLoc(null);
    setShowPanel(false);
  }, []);

  const resetView = useCallback(() => {
    camera.current?.resetView();
    markers.current?.restore();
    setActiveLoc(null);
    setShowPanel(false);
  }, []);

  const navLoc = (dir) => {
    if (!activeLoc) return;
    const list = activeSection ? SECTIONS[activeSection].subsections : ALL_LOCATIONS;
    const idx = list.findIndex(l => l.id === activeLoc.id);
    const next = dir === "next" ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length;
    const loc = list[next];
    const sk = activeSection || loc.sectionKey;
    const full = { ...loc, sectionKey: sk, sectionColor: SECTIONS[sk].color, sectionIcon: SECTIONS[sk].icon, sectionLabel: SECTIONS[sk].label };
    setActiveLoc(full);
    markers.current?.isolate(full.id);
    camera.current?.flyAndOrbit(full);
  };

  // ── Map Init ──

  const initMap = useCallback(async (key) => {
    if (!mapRef.current || initRef.current) return;
    initRef.current = true;
    if (!window.google?.maps) {
      await new Promise(r => { const s = document.createElement("script"); s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=alpha&libraries=maps3d`; s.async = true; s.onload = r; document.head.appendChild(s); });
    }
    const libs = await google.maps.importLibrary("maps3d");
    const map3d = new libs.Map3DElement({ center: { lat: WORLD.lat, lng: WORLD.lng, altitude: 0 }, range: 1500, tilt: 55, heading: 0, mode: "SATELLITE" });
    map3d.style.width = "100%"; map3d.style.height = "100%";
    mapRef.current.appendChild(map3d);
    map3dRef.current = map3d;
    await customElements.whenDefined("gmp-map-3d");
    setMapLoading(false);
    setMapReady(true);

    camera.current = new CameraController(map3dRef);

    setTimeout(async () => {
      try {
        const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
        markers.current = new MarkerManager(map3d, LABELED_LOCATIONS, Marker3DInteractiveElement, selectLoc);
      } catch (err) { console.error("MarkerManager init failed:", err); }
    }, 1200);
  }, [selectLoc]);

  useEffect(() => { if (apiKey && !initRef.current) initMap(apiKey); }, [apiKey, initMap]);
  useEffect(() => { if (!markers.current) return; activeSection ? markers.current.setSection(activeSection) : markers.current.clearSection(); }, [activeSection]);
  useEffect(() => () => { markers.current?.dispose(); camera.current?.stop(); }, []);

  // ── Render: API Key Screen ──

  if (!apiKey) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "Roboto,sans-serif", padding: 24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}"}</style>
      <div style={{ maxWidth: 480, width: "100%", padding: "48px 36px", textAlign: "center", background: C.surface, border: "1px solid " + C.border, borderRadius: 12 }}>
        <h1 style={{ fontFamily: "Roboto Slab,serif", fontSize: 32, color: C.text, fontWeight: 900 }}>Explore <span style={{ color: C.gold }}>Ullo</span></h1>
        <p style={{ color: C.blue, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, marginTop: 4 }}>Engineers Without Borders — ISU</p>
        <input type="text" placeholder="AIzaSy..." value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && keyInput.startsWith("AIza")) setApiKey(keyInput); }}
          style={{ width: "100%", marginTop: 24, padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid " + C.border, borderRadius: 6, color: C.text, fontSize: 14, fontFamily: "monospace", outline: "none" }} />
        <button onClick={() => { if (keyInput.startsWith("AIza")) setApiKey(keyInput); }} style={{ width: "100%", marginTop: 12, padding: "14px", background: C.blue, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "Roboto,sans-serif" }}>Launch Explorer →</button>
      </div>
    </div>
  );

  // ── Render: Main App ──

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "Roboto,sans-serif", background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 ${C.blue}44}50%{box-shadow:0 0 0 10px ${C.blue}00}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .sb-scroll::-webkit-scrollbar{width:4px}.sb-scroll::-webkit-scrollbar-track{background:transparent}.sb-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .loc-btn:hover{background:rgba(255,255,255,0.05)!important}
      `}</style>

      {/* Map container */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

      {/* Loading spinner */}
      {mapLoading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg }}>
          <div style={{ width: 48, height: 48, border: "2px solid " + C.blue + "22", borderTopColor: C.blue, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 20, color: C.blue, fontSize: 12, letterSpacing: 3, textTransform: "uppercase" }}>Loading Ullo</p>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none", background: "linear-gradient(180deg,rgba(13,17,23,0.95) 0%,rgba(13,17,23,0.5) 70%,transparent 100%)" }}>
        <div style={{ pointerEvents: "auto" }}>
          <p style={{ fontFamily: "Roboto Slab,serif", fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1 }}>Ullo<span style={{ color: C.gold }}>,</span> Ghana</p>
          <p style={{ fontSize: 9, color: C.blueLight, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>EWB–ISU Community Explorer</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.blueLight }}>{session?.user?.user_metadata?.full_name || session?.user?.email}</div>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginTop: 2, color: profile?.role === "admin" ? C.gold : profile?.role === "member" ? C.lime : C.textDim }}>{profile?.role || "supporter"}</div>
          </div>
          {profile?.role === "admin" && <button onClick={() => setShowAdmin(true)} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)", color: C.gold, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>⚙ Users</button>}
          <button onClick={() => supabase.auth.signOut()} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ position: "absolute", top: 62, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", gap: 3, padding: "5px 6px", background: "rgba(10,14,20,0.82)", backdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)", pointerEvents: "auto" }}>
        {Object.entries(SECTIONS).map(([key, sec]) => { const active = activeSection === key; return (
          <button key={key} onClick={() => changeSection(active ? null : key)}
            style={{ position: "relative", padding: "7px 13px", borderRadius: 8, border: "none", background: active ? `linear-gradient(135deg,${sec.color}35,${sec.color}18)` : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.38)", fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", boxShadow: active ? `0 0 0 1px ${sec.color}55` : "none", outline: "none" }}>
            <span style={{ marginRight: 5 }}>{sec.icon}</span>{sec.label}
            {active && <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: sec.color, boxShadow: `0 0 6px ${sec.color}` }} />}
          </button>);
        })}
      </div>

      {/* Section sidebar */}
      {activeSection && (
        <div style={{ position: "absolute", top: 110, left: 16, bottom: 24, width: 248, zIndex: 100, pointerEvents: "auto", display: "flex", flexDirection: "column", background: "rgba(10,14,20,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: SECTIONS[activeSection].color, fontWeight: 700, marginBottom: 3 }}>{SECTIONS[activeSection].icon} {SECTIONS[activeSection].label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{SECTIONS[activeSection].subsections.length} locations</div>
            </div>
            <button onClick={() => changeSection(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div className="sb-scroll" style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
            {SECTIONS[activeSection].subsections.map((sub, i) => { const isA = activeLoc?.id === sub.id, sec = SECTIONS[activeSection]; return (
              <button key={sub.id} className="loc-btn" onClick={() => selectLoc({ ...sub, sectionKey: activeSection, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label })}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: isA ? sec.color + "18" : "transparent", borderLeft: isA ? `2px solid ${sec.color}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: isA ? sec.color + "30" : "rgba(255,255,255,0.05)", border: "1px solid " + (isA ? sec.color + "60" : "rgba(255,255,255,0.1)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isA ? sec.color : "rgba(255,255,255,0.3)", fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: isA ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: isA ? 600 : 400, lineHeight: 1.3 }}>{sub.name}</span>
              </button>);
            })}
          </div>
        </div>
      )}

      {/* Welcome modal */}
      {mapReady && showWelcome && !activeLoc && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 150, textAlign: "center", padding: "36px 40px", maxWidth: 420, background: C.bgCard, backdropFilter: "blur(20px)", border: "1px solid " + C.border, borderRadius: 12, backgroundImage: `radial-gradient(ellipse at 50% 0%, ${C.blue}10 0%, transparent 60%)` }}>
          <h3 style={{ fontFamily: "Roboto Slab,serif", fontSize: 22, color: C.text, margin: "0 0 10px", fontWeight: 900 }}>Welcome to <span style={{ color: C.gold }}>Ullo</span></h3>
          <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>3D labels mark confirmed GPS locations. Click any label or use the section tabs to explore.</p>
          <button onClick={() => setShowWelcome(false)} style={{ marginTop: 20, padding: "10px 28px", background: C.blue, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>Start Exploring</button>
        </div>
      )}

      {/* Status bar */}
      <div style={{ position: "absolute", bottom: 24, left: activeSection ? 280 : 24, zIndex: 100, display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: C.bgCard, backdropFilter: "blur(12px)", border: "1px solid " + C.border, borderRadius: 6, pointerEvents: "auto", transition: "left 0.3s" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, animation: "pulseGlow 2s infinite" }} />
        <span style={{ color: C.textMuted, fontSize: 12 }}><span style={{ color: C.gold, fontWeight: 700 }}>{visibleLocs.length}</span> locations{activeSection && <span style={{ color: C.textDim }}> · {SECTIONS[activeSection].label}</span>}</span>
      </div>

      {/* Reset view button */}
      <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 100, pointerEvents: "auto" }}>
        <button onClick={resetView} style={{ padding: "8px 14px", borderRadius: 6, background: C.bgCard, border: "1px solid " + C.border, color: C.blueLight, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer" }}>🏠 Reset View</button>
      </div>

      {/* Orbit overlay — Details + Close buttons */}
      {activeLoc && !showPanel && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, pointerEvents: "auto", animation: "fadeSlideUp 0.6s ease both", animationDelay: "1.5s" }}>
          <button onClick={openPanel} style={{ padding: "16px 48px", borderRadius: 980, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(60px) saturate(200%) brightness(1.2)", WebkitBackdropFilter: "blur(60px) saturate(200%) brightness(1.2)", border: "1px solid rgba(255,255,255,0.45)", color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: 0.3, cursor: "pointer", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif", boxShadow: "0 4px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Details</button>
          <button onClick={closeLoc} style={{ padding: "10px 24px", borderRadius: 980, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(60px) saturate(180%)", WebkitBackdropFilter: "blur(60px) saturate(180%)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>Close</button>
        </div>
      )}

      {/* Detail panel — fullscreen or minimized */}
      {activeLoc && showPanel && (<>
        {!panelMin && <div onClick={closeLoc} style={{ position: "absolute", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.35)", pointerEvents: "auto" }} />}
        <div style={{
          position: "absolute", zIndex: 501,
          ...(panelMin ? { bottom: 24, right: 24, width: "40%", maxWidth: 480, height: "45%", borderRadius: 12 } : { top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0 }),
          background: C.bgCard, backdropFilter: "blur(24px)",
          border: panelMin ? `1px solid ${C.border}` : "none",
          boxShadow: panelMin ? "0 8px 32px rgba(0,0,0,0.6)" : "none",
          overflow: "hidden", display: "flex", flexDirection: "column",
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${C.blue}08 0%, transparent 40%)`,
          transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)", pointerEvents: "auto",
        }}>
          <div style={{ padding: panelMin ? "10px 14px 6px" : "16px 24px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, border: `1px solid ${(activeLoc.sectionColor || C.blue)}33`, background: `${(activeLoc.sectionColor || C.blue)}12`, color: activeLoc.sectionColor || C.blue, fontSize: panelMin ? 9 : 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{activeLoc.sectionIcon} {activeLoc.sectionLabel}</span>
              <h2 style={{ fontFamily: "Roboto Slab,serif", fontSize: panelMin ? 16 : 26, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{activeLoc.name}</h2>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <button onClick={() => setPanelMin(!panelMin)} title={panelMin ? "Expand" : "Minimize"} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid " + C.borderSubtle, background: C.surface, color: C.text, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{panelMin ? "⤢" : "⤡"}</button>
              <button onClick={closeLoc} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid " + C.borderSubtle, background: C.surface, color: C.text, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
            </div>
          </div>
          <div style={{ padding: panelMin ? "0 14px 14px" : "0 24px 24px", overflowY: "auto", flex: 1 }}>
            <p style={{ color: C.textDim, fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📍 {activeLoc.lat.toFixed(4)}°N, {Math.abs(activeLoc.lng).toFixed(4)}°W · Jirapa District, Upper West Region</p>
            <MediaViewer loc={activeLoc} tall={!panelMin} />
            {activeLoc.description && <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line" }}>{activeLoc.description}</p>}
            {activeLoc.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{activeLoc.tags.map(tag => (<span key={tag} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>{tag}</span>))}</div>}
            {activeLoc.sectionKey === "boreholes" && activeLoc.data && <BoreholeDataCard data={activeLoc.data} />}
          </div>
          <div style={{ display: "flex", gap: 8, padding: panelMin ? "8px 14px" : "10px 24px 14px", borderTop: "1px solid " + C.borderSubtle, flexShrink: 0 }}>
            <button onClick={() => navLoc("prev")} style={{ flex: 1, padding: panelMin ? "7px 12px" : "9px 16px", borderRadius: 6, border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Previous</button>
            <button onClick={() => navLoc("next")} style={{ flex: 1, padding: panelMin ? "7px 12px" : "9px 16px", borderRadius: 6, border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Next →</button>
          </div>
        </div>
      </>)}

      {showAdmin && <AdminPanel currentUser={session?.user} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
