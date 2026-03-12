import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const C = {
  blue:"#0065b2", blueLight:"#abcae9", lime:"#cedc00", brown:"#3d3935", orange:"#b36924", gold:"#D4A843",
  bg:"#0D1117", bgCard:"rgba(13,17,23,0.96)", bgPanel:"rgba(0,101,178,0.06)", surface:"rgba(255,255,255,0.04)",
  border:"rgba(0,101,178,0.2)", borderSubtle:"rgba(255,255,255,0.06)",
  text:"#ECEFF4", textMuted:"rgba(171,202,233,0.7)", textDim:"rgba(171,202,233,0.4)",
};
const WORLD_LAT=10.6910, WORLD_LNG=-2.5658;
const DEG_LAT_M=111139, DEG_LNG_M=111139*Math.cos(WORLD_LAT*Math.PI/180);

// realCoords:true = confirmed GPS, gets 3D label
const SECTIONS = {
  community:{label:"Community",icon:"🏘️",color:"#D4A843",subsections:[
    {id:"cm1",lodTier:1,name:"Ullo",             photoUrl:"",lat:10.6910,lng:-2.5658,labelScale:3.0,realCoords:true, description:"",tags:[]},
    {id:"cm2",lodTier:2,name:"Elementary School",photoUrl:"",lat:10.6931,lng:-2.5699,labelScale:1.2,realCoords:true, description:"Ullo Elementary School",tags:[]},
    {id:"cm3",lodTier:1,name:"Dante Dam",        photoUrl:"",lat:10.6928,lng:-2.5607,labelScale:1.5,realCoords:true, description:"The Ullo Dante Dam is a completed water infrastructure project developed in partnership with the community of Ullo, Ghana.",tags:["#ullodam","#waterinfrastructure"]},
  ]},
  school:{label:"Senior High School",icon:"🏫",color:"#6B9EE8",subsections:[
    {id:"sh1",lodTier:3, name:"USHS Entrance",            photoUrl:"",lat:10.6910,lng:-2.5657,realCoords:true, description:"Classic Ullo Senior High School sign!",tags:["#ulloseniorhighschool"]},
    {id:"sh2",lodTier:3, name:"Gate Borehole",             photoUrl:"",lat:10.6908,lng:-2.5663,realCoords:true, description:"The gate borehole which is found by the main gate inside the senior high school. This borehole has been electrified since February 2025 and uses grid power.",tags:["#gridpower","#ulloseniorhighschool"]},
    {id:"sh3",lodTier:2, name:"Kitchen",                   photoUrl:"",lat:10.6894,lng:-2.5661,realCoords:true, description:"The Ullo Senior High School kitchen provides students with 3 meals per day.\n\nIowa State EWB ASHRAE team has installed 2 solar water heaters providing on demand hot water.",tags:["#ulloseniorhighschool","#solarpower"]},
    {id:"sh4",lodTier:2, name:"Male Student Dormitory",    photoUrl:"",lat:10.6892,lng:-2.5683,realCoords:true, description:"Male Student dormitory on campus. In summer 2025 the Clinic Electric Team in partnership with ASHRAE installed lighting and ceiling fans.",tags:["#ulloseniorhighschool","#solarpower"]},
    {id:"sh5",lodTier:3, name:"Male Pit Latrines",         photoUrl:"",lat:10.6892,lng:-2.5685,realCoords:true, description:"The winter 2025 Travel Team installed both pit latrines in January 2026. This effort was led by Jenna Hellman and team lead John Beuter.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh6",lodTier:3, name:"Male Dormitory Water Tanks",photoUrl:"",lat:10.6891,lng:-2.5680,realCoords:true, description:"",tags:["#ulloseniorhighschool","#polytank"]},
    {id:"sh7",lodTier:2, name:"School Solar Borehole 2025",photoUrl:"",lat:10.6896,lng:-2.5706,realCoords:true, description:"The winter 2024 Travel Team installed an electrical pump and solar panel. Led by John Beuter and team lead Brian Cacioppo.",tags:["#ulloseniorhighschool","#borehole","#solarpower"]},
    {id:"sh8",lodTier:3, name:"Female Pit Latrine 2023",   photoUrl:"",lat:10.6863,lng:-2.5672,realCoords:true, description:"The winter 2023 Travel Team installed a pit latrine for the female students on campus.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh9",lodTier:3, name:"Female Pit Latrine 2024",   photoUrl:"",lat:10.6883,lng:-2.5667,realCoords:true, description:"The winter 2024 Travel Team installed a pit latrine. Led by Bryan Cacioppo, Kayla Worachek, Arissa Kramer, Sarah Broeker, and community partners Paul and Justin.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh10",lodTier:2,name:"Female Student Dormitory",  photoUrl:"",lat:10.6882,lng:-2.5663,realCoords:true, description:"",tags:["#ulloseniorhighschool"]},
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
    {id:"b2", name:"Sama Yiri",     photoUrl:"",lat:10.6912,lng:-2.5660,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.4,ph:7.10,ec:234,tds:117,total_chlorine:0,  notes:null}},
    {id:"b3", name:"Yir-Paala",    photoUrl:"",lat:10.6914,lng:-2.5655,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.0,ph:6.96,ec:224,tds:112,total_chlorine:0,  notes:null}},
    {id:"b4", name:"Nindor Yiri",  photoUrl:"",lat:10.6916,lng:-2.5650,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.9,ph:6.75,ec:234,tds:117,total_chlorine:0,  notes:null}},
    {id:"b5", name:"Islamic",      photoUrl:"",lat:10.6908,lng:-2.5645,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:9.6, ph:6.78,ec:216,tds:108,total_chlorine:0,  notes:null}},
    {id:"b6", name:"Chief",        photoUrl:"",lat:10.6906,lng:-2.5640,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:14.1,ph:7.11,ec:574,tds:297,total_chlorine:1.0,notes:null}},
    {id:"b7", name:"Mambo",        photoUrl:"",lat:10.6920,lng:-2.5670,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:12.0,ph:7.25,ec:544,tds:272,total_chlorine:0,  notes:null}},
    {id:"b8", name:"Old Mambo",    photoUrl:"",lat:10.6922,lng:-2.5675,realCoords:false,description:"",tags:[],data:{operational:"No", pump_type:"N/A",       flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Previously mechanized. No pump currently installed."}},
    {id:"b9", name:"Market",       photoUrl:"",lat:10.6900,lng:-2.5680,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:7.32,ec:212,tds:104,total_chlorine:0,  notes:"Mechanized to polytank. 3 taps, 1 tapstand."}},
    {id:"b10",name:"Gate",         photoUrl:"",lat:10.6908,lng:-2.5663,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to kitchen polytank."}},
    {id:"b11",name:"Gate 2",       photoUrl:"",lat:10.6932,lng:-2.5658,realCoords:false,description:"",tags:[],data:{operational:"No", pump_type:"N/A",       flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Handpump removed when Gate BH was drilled."}},
    {id:"b12",name:"Wall",         photoUrl:"",lat:10.6925,lng:-2.5665,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to polytank by Asst. Headmaster's bungalow."}},
    {id:"b13",name:"Wall 2",       photoUrl:"",lat:10.6927,lng:-2.5662,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Mechanized",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:"Mechanized to polytank by Asst. Headmaster's bungalow."}},
    {id:"b14",name:"Form",         photoUrl:"",lat:10.6918,lng:-2.5648,realCoords:false,description:"",tags:[],data:{operational:"No", pump_type:"Hand Pivot",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:null}},
    {id:"b15",name:"Girls Dorm BH",photoUrl:"",lat:10.6904,lng:-2.5643,realCoords:false,description:"",tags:[],data:{operational:"No", pump_type:"Hand Pivot",flow_wet:null,ph:null,ec:null,tds:null,total_chlorine:null,notes:null}},
    {id:"b16",name:"KG (Gozu)",    photoUrl:"",lat:10.6902,lng:-2.5638,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:18.5,ph:6.93,ec:154,tds:77, total_chlorine:4.0,notes:null}},
    {id:"b17",name:"Gozu",         photoUrl:"",lat:10.6898,lng:-2.5635,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:14.1,ph:7.13,ec:206,tds:103,total_chlorine:0,  notes:null}},
    {id:"b18",name:"Vision",       photoUrl:"",lat:10.6896,lng:-2.5632,realCoords:false,description:"",tags:[],data:{operational:"Yes",pump_type:"Hand Pivot",flow_wet:10.4,ph:7.60,ec:180,tds:90, total_chlorine:0,  notes:null}},
  ]},
  latrines:{label:"Latrines",icon:"🚹",color:"#b36924",subsections:[
    {id:"l1",name:"2023 Latrine S. Campus",photoUrl:"",lat:10.6863,lng:-2.5672,realCoords:false,description:"",tags:[]},
    {id:"l2",name:"Girls Latrine",          photoUrl:"",lat:10.6883,lng:-2.5667,realCoords:false,description:"",tags:[]},
    {id:"l3",name:"Boys Latrine 1",         photoUrl:"",lat:10.6892,lng:-2.5685,realCoords:false,description:"",tags:[]},
    {id:"l4",name:"Boys Latrine 2",         photoUrl:"",lat:10.6916,lng:-2.5650,realCoords:false,description:"",tags:[]},
  ]},
  clinic:{label:"Clinic",icon:"⚕️",color:"#E8913A",subsections:[
    {id:"c1",lodTier:1,name:"Ullo Clinic Site",photoUrl:"",lat:10.6887,lng:-2.5624,labelScale:1.8,realCoords:true, description:"The Ullo Health Clinic is our largest project to date. Once completed, the clinic will serve approximately 15,000 people in Ullo and the surrounding area. Construction is underway, with walls now completed, and EWB-ISU is actively fundraising to support installation of the roof.",tags:["#clinic"]},
    {id:"c2",lodTier:1,name:"Ullo Clinic",     photoUrl:"",lat:10.6922,lng:-2.5578,realCoords:true, description:"Current clinic serving the community.",tags:["#clinic"]},
  ]},
};
const ALL_LOCATIONS=Object.entries(SECTIONS).flatMap(([sk,sec])=>sec.subsections.map(sub=>({...sub,sectionKey:sk,sectionColor:sec.color,sectionIcon:sec.icon,sectionLabel:sec.label})));
const LABELED_LOCATIONS=ALL_LOCATIONS.filter(l=>l.realCoords);



function buildLabelImg(name, sectionLabel, icon, color, scale) {
  const s      = Math.min(scale || 1, 1.4);
  const DPR    = 2;
  const mainPx = Math.round(13 * s);
  const subPx  = Math.round(8 * s);
  const pad    = 7;

  const tmp = document.createElement("canvas").getContext("2d");
  tmp.font = `900 ${mainPx}px "Roboto Slab",Georgia,serif`;
  const mw = tmp.measureText(name.toUpperCase()).width;
  tmp.font = `600 ${subPx}px Roboto,Arial,sans-serif`;
  const sw = tmp.measureText(`${icon} ${sectionLabel}`.toUpperCase()).width;

  const cw = Math.max(mw, sw) + pad * 2;
  const ch = mainPx + pad * 1.4;

  const cv = document.createElement("canvas");
  cv.width  = cw * DPR;
  cv.height = ch * DPR;
  const ctx = cv.getContext("2d");
  ctx.scale(DPR, DPR);

  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.font = `900 ${mainPx}px "Roboto Slab",Georgia,serif`;

  // Glow
  ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.globalAlpha = 0.7;
  ctx.fillStyle   = color;
  ctx.fillText(name.toUpperCase(), cw / 2, pad);

  // Crisp white
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.fillStyle  = "#ffffff";
  ctx.fillText(name.toUpperCase(), cw / 2, pad);

  const img = document.createElement("img");
  img.src   = cv.toDataURL("image/png");
  img.width  = cw;
  img.height = ch;
  return img;
}

// Auto-stagger altitudes so nearby labels don't overlap
function staggerAltitudes(locations) {
  const THRESH = 0.0008; // ~90m — treat as "nearby"
  const alts   = new Array(locations.length).fill(0);
  for (let i = 0; i < locations.length; i++) {
    const neighbors = [];
    for (let j = 0; j < i; j++) {
      const dlat = locations[i].lat - locations[j].lat;
      const dlng = locations[i].lng - locations[j].lng;
      if (Math.sqrt(dlat*dlat + dlng*dlng) < THRESH) neighbors.push(alts[j]);
    }
    if (neighbors.length > 0) {
      // Pick next multiple of 35m not already used nearby
      const used = new Set(neighbors);
      let alt = 35;
      while (used.has(alt)) alt += 35;
      alts[i] = alt;
    }
  }
  return alts;
}

async function setupThreeLabels(map3d, container, locations, onSelect) {
  const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
  const markerObjs  = [];
  const altitudes   = staggerAltitudes(locations);
  let   activeSection = null;

  for (let idx = 0; idx < locations.length; idx++) {
    const loc = locations[idx];
    const alt = altitudes[idx];
    const marker = new Marker3DInteractiveElement({
      position:    { lat: loc.lat, lng: loc.lng, altitude: alt },
      altitudeMode: alt > 0 ? "RELATIVE_TO_GROUND" : "CLAMP_TO_GROUND",
      extruded:    alt > 0,
    });

    const img  = buildLabelImg(loc.name, loc.sectionLabel, loc.sectionIcon, loc.sectionColor, loc.labelScale);
    const tmpl = document.createElement("template");
    tmpl.content.appendChild(img);
    marker.appendChild(tmpl);
    map3d.appendChild(marker);

    marker.addEventListener("gmp-click", (e) => {
      onSelect(loc); e.stopPropagation();
    });

    markerObjs.push({ marker, loc });
  }

  // Show/hide by zoom — read range attribute every frame (most reliable method)
  const LOD_RANGES = { 1: Infinity, 2: 2500, 3: 1200 };
  let rafRunning = true;

  function applyVisibility(range) {
    for (const { marker, loc } of markerObjs) {
      const sectionOk = !activeSection || loc.sectionKey === activeSection;
      const lodOk     = range <= LOD_RANGES[loc.lodTier ?? 3];
      marker.style.opacity       = sectionOk && lodOk ? "1" : "0";
      marker.style.pointerEvents = sectionOk && lodOk ? "auto" : "none";
    }
  }

  (function tick() {
    if (!rafRunning) return;
    requestAnimationFrame(tick);
    const range = parseFloat(map3d.getAttribute("range")) || 1500;
    applyVisibility(range);
  })();


  return {
    setActiveSection(key) {
      activeSection = key || null;
      applyVisibility(parseFloat(map3d.getAttribute("range")) || 1500);
    },
    setAllVisible() {
      activeSection = null;
      applyVisibility(parseFloat(map3d.getAttribute("range")) || 1500);
    },
    setActiveLocation() {},
    dispose() {
      rafRunning = false;
      for (const { marker } of markerObjs) marker.remove();
    },
  };
}

function PanoViewer({photoUrl,locationName}){
  const ref=useRef(null),vRef=useRef(null);
  useEffect(()=>{
    if(!photoUrl||!ref.current)return;
    (async()=>{
      if(!document.getElementById("pann-css")){const l=document.createElement("link");l.id="pann-css";l.rel="stylesheet";l.href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";document.head.appendChild(l);}
      if(!window.pannellum){await new Promise(r=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";s.onload=r;document.head.appendChild(s);});}
      if(vRef.current)vRef.current.destroy();
      vRef.current=window.pannellum.viewer(ref.current,{type:"equirectangular",panorama:photoUrl,autoLoad:true,autoRotate:-2,compass:true,showZoomCtrl:true,showFullscreenCtrl:true,hfov:110,title:locationName});
    })();
    return()=>{if(vRef.current){vRef.current.destroy();vRef.current=null;}};
  },[photoUrl,locationName]);
  if(!photoUrl)return(
    <div style={{width:"100%",height:240,borderRadius:8,overflow:"hidden",border:"1px solid "+C.border,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:36,opacity:0.3,marginBottom:8}}>📷</div>
      <div style={{color:C.textDim,fontSize:12,fontFamily:"Roboto,sans-serif"}}>360° photo not yet added</div>
    </div>
  );
  return(<div style={{width:"100%",height:240,borderRadius:8,overflow:"hidden",border:"1px solid "+C.border}}><div ref={ref} style={{width:"100%",height:"100%"}}/></div>);
}

function BoreholeDataCard({data}){
  if(!data)return null;
  const op=data.operational==="Yes",hasWQ=data.ph!=null;
  function Pill({label,value,unit,warn}){
    return(<div style={{background:warn?"rgba(224,82,82,0.12)":"rgba(255,255,255,0.04)",border:"1px solid "+(warn?"rgba(224,82,82,0.3)":"rgba(255,255,255,0.08)"),borderRadius:8,padding:"8px 10px",flex:"1 1 70px"}}>
      <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",fontFamily:"Roboto,sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{label}</div>
      <div style={{fontSize:15,fontWeight:700,color:warn?"#E05252":"#fff",fontFamily:"Roboto,sans-serif",lineHeight:1}}>{value??"—"}{value!=null&&<span style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginLeft:2}}>{unit}</span>}</div>
    </div>);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"Roboto,sans-serif",background:op?"rgba(59,168,82,0.18)":"rgba(224,82,82,0.18)",border:"1px solid "+(op?"rgba(59,168,82,0.4)":"rgba(224,82,82,0.4)"),color:op?"#5DC87A":"#E05252"}}>{op?"● Operational":"● Non-operational"}</span>
        <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontFamily:"Roboto,sans-serif",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>{data.pump_type}</span>
      </div>
      {data.flow_wet!=null&&<div style={{display:"flex",gap:6}}><Pill label="Flow Rate (Wet)" value={data.flow_wet} unit="L/min"/></div>}
      {hasWQ&&<>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:"Roboto,sans-serif",textTransform:"uppercase",letterSpacing:1.5,marginTop:2}}>Water Quality · July 2022</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Pill label="pH" value={data.ph} unit="" warn={data.ph<6.5||data.ph>8.5}/>
          <Pill label="TDS" value={data.tds} unit="ppm" warn={data.tds>500}/>
          <Pill label="EC" value={data.ec} unit="μS/cm"/>
        </div>
        <div style={{display:"flex",gap:6}}><Pill label="Total Chlorine" value={data.total_chlorine} unit="mg/L" warn={data.total_chlorine>4}/></div>
      </>}
      {data.notes&&<div style={{padding:"8px 10px",borderRadius:8,fontSize:11,lineHeight:1.5,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.45)",fontFamily:"Roboto,sans-serif",fontStyle:"italic"}}>{data.notes}</div>}
      <div style={{fontSize:9,color:"rgba(255,255,255,0.18)",fontFamily:"Roboto,sans-serif",textAlign:"right"}}>Source: UTA Borehole Investigation, July 2022</div>
    </div>
  );
}

export default function UlloExplorer({session,profile}){
  const [apiKey,setApiKey]=useState(GOOGLE_API_KEY||"");
  const [keyInput,setKeyInput]=useState("");
  const [mapReady,setMapReady]=useState(false);
  const [mapLoading,setMapLoading]=useState(true);
  const [activeLocation,setActiveLocation]=useState(null);
  const [activeSection,setActiveSection]=useState(null);
  const [showWelcome,setShowWelcome]=useState(true);
  const [showAdmin,setShowAdmin]=useState(false);
  const mapRef=useRef(null),map3dRef=useRef(null),threeRef=useRef(null),initRef=useRef(false);
  const visibleLocs=activeSection?ALL_LOCATIONS.filter(l=>l.sectionKey===activeSection):ALL_LOCATIONS;

  const flyTo=useCallback((loc)=>{map3dRef.current?.flyCameraTo({endCamera:{center:{lat:loc.lat,lng:loc.lng,altitude:0},range:300,tilt:62,heading:Math.random()*50-25},durationMillis:1600});},[]);
  const selectLocation=useCallback((loc)=>{setActiveLocation(loc);flyTo(loc);threeRef.current?.setActiveLocation(loc.id);},[flyTo]);

  const initMap=useCallback(async(key)=>{
    if(!mapRef.current||initRef.current)return;initRef.current=true;
    if(!window.google?.maps){await new Promise(r=>{const s=document.createElement("script");s.src=`https://maps.googleapis.com/maps/api/js?key=${key}&v=alpha&libraries=maps3d`;s.async=true;s.onload=r;document.head.appendChild(s);});}
    const libs=await google.maps.importLibrary("maps3d");
    const map3d=new libs.Map3DElement({center:{lat:WORLD_LAT,lng:WORLD_LNG,altitude:0},range:1500,tilt:55,heading:0,mode:"SATELLITE"});
    map3d.style.width="100%";map3d.style.height="100%";
    mapRef.current.appendChild(map3d);map3dRef.current=map3d;
    await customElements.whenDefined("gmp-map-3d");
    setMapLoading(false);setMapReady(true);
    setTimeout(async()=>{
      try{const api=await setupThreeLabels(map3d,mapRef.current,LABELED_LOCATIONS,selectLocation);threeRef.current=api;}
      catch(err){console.error("Three.js setup failed:",err);}
    },1200);
  },[selectLocation]);

  useEffect(()=>{if(apiKey&&!initRef.current)initMap(apiKey);},[apiKey,initMap]);
  useEffect(()=>{if(!threeRef.current)return;activeSection?threeRef.current.setActiveSection(activeSection):threeRef.current.setAllVisible();},[activeSection]);
  useEffect(()=>{threeRef.current?.setActiveLocation(activeLocation?.id??null);},[activeLocation]);
  useEffect(()=>()=>threeRef.current?.dispose(),[]);

  const navLoc=(dir)=>{
    if(!activeLocation)return;
    const list=activeSection?SECTIONS[activeSection].subsections:ALL_LOCATIONS;
    const idx=list.findIndex(l=>l.id===activeLocation.id);
    const next=dir==="next"?(idx+1)%list.length:(idx-1+list.length)%list.length;
    const loc=list[next],sk=activeSection||loc.sectionKey;
    selectLocation({...loc,sectionKey:sk,sectionColor:SECTIONS[sk].color,sectionIcon:SECTIONS[sk].icon,sectionLabel:SECTIONS[sk].label});
  };

  if(!apiKey)return(
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"Roboto,sans-serif",padding:24}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}"}</style>
      <div style={{maxWidth:480,width:"100%",padding:"48px 36px",textAlign:"center",background:C.surface,border:"1px solid "+C.border,borderRadius:12}}>
        <h1 style={{fontFamily:"Roboto Slab,serif",fontSize:32,color:C.text,fontWeight:900}}>Explore <span style={{color:C.gold}}>Ullo</span></h1>
        <p style={{color:C.blue,fontSize:12,letterSpacing:3,textTransform:"uppercase",fontWeight:500,marginTop:4}}>Engineers Without Borders — ISU</p>
        <input type="text" placeholder="AIzaSy..." value={keyInput} onChange={e=>setKeyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&keyInput.startsWith("AIza"))setApiKey(keyInput);}}
          style={{width:"100%",marginTop:24,padding:"14px 16px",background:"rgba(0,0,0,0.4)",border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:14,fontFamily:"monospace",outline:"none"}}/>
        <button onClick={()=>{if(keyInput.startsWith("AIza"))setApiKey(keyInput);}} style={{width:"100%",marginTop:12,padding:"14px",background:C.blue,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer",fontFamily:"Roboto,sans-serif"}}>Launch Explorer →</button>
      </div>
    </div>
  );

  return(
    <div style={{width:"100vw",height:"100vh",position:"relative",overflow:"hidden",fontFamily:"Roboto,sans-serif",background:C.bg}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 ${C.blue}44}50%{box-shadow:0 0 0 10px ${C.blue}00}}
        .sb-scroll::-webkit-scrollbar{width:4px}.sb-scroll::-webkit-scrollbar-track{background:transparent}.sb-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .loc-btn:hover{background:rgba(255,255,255,0.05)!important}
      `}</style>
      <div ref={mapRef} style={{position:"absolute",inset:0,zIndex:1}}/>
      {mapLoading&&(<div style={{position:"absolute",inset:0,zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
        <div style={{width:48,height:48,border:"2px solid "+C.blue+"22",borderTopColor:C.blue,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <p style={{marginTop:20,color:C.blue,fontSize:12,letterSpacing:3,textTransform:"uppercase"}}>Loading Ullo</p>
      </div>)}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:100,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",pointerEvents:"none",background:"linear-gradient(180deg,rgba(13,17,23,0.95) 0%,rgba(13,17,23,0.5) 70%,transparent 100%)"}}>
        <div style={{pointerEvents:"auto"}}>
          <p style={{fontFamily:"Roboto Slab,serif",fontSize:20,fontWeight:900,color:C.text,lineHeight:1}}>Ullo<span style={{color:C.gold}}>,</span> Ghana</p>
          <p style={{fontSize:9,color:C.blueLight,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600,marginTop:2}}>EWB–ISU Community Explorer</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,pointerEvents:"auto"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.blueLight}}>{session?.user?.user_metadata?.full_name||session?.user?.email}</div>
            <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginTop:2,color:profile?.role==="admin"?C.gold:profile?.role==="member"?C.lime:C.textDim}}>{profile?.role||"supporter"}</div>
          </div>
          {profile?.role==="admin"&&<button onClick={()=>setShowAdmin(true)} style={{padding:"6px 12px",borderRadius:6,background:"rgba(212,168,67,0.12)",border:"1px solid rgba(212,168,67,0.3)",color:C.gold,fontSize:11,cursor:"pointer",fontWeight:600}}>⚙ Users</button>}
          <button onClick={()=>supabase.auth.signOut()} style={{padding:"6px 12px",borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",fontSize:11,cursor:"pointer"}}>Sign out</button>
        </div>
      </div>
      <div style={{position:"absolute",top:62,left:"50%",transform:"translateX(-50%)",zIndex:100,display:"flex",gap:3,padding:"5px 6px",background:"rgba(10,14,20,0.82)",backdropFilter:"blur(24px) saturate(180%)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)",pointerEvents:"auto"}}>
        {Object.entries(SECTIONS).map(([key,sec])=>{const active=activeSection===key;return(
          <button key={key} onClick={()=>{setActiveSection(active?null:key);setActiveLocation(null);}}
            style={{position:"relative",padding:"7px 13px",borderRadius:8,border:"none",background:active?`linear-gradient(135deg,${sec.color}35,${sec.color}18)`:"transparent",color:active?"#fff":"rgba(255,255,255,0.38)",fontSize:11,fontWeight:active?700:500,letterSpacing:0.5,textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",boxShadow:active?`0 0 0 1px ${sec.color}55`:"none",outline:"none"}}>
            <span style={{marginRight:5}}>{sec.icon}</span>{sec.label}
            {active&&<span style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:sec.color,boxShadow:`0 0 6px ${sec.color}`}}/>}
          </button>);
        })}
      </div>
      {activeSection&&(
        <div style={{position:"absolute",top:110,left:16,bottom:24,width:248,zIndex:100,pointerEvents:"auto",display:"flex",flexDirection:"column",background:"rgba(10,14,20,0.85)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",overflow:"hidden"}}>
          <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div>
              <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:SECTIONS[activeSection].color,fontWeight:700,marginBottom:3}}>{SECTIONS[activeSection].icon} {SECTIONS[activeSection].label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{SECTIONS[activeSection].subsections.length} locations</div>
            </div>
            <button onClick={()=>{setActiveSection(null);setActiveLocation(null);}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,color:"rgba(255,255,255,0.4)",width:26,height:26,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div className="sb-scroll" style={{overflowY:"auto",flex:1,padding:"6px 0"}}>
            {SECTIONS[activeSection].subsections.map((sub,i)=>{const isA=activeLocation?.id===sub.id,sec=SECTIONS[activeSection];return(
              <button key={sub.id} className="loc-btn" onClick={()=>selectLocation({...sub,sectionKey:activeSection,sectionColor:sec.color,sectionIcon:sec.icon,sectionLabel:sec.label})}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",border:"none",background:isA?sec.color+"18":"transparent",borderLeft:isA?`2px solid ${sec.color}`:"2px solid transparent",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:isA?sec.color+"30":"rgba(255,255,255,0.05)",border:"1px solid "+(isA?sec.color+"60":"rgba(255,255,255,0.1)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:isA?sec.color:"rgba(255,255,255,0.3)",fontWeight:700}}>{i+1}</div>
                <span style={{fontSize:12,color:isA?"#fff":"rgba(255,255,255,0.55)",fontWeight:isA?600:400,lineHeight:1.3}}>{sub.name}</span>
              </button>);
            })}
          </div>
        </div>
      )}
      {mapReady&&showWelcome&&!activeLocation&&(
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:150,textAlign:"center",padding:"36px 40px",maxWidth:420,background:C.bgCard,backdropFilter:"blur(20px)",border:"1px solid "+C.border,borderRadius:12,backgroundImage:`radial-gradient(ellipse at 50% 0%, ${C.blue}10 0%, transparent 60%)`}}>
          <h3 style={{fontFamily:"Roboto Slab,serif",fontSize:22,color:C.text,margin:"0 0 10px",fontWeight:900}}>Welcome to <span style={{color:C.gold}}>Ullo</span></h3>
          <p style={{color:C.textMuted,fontSize:13,lineHeight:1.7}}>3D labels appear on the 15 confirmed GPS locations. Billboard sprites always face you and stay pinned to each coordinate as you orbit and zoom.</p>
          <button onClick={()=>setShowWelcome(false)} style={{marginTop:20,padding:"10px 28px",background:C.blue,border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer"}}>Start Exploring</button>
        </div>
      )}
      <div style={{position:"absolute",bottom:24,left:activeSection?280:24,zIndex:100,display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:C.bgCard,backdropFilter:"blur(12px)",border:"1px solid "+C.border,borderRadius:6,pointerEvents:"auto",transition:"left 0.3s"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:"pulseGlow 2s infinite"}}/>
        <span style={{color:C.textMuted,fontSize:12}}><span style={{color:C.gold,fontWeight:700}}>{visibleLocs.length}</span> locations{activeSection&&<span style={{color:C.textDim}}> · {SECTIONS[activeSection].label}</span>}</span>
      </div>
      <div style={{position:"absolute",bottom:24,right:24,zIndex:100,pointerEvents:"auto"}}>
        <button onClick={()=>map3dRef.current?.flyCameraTo({endCamera:{center:{lat:WORLD_LAT,lng:WORLD_LNG,altitude:0},range:1500,tilt:55,heading:0},durationMillis:1500})}
          style={{padding:"8px 14px",borderRadius:6,background:C.bgCard,border:"1px solid "+C.border,color:C.blueLight,fontSize:11,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",cursor:"pointer"}}>
          🏠 Reset View
        </button>
      </div>
      <div onClick={()=>{setActiveLocation(null);threeRef.current?.setActiveLocation(null);}} style={{position:"absolute",inset:0,zIndex:500,background:activeLocation?"rgba(0,0,0,0.35)":"transparent",pointerEvents:activeLocation?"auto":"none",transition:"background 0.4s"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:501,maxHeight:"80vh",background:C.bgCard,backdropFilter:"blur(24px)",borderTop:`2px solid ${C.blue}55`,borderRadius:"16px 16px 0 0",transform:activeLocation?"translateY(0)":"translateY(100%)",transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1)",overflow:"hidden",display:"flex",flexDirection:"column",backgroundImage:`radial-gradient(ellipse at 50% 0%, ${C.blue}08 0%, transparent 40%)`}}>
        {activeLocation&&(<>
          <div style={{width:40,height:4,borderRadius:2,background:C.borderSubtle,margin:"10px auto 0",flexShrink:0}}/>
          <div style={{padding:"12px 20px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexShrink:0}}>
            <div>
              <span style={{display:"inline-block",padding:"3px 10px",borderRadius:4,border:`1px solid ${(activeLocation.sectionColor||C.blue)}33`,background:`${(activeLocation.sectionColor||C.blue)}12`,color:(activeLocation.sectionColor||C.blue),fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{activeLocation.sectionIcon} {activeLocation.sectionLabel}</span>
              <h2 style={{fontFamily:"Roboto Slab,serif",fontSize:24,fontWeight:900,color:C.text,lineHeight:1.2}}>{activeLocation.name}</h2>
            </div>
            <button onClick={()=>{setActiveLocation(null);threeRef.current?.setActiveLocation(null);}} style={{width:34,height:34,borderRadius:"50%",border:"1px solid "+C.borderSubtle,background:C.surface,color:C.text,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginLeft:12}}>✕</button>
          </div>
          <div style={{padding:"0 20px 20px",overflowY:"auto",flex:1}}>
            <p style={{color:C.textDim,fontSize:11,fontFamily:"monospace",marginBottom:12}}>📍 {activeLocation.lat.toFixed(4)}°N, {Math.abs(activeLocation.lng).toFixed(4)}°W · Jirapa District, Upper West Region</p>
            <PanoViewer photoUrl={activeLocation.photoUrl} locationName={activeLocation.name}/>
            {activeLocation.description&&<p style={{color:C.textMuted,fontSize:13,lineHeight:1.8,marginTop:14,whiteSpace:"pre-line"}}>{activeLocation.description}</p>}
            {activeLocation.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{activeLocation.tags.map(tag=>(<span key={tag} style={{padding:"2px 8px",borderRadius:4,fontSize:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.35)"}}>{tag}</span>))}</div>}
            {activeLocation.sectionKey==="boreholes"&&activeLocation.data&&<BoreholeDataCard data={activeLocation.data}/>}
          </div>
          <div style={{display:"flex",gap:8,padding:"10px 20px 14px",borderTop:"1px solid "+C.borderSubtle,flexShrink:0}}>
            <button onClick={()=>navLoc("prev")} style={{flex:1,padding:"9px 16px",borderRadius:6,border:"1px solid "+C.border,background:C.bgPanel,color:C.blueLight,fontSize:12,fontWeight:600,cursor:"pointer"}}>← Previous</button>
            <button onClick={()=>navLoc("next")} style={{flex:1,padding:"9px 16px",borderRadius:6,border:"1px solid "+C.border,background:C.bgPanel,color:C.blueLight,fontSize:12,fontWeight:600,cursor:"pointer"}}>Next →</button>
          </div>
        </>)}
      </div>
      {showAdmin&&<AdminPanel currentUser={session?.user} onClose={()=>setShowAdmin(false)}/>}
    </div>
  );
}
