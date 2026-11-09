import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";
import { createPortal } from "react-dom";
import { C, GLOBAL_CSS } from "./theme";
import { WATER_TESTS, WATER_SITES, WATER_PARAMS, WATER_XLSX_URL } from "./waterTests";

// ─── Constants ───────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Photos and videos load straight from Supabase's CDN rather than being
// relayed through Vercel (faster, and doesn't use Vercel bandwidth).
const MEDIA_BASE = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "") + "/storage/v1/object/public/pano";
function mediaUrl(u) {
  if (!u || !MEDIA_BASE.startsWith("http")) return u;
  if (u.startsWith("/pano/")) return MEDIA_BASE + u.slice(5);
  if (u.startsWith("/drone/")) return MEDIA_BASE + "/drone/" + u.slice(7);
  return u;
}
const WORLD = { lat: 10.6910, lng: -2.5658, altitude: 290 };

// ─── Role Permissions ────────────────────────────────────────────────────────
function canEdit(profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role === "member" && profile.can_edit) return true;
  return false;
}
function canUpload(profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role === "member" && profile.can_upload) return true;
  return false;
}
function isAdmin(profile) {
  return profile?.role === "admin";
}

// Palette and component styles live in theme.js

// ─── Location Data ───────────────────────────────────────────────────────────
const SECTIONS = {
  community:{label:"Community",icon:"",color:"#D4A843",subsections:[
    {id:"cm1",lodTier:1,name:"Ullo",             photoUrl:"",lat:10.6910,lng:-2.5658,labelScale:3.0,realCoords:true,minRange:2800,description:"",tags:[]},
    {id:"cm2",lodTier:2,name:"Elementary School",photoUrl:"",lat:10.6931,lng:-2.5699,labelScale:1.2,realCoords:true,description:"Ullo Elementary School",tags:[]},
    {id:"cm7",lodTier:3,markerColor:"#60A5FA",name:"Elementary School Borehole",photoUrl:"/pano/elementary_school_borehole/IMG_20260103_030445_00_096.jpg",photoUrls:[
      {url:"/pano/elementary_school_borehole/IMG_20260103_030445_00_096.jpg",yaw:8.7,pitch:-7.4,hfov:120},
      {url:"/pano/elementary_school_borehole/IMG_20260103_030502_00_097.jpg",yaw:-9,pitch:-18.4,hfov:110},
      {url:"/pano/elementary_school_borehole/IMG_20260103_030527_00_098.jpg",yaw:0.4,pitch:-13.6,hfov:120},
      {url:"/pano/elementary_school_borehole/IMG_20260103_030547_00_099.jpg",yaw:-24.9,pitch:-21.3,hfov:120},
    ],lat:10.6934,lng:-2.5699,realCoords:true,description:"Elementary School's Borehole.",tags:["#borehole","#handpump"],data:{pump_type:"Hand pump"},videoUrls:["/pano/elementary_school_borehole/VID_20260103_030601_00_100.mp4"]},
    {id:"cm3",lodTier:1,name:"Dante Dam",       photoUrl:"",lat:10.6928,lng:-2.5607,labelScale:1.5,realCoords:true,description:"The Ullo Dante Dam is a completed water infrastructure project developed in partnership with the community of Ullo Ghana. Designed to capture and store rainwater during the wet season, providing a reliable water source for agriculture and community use throughout the dry season.",tags:["#ullodam","#waterinfrastructure"]},
    {id:"cm4",lodTier:3,markerColor:"#60A5FA",name:"Islamic School Borehole",   photoUrl:"/pano/islamic_school_borehole/IMG_20260101_075736_00_016.jpg",photoUrls:[
      {url:"/pano/islamic_school_borehole/IMG_20260101_075736_00_016.jpg",yaw:-2,pitch:9.2,hfov:120},
      {url:"/pano/islamic_school_borehole/IMG_20260101_075817_00_017.jpg",yaw:4.2,pitch:5.9,hfov:110},
      {url:"/pano/islamic_school_borehole/IMG_20260101_075853_00_018.jpg",yaw:30.6,pitch:4.8,hfov:110},
      {url:"/pano/islamic_school_borehole/IMG_20260101_075920_00_019.jpg",yaw:-2.4,pitch:-19.1,hfov:120},
      {url:"/pano/islamic_school_borehole/IMG_20260101_075934_00_020.jpg",yaw:-6.1,pitch:-19.3,hfov:110},
      {url:"/pano/islamic_school_borehole/IMG_20260101_075950_00_021.jpg",yaw:-13.4,pitch:-15.2,hfov:110},
    ],lat:10.6875,lng:-2.5587,realCoords:true,description:"Islamic Elementary School Borehole.",tags:["#borehole","#handpump"],data:{pump_type:"Hand pump",flow_wet:9.6,ph:6.8,ec:216,tds:108},videoUrls:["/pano/islamic_school_borehole/VID_20260101_080053_00_022.mp4"]},
    {id:"cm5",lodTier:1,markerColor:"#60A5FA",name:"Sama Yiri Solar Borehole",  photoUrl:"/pano/sama_yiri_solar_borehole/IMG_20260101_083208_00_024.jpg",photoUrls:[
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083208_00_024.jpg",yaw:1.7,pitch:15.9,hfov:120},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083222_00_025.jpg",yaw:-7.1,pitch:-5.7,hfov:110},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083246_00_026.jpg",yaw:-9.4,pitch:13,hfov:110},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083306_00_027.jpg",yaw:-5.7,pitch:-7,hfov:110},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083330_00_028.jpg",yaw:-3.7,pitch:12.8,hfov:110},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083345_00_029.jpg",yaw:-7.3,pitch:-7.7,hfov:110},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083407_00_030.jpg",yaw:4.4,pitch:-0.9,hfov:120},
      {url:"/pano/sama_yiri_solar_borehole/IMG_20260101_083423_00_031.jpg",yaw:-2.4,pitch:17.6,hfov:120},
    ],lat:10.6829,lng:-2.5563,realCoords:true,description:"Sama Yiri borehole solar panels and electric pump were installed in 2019. It has been the main water supply for the school's water distribution system.",tags:["#borehole","#solarborehole"],data:{pump_type:"Solar electric pump",flow_wet:10.4,ph:7.1,ec:234,tds:117},videoUrls:["/pano/sama_yiri_solar_borehole/VID_20260101_083003_00_023.mp4"]},
    {id:"cm6",lodTier:3,markerColor:"#60A5FA",name:"Rotary Borehole",           photoUrl:"/pano/rotary_borehole/IMG_20260101_094600_00_036.jpg",photoUrls:[
      {url:"/pano/rotary_borehole/IMG_20260101_094600_00_036.jpg",yaw:-14.2,pitch:10.6,hfov:110},
      {url:"/pano/rotary_borehole/IMG_20260101_094616_00_037.jpg",yaw:-11.3,pitch:-10.2,hfov:110},
      {url:"/pano/rotary_borehole/IMG_20260101_094633_00_038.jpg",yaw:-0.1,pitch:8.6,hfov:110},
      {url:"/pano/rotary_borehole/IMG_20260101_094649_00_039.jpg",yaw:-0.8,pitch:-18.5,hfov:110},
      {url:"/pano/rotary_borehole/IMG_20260101_094712_00_040.jpg",yaw:-7.7,pitch:10,hfov:120},
      {url:"/pano/rotary_borehole/IMG_20260101_094725_00_041.jpg",yaw:-6.7,pitch:-21.7,hfov:110},
      {url:"/pano/rotary_borehole/IMG_20260101_094747_00_042.jpg",yaw:-5,pitch:0.6,hfov:110},
    ],lat:10.6918,lng:-2.5634,realCoords:true,description:"",tags:["#borehole"],data:{pump_type:"Hand pump"},videoUrls:["/pano/rotary_borehole/VID_20260101_094822_00_043.mp4"]},
    {id:"cm8",lodTier:2,markerColor:"#60A5FA",name:"Baazu Borehole",            photoUrl:"/pano/baazu_borehole/IMG_20260107_091020_00_197.jpg",photoUrls:[
      {url:"/pano/baazu_borehole/IMG_20260107_091020_00_197.jpg",yaw:5.2,pitch:-16.9,hfov:120},
      {url:"/pano/baazu_borehole/IMG_20260107_091033_00_198.jpg",yaw:-1.2,pitch:-11.7,hfov:120},
      {url:"/pano/baazu_borehole/IMG_20260107_091051_00_199.jpg",yaw:4.6,pitch:-4.7,hfov:110},
      {url:"/pano/baazu_borehole/IMG_20260107_091107_00_200.jpg",yaw:-9.3,pitch:-9,hfov:110},
    ],lat:10.6881,lng:-2.5631,realCoords:true,description:"Borehole which supplies community members east of the Ullo Senior High School.",tags:["#borehole","#handpump"],data:{pump_type:"Hand pump"},videoUrls:["/pano/baazu_borehole/VID_20260107_091118_00_201.mp4"]},
    {id:"cm9",lodTier:3,name:"Guinness Water Tower",      photoUrl:"/pano/guiness_water_tower/IMG_20260101_091149_00_032.jpg",photoUrls:[
      {url:"/pano/guiness_water_tower/IMG_20260101_091149_00_032.jpg",yaw:3.6,pitch:19.7,hfov:110},
      {url:"/pano/guiness_water_tower/IMG_20260101_091202_00_033.jpg",yaw:3.7,pitch:9.2,hfov:120},
      {url:"/pano/guiness_water_tower/IMG_20260101_091238_00_034.jpg",yaw:1.1,pitch:17.2,hfov:110},
      {url:"/pano/guiness_water_tower/IMG_20260101_091252_00_035.jpg",yaw:7.5,pitch:3,hfov:120},
    ],lat:10.6905,lng:-2.5605,realCoords:true,description:"Water tower implemented by Guinness Foundation.",tags:["#watertower"]},
    {id:"cm10",lodTier:3,name:"Bridge Site",               photoUrl:"/pano/spillway_bridge_location/IMG_20260102_094725_00_087.jpg",photoUrls:[
      {url:"/pano/spillway_bridge_location/IMG_20260102_094725_00_087.jpg",yaw:-1.4,pitch:-16.1,hfov:120},
      {url:"/pano/spillway_bridge_location/IMG_20260102_094754_00_088.jpg",yaw:0,pitch:-8.3,hfov:120},
      {url:"/pano/spillway_bridge_location/IMG_20260102_094818_00_089.jpg",yaw:3,pitch:-3.1,hfov:73},
      {url:"/pano/spillway_bridge_location/IMG_20260102_095004_00_090.jpg",yaw:0,pitch:-8.3,hfov:88},
      {url:"/pano/spillway_bridge_location/IMG_20260102_095029_00_091.jpg",yaw:-30.4,pitch:-5.7,hfov:110},
      {url:"/pano/spillway_bridge_location/IMG_20260102_095052_00_092.jpg",yaw:-29.8,pitch:-2.7,hfov:110},
      {url:"/pano/spillway_bridge_location/IMG_20260102_095216_00_093.jpg",yaw:-128.2,pitch:-24.3,hfov:110},
      {url:"/pano/spillway_bridge_location/IMG_20260102_095242_00_094.jpg",yaw:172.3,pitch:-12.6,hfov:110},
    ],lat:10.6785,lng:-2.5575,realCoords:true,description:"",tags:[],videoUrls:["/pano/spillway_bridge_location/VID_20260102_095336_00_095.mp4"]},
    {id:"cm11",lodTier:3,name:"GHS Water Tower",           photoUrl:"/pano/ghs_watertower/IMG_20260110_092714_00_204.jpg",photoUrls:[
      {url:"/pano/ghs_watertower/IMG_20260110_092714_00_204.jpg",yaw:0.6,pitch:15,hfov:120},
      {url:"/pano/ghs_watertower/IMG_20260110_092735_00_205.jpg",yaw:5.5,pitch:43.2,hfov:120},
      {url:"/pano/ghs_watertower/IMG_20260110_092755_00_206.jpg",yaw:-6.5,pitch:36.7,hfov:120},
      {url:"/pano/ghs_watertower/IMG_20260110_092815_00_207.jpg",yaw:-10.9,pitch:27,hfov:120},
    ],lat:10.6921,lng:-2.5572,realCoords:true,description:"",tags:[]},
    {id:"cm12",lodTier:3,name:"Kindergarten",              photoUrl:"/pano/kindergarden/IMG_20260107_051704_00_190.jpg",photoUrls:[
      {url:"/pano/kindergarden/IMG_20260107_051704_00_190.jpg",yaw:-9.9,pitch:3.3,hfov:84},
      {url:"/pano/kindergarden/IMG_20260107_051727_00_191.jpg",yaw:-14.7,pitch:3.7,hfov:120},
      {url:"/pano/kindergarden/IMG_20260107_051804_00_192.jpg",yaw:4.5,pitch:10,hfov:110},
      {url:"/pano/kindergarden/IMG_20260107_051826_00_193.jpg",yaw:-10.9,pitch:3.9,hfov:120},
      {url:"/pano/kindergarden/IMG_20260107_051850_00_194.jpg",yaw:113.8,pitch:6.9,hfov:120},
      {url:"/pano/kindergarden/IMG_20260107_052000_00_195.jpg",yaw:-88.3,pitch:-1.9,hfov:120},
    ],lat:10.6925,lng:-2.5734,realCoords:true,description:"",tags:[],videoUrls:["/pano/kindergarden/VID_20260107_052035_00_196(1).mp4"]},
  ]},
  school:{label:"Senior High School",icon:"",color:"#6B9EE8",subsections:[
    {id:"sh1",lodTier:3, name:"USHS Entrance",            photoUrl:"",lat:10.6910,lng:-2.5657,realCoords:true,description:"Classic Ullo Senior High School sign!",tags:["#ulloseniorhighschool"]},
    {id:"sh2",lodTier:3,markerColor:"#60A5FA",name:"Gate Borehole",             photoUrl:"/pano/gate_borehole/IMG_20260102_034648_00_044.jpg",photoUrls:[
      {url:"/pano/gate_borehole/IMG_20260102_034648_00_044.jpg",yaw:0,pitch:0,hfov:110},
      {url:"/pano/gate_borehole/IMG_20260102_034736_00_045.jpg",yaw:0.1,pitch:-1.8,hfov:110},
      {url:"/pano/gate_borehole/IMG_20260102_034754_00_046.jpg",yaw:-0.3,pitch:-2.8,hfov:110},
      {url:"/pano/gate_borehole/IMG_20260102_034816_00_047.jpg",yaw:0,pitch:0,hfov:110},
      {url:"/pano/gate_borehole/IMG_20260102_034914_00_048.jpg",yaw:15.7,pitch:-2.7,hfov:110},
    ],lat:10.6908,lng:-2.5663,realCoords:true,description:"The gate borehole found by the main gate inside the senior high school. Electrified since February 2025 using grid power.",tags:["#gridpower","#ulloseniorhighschool"],data:{pump_type:"Grid power pump",water_height:15.1},videoUrls:["/pano/gate_borehole/VID_20260102_034926_00_049.mp4","/pano/gate_borehole/VID_20260102_035016_00_050.mp4","/pano/gate_borehole/VID_20260102_035038_00_051.mp4"]},
    {id:"sh3",lodTier:2,markerColor:"#9CA3AF",name:"Kitchen - Ullo Senior HS",  photoUrl:"/pano/kitchen/IMG_20260102_041838_00_058.jpg",photoUrls:[
      {url:"/pano/kitchen/IMG_20260102_041838_00_058.jpg",yaw:11.1,pitch:0.2,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_041859_00_059.jpg",yaw:18.3,pitch:0.7,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_041920_00_060.jpg",yaw:-1.1,pitch:-3.2,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042001_00_061.jpg",yaw:0,pitch:0,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042022_00_062.jpg",yaw:-1.7,pitch:-3.8,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042046_00_063.jpg",yaw:4,pitch:-1.1,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042108_00_064.jpg",yaw:-13.1,pitch:-5.9,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042131_00_065.jpg",yaw:1,pitch:0.2,hfov:110},
      {url:"/pano/kitchen/IMG_20260102_042153_00_066.jpg",yaw:2.5,pitch:-17.8,hfov:120},
      {url:"/pano/kitchen/IMG_20260102_042213_00_067.jpg",yaw:1,pitch:-13.8,hfov:120},
      {url:"/pano/kitchen/IMG_20260102_042529_00_070.jpg",yaw:-35.2,pitch:-4.2,hfov:110},
    ],lat:10.6894,lng:-2.5661,realCoords:true,description:"The Ullo Senior High School's kitchen provides students with 3 meals per day with food preparation beginning at 5:30 AM. The kitchen staff use both traditional clay and cement pots designed by KNUST and Iowa State University's Engineers Without Borders Chapter. ISU's EWB ASHRAE team installed 2 solar water heaters providing on demand hot water ranging from 40-70°F.",tags:["#ulloseniorhighschool","#solarpower","#gridpower"],videoUrls:["/pano/kitchen/VID_20260102_042327_00_068.mp4"]},
    {id:"sh4",lodTier:3,markerColor:"#4ADE80",name:"Male Dormitory",    photoUrl:"",lat:10.6892,lng:-2.5683,realCoords:true,description:"Male Student dormitory on campus. In summer 2025 the Clinic Electric Team in partnership with ASHRAE installed lighting and ceiling fans. Led by Sam Flynn, Bryan York, and Sam Stinson from Design Engineers (DE).",tags:["#ulloseniorhighschool","#solarpower","#gridpower"]},
    {id:"sh5",lodTier:3,markerColor:"#C084FC",name:"Male Pit Latrines",         photoUrl:"/pano/male_pit_latrine/IMG_20260102_035909_00_052.jpg",photoUrls:[
      {url:"/pano/male_pit_latrine/IMG_20260102_035909_00_052.jpg",yaw:-1,pitch:6,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260102_035950_00_053.jpg",yaw:0.7,pitch:10.2,hfov:110},
      {url:"/pano/male_pit_latrine/IMG_20260102_040013_00_054.jpg",yaw:-9.2,pitch:13.3,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260102_040055_00_055.jpg",yaw:2.4,pitch:10.4,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260102_040124_00_056.jpg",yaw:-3.1,pitch:6.6,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260107_043708_00_185.jpg",yaw:-4.9,pitch:1.5,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260107_043740_00_186.jpg",yaw:-8.6,pitch:5.1,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260107_043800_00_187.jpg",yaw:0.1,pitch:2.8,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260107_043831_00_188.jpg",yaw:4.6,pitch:0.9,hfov:120},
      {url:"/pano/male_pit_latrine/IMG_20260108_082945_00_203.jpg",yaw:-31.3,pitch:-8.4,hfov:120},
    ],lat:10.6892,lng:-2.5685,realCoords:true,description:"The winter 2025 Travel Team installed both pit latrines in January 2026. Led by Jenna Hellman and team lead John Beuter.",tags:["#ulloseniorhighschool","#latrine"],videoUrls:["/pano/male_pit_latrine/VID_20260102_040140_00_057.mp4","/pano/male_pit_latrine/VID_20260107_043934_00_189.mp4"]},
    {id:"sh6",lodTier:3,markerColor:"#60A5FA",name:"Male Dormitory Water Tanks",photoUrl:"",lat:10.6891,lng:-2.5680,realCoords:true,description:"",tags:["#ulloseniorhighschool","#polytank"]},
    {id:"sh7",lodTier:3,markerColor:"#60A5FA",name:"School Solar Borehole 2024",photoUrl:"/pano/solar_borehole_2024/IMG_20260102_050129_00_077.jpg",photoUrls:[
      {url:"/pano/solar_borehole_2024/IMG_20260102_050129_00_077.jpg",yaw:-1.5,pitch:4,hfov:112},
      {url:"/pano/solar_borehole_2024/IMG_20260102_050156_00_078.jpg",yaw:-4.9,pitch:1.7,hfov:120},
      {url:"/pano/solar_borehole_2024/IMG_20260102_050222_00_079.jpg",yaw:9,pitch:2.1,hfov:120},
      {url:"/pano/solar_borehole_2024/IMG_20260102_050246_00_080.jpg",yaw:-8.1,pitch:4,hfov:120},
    ],lat:10.6896,lng:-2.5706,realCoords:true,description:"The winter 2024 Travel Team installed an electrical pump and solar panel. Water feeds into the main systems supporting the Kitchen Solar Water Heaters and female dormitory. Led by John Beuter and team lead Brian Cacioppo.",tags:["#ulloseniorhighschool","#borehole","#solarpower"],data:{pump_type:"Solar electric pump"},videoUrls:["/pano/solar_borehole_2024/VID_20260102_050307_00_081.mp4"]},
    {id:"sh8",lodTier:3,markerColor:"#C084FC",name:"Female Pit Latrine 2023",   photoUrl:"/pano/female_pit_latrine_2023/IMG_20260102_052823_00_082.jpg",photoUrls:[
      {url:"/pano/female_pit_latrine_2023/IMG_20260102_052823_00_082.jpg",yaw:-0.6,pitch:1.7,hfov:120},
      {url:"/pano/female_pit_latrine_2023/IMG_20260102_052850_00_083.jpg",yaw:0.4,pitch:2.3,hfov:120},
      {url:"/pano/female_pit_latrine_2023/IMG_20260102_052914_00_084.jpg",yaw:-1,pitch:3.3,hfov:120},
      {url:"/pano/female_pit_latrine_2023/IMG_20260102_052943_00_085.jpg",yaw:1.5,pitch:5.9,hfov:120},
    ],lat:10.6863,lng:-2.5672,realCoords:true,description:"The winter 2023 Travel Team installed a pit latrine for the female students on campus.",tags:["#ulloseniorhighschool","#latrine"],videoUrls:["/pano/female_pit_latrine_2023/VID_20260102_053004_00_086.mp4"]},
    {id:"sh9",lodTier:3,markerColor:"#C084FC",name:"Female Pit Latrine 2024",   photoUrl:"/pano/female_pit_latrine_2024/IMG_20260101_034848_00_004.jpg",photoUrls:[
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_034848_00_004.jpg",yaw:-65.5,pitch:8.5,hfov:120},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041619_00_008.jpg",yaw:-11.0,pitch:-2.2,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041743_00_009.jpg",yaw:-15.6,pitch:-6.5,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041812_00_010.jpg",yaw:-10.0,pitch:0.8,hfov:110},
      {url:"/pano/female_pit_latrine_2024/IMG_20260101_041833_00_011.jpg",yaw:-7.9,pitch:-2.0,hfov:110},
    ],lat:10.6883,lng:-2.5667,realCoords:true,description:"The winter 2024 Travel Team installed a pit latrine. Led by Bryan Cacioppo, Kayla Worachek, Arissa Kramer, Sarah Broeker, and community partners Paul and Justin.",tags:["#ulloseniorhighschool","#latrine"]},
    {id:"sh10",lodTier:3,markerColor:"#4ADE80",name:"Female Dormitory",  photoUrl:"",lat:10.6882,lng:-2.5663,realCoords:true,description:"",tags:["#ulloseniorhighschool"]},
    {id:"sh11",lodTier:3,markerColor:"#60A5FA",name:"Female Poly Tank",          photoUrl:"/pano/female_poly_tanks/IMG_20260101_043756_00_013.jpg",photoUrls:[
      {url:"/pano/female_poly_tanks/IMG_20260101_043756_00_013.jpg",yaw:5.4,pitch:1.7,hfov:120},
      {url:"/pano/female_poly_tanks/IMG_20260101_043918_00_014.jpg",yaw:0.9,pitch:-8.1,hfov:120},
      {url:"/pano/female_poly_tanks/IMG_20260101_043930_00_015.jpg",yaw:1.3,pitch:1.3,hfov:120},
    ],lat:10.6881,lng:-2.5662,realCoords:true,description:"Three PolyTanks which supply the female students with water.",tags:["#ulloseniorhighschool","#polytank"]},
  ]},
  water:{label:"Water Distribution",icon:"",color:"#3BA8C4",subsections:[
    {id:"w1",name:"Sama Yiri",             photoUrl:"",lat:10.6912,lng:-2.5660,realCoords:false,description:"",tags:[]},
    {id:"w2",name:"Polytank – Kitchen",   photoUrl:"",lat:10.6914,lng:-2.5662,realCoords:false,description:"",tags:[]},
    {id:"w3",name:"Polytank – Girls Dorm",photoUrl:"",lat:10.6916,lng:-2.5655,realCoords:false,description:"",tags:[]},
    {id:"w4",name:"Polytank – Boys Dorm", photoUrl:"",lat:10.6918,lng:-2.5650,realCoords:false,description:"",tags:[]},
    {id:"w5",name:"Polytank – Bungalow 1",photoUrl:"",lat:10.6908,lng:-2.5645,realCoords:false,description:"",tags:[]},
    {id:"w6",name:"Polytank – Bungalow 2",photoUrl:"",lat:10.6906,lng:-2.5640,realCoords:false,description:"",tags:[]},
    {id:"w7",name:"Main Line",             photoUrl:"",lat:10.6920,lng:-2.5670,realCoords:false,description:"",tags:[]},
    {id:"w8",name:"School Line",           photoUrl:"",lat:10.6922,lng:-2.5675,realCoords:false,description:"",tags:[]},
  ]},
  boreholes:{label:"Boreholes",icon:"",color:"#60A5FA",subsections:[
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
  latrines:{label:"Latrines",icon:"",color:"#C084FC",subsections:[
    {id:"l1",name:"2023 Latrine S. Campus",photoUrl:"",lat:10.6863,lng:-2.5672,realCoords:false,description:"",tags:[]},
    {id:"l2",name:"Girls Latrine",          photoUrl:"",lat:10.6883,lng:-2.5667,realCoords:false,description:"",tags:[]},
    {id:"l3",name:"Boys Latrine 1",         photoUrl:"",lat:10.6892,lng:-2.5685,realCoords:false,description:"",tags:[]},
    {id:"l4",name:"Boys Latrine 2",         photoUrl:"",lat:10.6916,lng:-2.5650,realCoords:false,description:"",tags:[]},
  ]},
  clinic:{label:"Clinic",icon:"",color:"#E8913A",subsections:[
    {id:"c1",lodTier:1,name:"Ullo Clinic Site",photoUrl:"/pano/clinic_site/IMG_20260103_093405_00_112.jpg",photoUrls:[
      {url:"/pano/clinic_site/IMG_20260103_093405_00_112.jpg",yaw:1.4,pitch:-3.2,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093558_00_113.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093654_00_114.jpg",yaw:80.2,pitch:1.4,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093716_00_115.jpg",yaw:144.2,pitch:-5.6,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093736_00_116.jpg",yaw:156.2,pitch:-9.4,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093756_00_117.jpg",yaw:-124.9,pitch:-0.1,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093819_00_118.jpg",yaw:115,pitch:-5.7,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093846_00_119.jpg",yaw:-175,pitch:3.5,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093904_00_120.jpg",yaw:104.1,pitch:-1.5,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093926_00_121.jpg",yaw:100.4,pitch:-2.9,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_093950_00_122.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094013_00_123.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094031_00_124.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094103_00_125.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094153_00_126.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094254_00_127.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094314_00_128.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094332_00_129.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094353_00_130.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094414_00_131.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094436_00_132.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094500_00_133.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094520_00_134.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094541_00_135.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094603_00_136.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_094649_00_137.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095120_00_138.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095147_00_139.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095205_00_140.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095228_00_141.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095247_00_142.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095312_00_143.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095348_00_144.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095416_00_145.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095438_00_146.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095500_00_147.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095528_00_148.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095552_00_149.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095616_00_150.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095643_00_151.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095710_00_152.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095729_00_153.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095757_00_154.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095822_00_155.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095843_00_156.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095908_00_157.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_095935_00_158.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100018_00_159.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100107_00_160.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100205_00_161.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100254_00_162.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100502_00_163.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100524_00_164.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100545_00_165.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100611_00_166.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100633_00_167.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100655_00_168.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100715_00_169.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_100745_00_170.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101011_00_171.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101034_00_172.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101135_00_173.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101215_00_174.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101241_00_175.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260103_101304_00_176.jpg",yaw:0,pitch:0,hfov:120},
      {url:"/pano/clinic_site/IMG_20260111_040643_00_208.jpg",yaw:-20.9,pitch:1.9,hfov:120},
      {url:"/pano/clinic_site/IMG_20260111_040702_00_209.jpg",yaw:0,pitch:0,hfov:110},
      {url:"/pano/clinic_site/IMG_20260111_040734_00_210.jpg",yaw:19,pitch:8.1,hfov:120},
    ],lat:10.6876,lng:-2.5617,altitude:284,labelScale:1.8,realCoords:true,description:"The Ullo Health Clinic is the largest project to date, currently being designed by the Clinic MEP team. Once completed, the clinic will serve approximately 15,000 people in Ullo and the surrounding area. Construction is underway with walls completed; EWB-ISU is actively fundraising for the roof installation.",tags:["#clinic"],videoUrls:["/pano/clinic_site/VID_20260103_101552_00_178.mp4","/pano/clinic_site/VID_20260111_040746_00_211.mp4"]},
    {id:"c2",lodTier:2,name:"Ullo Clinic",     photoUrl:"",lat:10.6922,lng:-2.5578,realCoords:true,description:"Current clinic serving the community.",tags:["#clinic"]},
  ]},
};

const ALL_LOCATIONS = Object.entries(SECTIONS).flatMap(([sk, sec]) =>
  sec.subsections.map(sub => ({ ...sub, droneVideoUrl: "/drone/" + sub.id + ".m4v", sectionKey: sk, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label }))
);
const LABELED_LOCATIONS = ALL_LOCATIONS.filter(l => l.realCoords);

// ─── Focus Mode label helpers ────────────────────────────────────────────────
// Google Maps release channel. 3D Maps is in the stable "weekly" channel.
// If markers or labels misbehave, try "beta"; "alpha" shows a dev-only banner.
const MAPS_CHANNEL = "weekly";

// ── Map label rendering ──
// The 3D map draws <img> labels at their raw pixel size, so pixel density and
// on-map size are tied together in "img" mode (2 = the normal label size).
// "svg" mode wraps a 4x-density image in an SVG with an explicit size, which
// may let the map show it sharper at the same size. Flip to "svg" to try it;
// if labels disappear or change size, set it back to "img".
const LABEL_MODE = "svg";
const LABEL_SCALE = 2;                                   // on-map px per design px (raise to ~2.4 for bigger, sharper labels)
const LABEL_DPR = LABEL_MODE === "svg" ? 4 : LABEL_SCALE; // canvas px per design px

function finalizeLabel(cv, dpr) {
  const url = cv.toDataURL("image/png");
  const w = Math.round(cv.width / dpr * LABEL_SCALE), h = Math.round(cv.height / dpr * LABEL_SCALE);
  if (LABEL_MODE === "svg") {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w); svg.setAttribute("height", h);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const im = document.createElementNS(NS, "image");
    im.setAttribute("href", url); im.setAttribute("width", w); im.setAttribute("height", h);
    svg.appendChild(im);
    return svg;
  }
  const img = document.createElement("img");
  img.src = url; img.width = w; img.height = h;
  return img;
}

function buildFocusDot() {
  const DPR = LABEL_DPR, r = 5 * DPR;
  const cv = document.createElement("canvas");
  cv.width = r * 4; cv.height = r * 4;
  const ctx = cv.getContext("2d");
  const cx = cv.width / 2, cy = cv.height / 2;
  // Glow
  const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2);
  grad.addColorStop(0, "rgba(76,144,240,0.55)");
  grad.addColorStop(0.5, "rgba(76,144,240,0.14)");
  grad.addColorStop(1, "rgba(76,144,240,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cv.width, cv.height);
  // Core dot
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#4C90F0";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  return finalizeLabel(cv, DPR);
}

function buildFocusLabel(name) {
  const DPR = LABEL_DPR;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const fontSize = 9 * DPR;
  ctx.font = `600 ${fontSize}px Inter,"Segoe UI",Roboto,Arial,sans-serif`;
  const text = name.toUpperCase();
  const tw = ctx.measureText(text).width;
  const padX = 8 * DPR, padY = 5 * DPR;
  const dotR = 5 * DPR;
  const gap = 5 * DPR;
  const tagW = tw + padX * 2;
  const tagH = fontSize + padY * 2;
  // FIX: pad left so dot sits at the horizontal center of the canvas
  const leftPad = gap + tagW;
  cv.width = leftPad + dotR * 2 + gap + tagW;
  cv.height = Math.max(dotR * 4, tagH);
  const dotCx = leftPad + dotR;
  const cy = cv.height / 2;
  // Glow
  const grad = ctx.createRadialGradient(dotCx, cy, dotR * 0.3, dotCx, cy, dotR * 2);
  grad.addColorStop(0, "rgba(76,144,240,0.55)");
  grad.addColorStop(1, "rgba(76,144,240,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(dotCx - dotR * 2, 0, dotR * 6, cv.height);
  // Core dot
  ctx.beginPath();
  ctx.arc(dotCx, cy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#4C90F0";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Tag bg
  const tx = leftPad + dotR * 2 + gap;
  const ty = (cv.height - tagH) / 2;
  ctx.fillStyle = "rgba(28,33,39,0.92)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, tagW, tagH, 2 * DPR);
  ctx.fill();
  ctx.strokeStyle = "rgba(76,144,240,0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `600 ${fontSize}px Inter,"Segoe UI",Roboto,Arial,sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, tx + padX, cy);
  return finalizeLabel(cv, DPR);
}

function buildCornerTag(name) {
  const DPR = LABEL_DPR;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const fontSize = 9 * DPR;
  ctx.font = `600 ${fontSize}px Inter,"Segoe UI",Roboto,Arial,sans-serif`;
  const text = name.toUpperCase();
  const tw = ctx.measureText(text).width;
  const padX = 8 * DPR, padY = 5 * DPR;
  const dotR = 4 * DPR;
  const gap = 5 * DPR;
  const tagW = tw + padX * 2;
  const tagH = fontSize + padY * 2;
  // FIX: pad left so dot sits at the horizontal center of the canvas
  const leftPad = gap + tagW;
  cv.width = leftPad + dotR * 2 + gap + tagW;
  cv.height = Math.max(dotR * 2, tagH);
  const dotCx = leftPad + dotR;
  const cy = cv.height / 2;
  ctx.beginPath();
  ctx.arc(dotCx, cy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#FBB360";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const tx = leftPad + dotR * 2 + gap;
  const ty = (cv.height - tagH) / 2;
  ctx.fillStyle = "rgba(28,33,39,0.92)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, tagW, tagH, 2 * DPR);
  ctx.fill();
  ctx.strokeStyle = "rgba(251,179,96,0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `600 ${fontSize}px Inter,"Segoe UI",Roboto,Arial,sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, tx + padX, cy);
  return finalizeLabel(cv, DPR);
}

// (label pixel density is set by LABEL_DPR near the top of the label builders)
// ─── Clinic Site Focus Mode data ─────────────────────────────────────────────
const CLINIC_FOCUS_POINTS = [
  {id:"cfp_nw1", name:"NW Corner",              file:"North_West_1.jpg", lat:10.6876335, lng:-2.5625671, alt:284.04, boundary:true, corner:true, markerAlt:15},
  {id:"cfp_nw2", name:"N Perimeter 1",           file:"North_West_2.jpg", lat:10.688203,  lng:-2.5618939, alt:284.04, boundary:true, corner:false, markerAlt:25},
  {id:"cfp_nm1", name:"N Perimeter 2",            file:"North_Mid_1.jpg",  lat:10.6881535, lng:-2.5617053, alt:283.71, boundary:true, corner:false, markerAlt:15},
  {id:"cfp_em1", name:"NE Corner",               file:"East_Mid_1.jpg",   lat:10.6885046, lng:-2.5600391, alt:279.04, boundary:true, corner:true, markerAlt:15},
  {id:"cfp_se1", name:"SE Corner",               file:"South_East_1.jpg", lat:10.6875696, lng:-2.5596246, alt:281.55, boundary:true, corner:true, markerAlt:15},
  {id:"cfp_sm1", name:"S Middle – Wing 1",        file:"South_Mid_1.jpg",  lat:10.6872822, lng:-2.561586,  alt:284.02, boundary:true, corner:false, markerAlt:15},
  {id:"cfp_sw2", name:"S Perimeter 1",            file:"South_West_2.jpg", lat:10.6870691, lng:-2.5616727, alt:284.18, boundary:true, corner:false, markerAlt:25},
  {id:"cfp_sw1", name:"SW Corner",               file:"South_West_1.jpg", lat:10.6872123, lng:-2.5622349, alt:284.23, boundary:true, corner:true, markerAlt:15},
  {id:"cfp_wm1", name:"West – Front",             file:"West_Mid_1.jpg",   lat:10.6875685, lng:-2.5619304, alt:284.04, boundary:true, corner:false, markerAlt:15},
  // Inner points (not part of boundary line)
  {id:"cfp_nm2", name:"NE Corner – Wing 1",       file:"North_Mid_2.jpg",  lat:10.687952,  lng:-2.5615754, alt:283.71, boundary:false, corner:false, markerAlt:35},
  {id:"cfp_nm3", name:"N Middle – Wing 1",        file:"North_Mid_3.jpg",  lat:10.6879282, lng:-2.5616719, alt:283.73, boundary:false, corner:false, markerAlt:15},
  {id:"cfp_nm4", name:"NW Middle – Wing 1",       file:"North_Mid_4.jpg",  lat:10.6879207, lng:-2.5617632, alt:283.44, boundary:false, corner:false, markerAlt:55},
  {id:"cfp_em2", name:"East Mid 2",              file:"East_Mid_2.jpg",   lat:10.6879,    lng:-2.5614,    alt:283.5,  boundary:false, corner:false, markerAlt:45},
];
// Boundary order (clockwise) — indices into CLINIC_FOCUS_POINTS
const CLINIC_BOUNDARY_IDS = ["cfp_nw1","cfp_nw2","cfp_nm1","cfp_em1","cfp_se1","cfp_sm1","cfp_sw2","cfp_sw1","cfp_wm1"];
// Center of clinic site for camera
const CLINIC_CENTER = { lat: 10.6876766, lng: -2.5615968 };

// ─── Label Image Builder ─────────────────────────────────────────────────────
function buildLabelImg(name, sectionLabel, icon, color, scale) {
  // Console-style map callout: slate box, section-colour edge, mono category, sans name.
  const s = Math.max(0.8, Math.min(scale || 1, 1.5));
  const DPR = LABEL_DPR;
  const namePx = Math.round(12.5 * s);
  const metaPx = Math.max(8, Math.round(8 * s));
  const SANS = 'Inter,"Segoe UI",Roboto,Arial,sans-serif';
  const MONO = '"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
  const accent = color || "#4C90F0";
  const meta = (sectionLabel || "ULLO").toUpperCase();

  const tmp = document.createElement("canvas").getContext("2d");
  tmp.font = `700 ${namePx}px ${SANS}`;
  const nameW = tmp.measureText(name).width;
  tmp.font = `600 ${metaPx}px ${MONO}`;
  const metaW = tmp.measureText(meta).width + 12 * s;

  const padL = 11 * s, padR = 9 * s;
  const cw = Math.ceil(Math.max(nameW, metaW) + padL + padR + 2);
  const ch = Math.ceil(36 * s);

  const cv = document.createElement("canvas");
  cv.width = cw * DPR;
  cv.height = ch * DPR;
  const ctx = cv.getContext("2d");
  ctx.scale(DPR, DPR);

  // Box
  ctx.fillStyle = "rgba(20,24,29,0.95)";
  ctx.fillRect(0.5, 0.5, cw - 1, ch - 1);
  ctx.strokeStyle = "rgba(56,62,71,1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);
  // Section-colour edge
  ctx.fillStyle = accent;
  ctx.fillRect(0.5, 0.5, Math.max(2, 3 * s), ch - 1);

  // Category line: small square + mono caps
  ctx.fillStyle = accent;
  ctx.fillRect(padL, 8 * s, 5 * s, 5 * s);
  ctx.font = `600 ${metaPx}px ${MONO}`;
  ctx.fillStyle = "#C5CBD3";
  ctx.textBaseline = "middle";
  ctx.fillText(meta, Math.round(padL + 9 * s), Math.round(10.75 * s));

  // Name
  ctx.font = `700 ${namePx}px ${SANS}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(name, Math.round(padL), Math.round(24.5 * s));

  return finalizeLabel(cv, DPR);
}

// ─── Altitude Stagger (prevents label overlap) ──────────────────────────────
function staggerAltitudes(locations) {
  const THRESH = 0.0012, MIN_ALT = 25;
  const alts = new Array(locations.length).fill(MIN_ALT);
  for (let i = 0; i < locations.length; i++) {
    const neighbors = [];
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(locations[i].lat - locations[j].lat, locations[i].lng - locations[j].lng);
      if (d < THRESH) neighbors.push(alts[j]);
    }
    if (neighbors.length) {
      const used = new Set(neighbors);
      let alt = 50;
      while (used.has(alt)) alt += 50;
      alts[i] = alt;
    }
  }
  return alts;
}

// ─── MarkerManager ───────────────────────────────────────────────────────────
class MarkerManager {
  constructor(map3d, locations, MarkerClass, onSelect) {
    this.map3d = map3d;
    this.locations = locations;
    this.MarkerClass = MarkerClass;
    this.onSelect = onSelect;
    this.altitudes = staggerAltitudes(locations);
    this.live = [];
    this.sectionFilter = null;
    this.frozen = false;
    this.lastRange = -1;
    this.rafId = null;
    this._build();
    this._startLOD();
  }

  static LOD = { 1: Infinity, 2: 2000, 3: 800 };

  _create(loc, idx) {
    const alt = this.altitudes[idx];
    const el = new this.MarkerClass({
      position: { lat: loc.lat, lng: loc.lng, altitude: alt },
      altitudeMode: "RELATIVE_TO_GROUND",
      extruded: true,
    });
    const img = buildLabelImg(loc.name, loc.sectionLabel, loc.sectionIcon, loc.markerColor || loc.sectionColor, loc.labelScale);
    el._lw = +img.getAttribute("width") || img.width || 240; el._lh = +img.getAttribute("height") || img.height || 60; // on-screen size, for the cloud layer
    const tmpl = document.createElement("template");
    tmpl.content.appendChild(img);
    el.appendChild(tmpl);
    el.addEventListener("gmp-click", (e) => { this.onSelect(loc); e.stopPropagation(); });
    return el;
  }

  _build() {
    this._destroyAll();
    for (let i = 0; i < this.locations.length; i++) {
      const loc = this.locations[i];
      const el = this._create(loc, i);
      this.map3d.appendChild(el);
      this.live.push({ el, loc, idx: i, attached: true });
    }
  }

  _destroyAll() {
    for (const m of this.live) {
      try { m.el.remove(); } catch (_) {}
    }
    this.live = [];
  }

  _attach(m) {
    if (!m.attached) { this.map3d.appendChild(m.el); m.attached = true; }
  }
  _detach(m) {
    if (m.attached) { try { m.el.remove(); } catch (_) {} m.attached = false; }
  }

  _applyLOD(range) {
    if (this.frozen) return;
    this.lastRange = range;
    for (const m of this.live) {
      const secOk = !this.sectionFilter || m.loc.sectionKey === this.sectionFilter;
      const tier = m.loc.lodTier ?? 3;
      const vis = secOk && range <= (MarkerManager.LOD[tier] ?? MarkerManager.LOD[3]) && range >= (m.loc.minRange || 0);
      vis ? this._attach(m) : this._detach(m);
    }
  }

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

  setSection(key) {
    this.sectionFilter = key || null;
    if (this.frozen) { this.frozen = false; this._build(); }
    this.lastRange = -1;
    this._applyLOD(this.map3d.range || 1500);
  }

  clearSection() { this.setSection(null); }

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

  restore() {
    this.frozen = false;
    this._build();
    this.lastRange = -1;
    this._applyLOD(this.map3d.range || 1500);
  }

  hideAll() {
    this.frozen = true;
    this._destroyAll();
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._destroyAll();
  }
}

// ─── CameraController ────────────────────────────────────────────────────────
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
// Shared loading card for 360° photos and videos.
// pct = number → progress bar with %, otherwise an animated bar.
function LoadingCard({ title, caption, pct }) {
  const hasPct = typeof pct === "number";
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 6, pointerEvents: "none" }}>
      <div className="px-panel" style={{ width: 260, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</span>
          {hasPct && <span className="px-mono px-muted" style={{ fontSize: 11 }}>{pct}%</span>}
        </div>
        {hasPct
          ? <div style={{ height: 4, background: "var(--line)", borderRadius: 2, overflow: "hidden" }}><div style={{ width: Math.max(3, pct) + "%", height: "100%", background: "var(--blueHi)", transition: "width .3s ease" }} /></div>
          : <div className="px-indet"><div /></div>}
        {caption && <span className="px-mono px-dim" style={{ fontSize: 9.5, letterSpacing: .4 }}>{caption}</span>}
      </div>
    </div>
  );
}

function PanoViewer({ photoUrl, photoUrls, locationName, tall }) {
  const photos = (photoUrls?.length > 0 ? photoUrls : photoUrl ? [photoUrl] : []).map(p =>
    typeof p === "string" ? { url: p, yaw: 0, pitch: 0, hfov: 110 } : { yaw: 0, pitch: 0, hfov: 110, ...p }
  );
  const [idx, setIdx] = useState(0);
  const ref = useRef(null), vRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const coordsRef = useRef(null);
  const overlayRef = useRef(null);
  const liveCoords = useRef({ yaw: 0, pitch: 0, hfov: 110 });
  const [photoStatus, setPhotoStatus] = useState("loading"); // loading | ready | error
  const [photoPct, setPhotoPct] = useState(null);
  const lastPct = useRef(null);
  const photoRun = useRef(0);
  const photo = photos[idx] || null;
  const photoUrl_ = photo?.url || "";
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); }, [locationName]);
  useEffect(() => {
    if (!photoUrl_ || !ref.current) return;
    const p = photos.find(x => x.url === photoUrl_) || { url: photoUrl_, yaw: 0, pitch: 0, hfov: 110 };
    const run = ++photoRun.current;
    const live = () => photoRun.current === run;
    setPhotoStatus("loading"); setPhotoPct(null); lastPct.current = null;
    (async () => {
      if (!document.getElementById("pann-css")) { const l = document.createElement("link"); l.id = "pann-css"; l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"; document.head.appendChild(l); }
      if (!window.pannellum) { await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"; s.onload = r; s.onerror = r; document.head.appendChild(s); setTimeout(r, 20000); }); }
      if (!live()) return;
      if (!window.pannellum) { setPhotoStatus("error"); return; }
      if (vRef.current) vRef.current.destroy();
      vRef.current = window.pannellum.viewer(ref.current, {
        type: "equirectangular", panorama: mediaUrl(p.url), autoLoad: true,
        yaw: p.yaw, pitch: p.pitch, hfov: p.hfov,
        compass: true, showZoomCtrl: true, showFullscreenCtrl: true, title: locationName,
        disableKeyboardCtrl: true, keyboardZoom: false,
      });
      vRef.current.on("load", () => { if (live()) setPhotoStatus("ready"); });
      vRef.current.on("error", (msg) => { if (live()) { console.warn("360 photo failed to load:", p.url, msg); setPhotoStatus("error"); } });
      if (coordsRef.current) cancelAnimationFrame(coordsRef.current);
      const poll = () => {
        if (live() && ref.current) {
          const fill = ref.current.querySelector(".pnlm-lbar-fill");
          const w = fill ? Math.round(parseFloat(fill.style.width) || 0) : 0;
          if (w > 0 && w !== lastPct.current) { lastPct.current = w; setPhotoPct(w); }
        }
        if (vRef.current && overlayRef.current) {
          try {
            const y = Math.round(vRef.current.getYaw() * 10) / 10;
            const p2 = Math.round(vRef.current.getPitch() * 10) / 10;
            const f = Math.round(vRef.current.getHfov());
            liveCoords.current = { yaw: y, pitch: p2, hfov: f };
            overlayRef.current.textContent = `yaw:${y}  pitch:${p2}  hfov:${f}`;
          } catch (_) {}
        }
        coordsRef.current = requestAnimationFrame(poll);
      };
      poll();
    })();
    return () => { if (coordsRef.current) cancelAnimationFrame(coordsRef.current); if (vRef.current) { vRef.current.destroy(); vRef.current = null; } };
  }, [photoUrl_, locationName]);

  // ← / → switch photos. Space does nothing here.
  const photoNav = useRef(null);
  photoNav.current = (d) => { if (photos.length > 1) setIdx(i => (i + d + photos.length) % photos.length); };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (!e.repeat) photoNav.current?.(e.key === "ArrowRight" ? 1 : -1);
      } else if (e.code === "Space" || e.key === " ") {
        if (document.activeElement?.closest?.(".px-frame")) { e.preventDefault(); document.activeElement.blur(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const copyCoords = () => {
    const c = liveCoords.current;
    const text = `{url:"${photoUrl_}",yaw:${c.yaw},pitch:${c.pitch},hfov:${c.hfov}}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  if (!photos.length) return (
    <div className="px-empty" style={{ width: "100%", height: h }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>◌</span>360° photo not yet added
    </div>
  );
  return (
    <div className="px-frame" style={{ height: h }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      {photoStatus === "loading" && <LoadingCard title="Loading photo…" caption="360 files are big" pct={photoPct ?? undefined} />}
      {photoStatus === "error" && (
        <div className="px-empty" style={{ position: "absolute", inset: 0, zIndex: 5, borderStyle: "solid", gap: 8, textAlign: "center", padding: 20 }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>◌</span>Photo not available
        </div>
      )}
      <div className="px-hud" style={{ top: 8, left: 8 }}>
        <span ref={overlayRef}>yaw:0  pitch:0  hfov:110</span>
        <button className="px-btn sm out" style={{ height: 18, padding: "0 6px", fontSize: 9.5 }} onClick={copyCoords}>{copied ? "✓ copied" : "copy"}</button>
      </div>
      {photos.length > 1 && (
        <div className="px-hud" style={{ bottom: 10, left: "50%", transform: "translateX(-50%)", height: 30, padding: "0 3px", gap: 2 }}>
          <button onMouseDown={e => e.preventDefault()} className="px-btn min icon sm" style={{ width: 24, height: 24 }} onClick={() => setIdx((idx - 1 + photos.length) % photos.length)}>←</button>
          <span style={{ minWidth: 54, textAlign: "center", color: "var(--tx)" }}>{String(idx + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
          <button onMouseDown={e => e.preventDefault()} className="px-btn min icon sm" style={{ width: 24, height: 24 }} onClick={() => setIdx((idx + 1) % photos.length)}>→</button>
        </div>
      )}
    </div>
  );
}

// ─── BoreholeDataCard Component ──────────────────────────────────────────────
function BoreholeDataCard({ data }) {
  if (!data) return null;
  const op = data.operational === "Yes", hasWQ = data.ph != null;
  const row = (label, value, unit, warn) => value == null ? null : (
    <tr key={label}><td className="wq-k">{label}</td><td className={"wq-v" + (warn ? " flag" : "")}>{value}</td><td className="wq-u">{unit}</td></tr>
  );
  return (
    <div className="wq wq-card">
      <style>{WQ_CSS}</style>
      <div className="wq-bar">
        <span className="wq-glyph">BH</span>
        <span className="wq-title">Borehole Survey</span>
        <span className="wq-tag" style={{ marginLeft: "auto" }}>JUL 2022</span>
        <span className="wq-tag" style={op ? { color: "#72CA9B", borderColor: "rgba(114,202,155,.35)" } : { color: "#E76A6E", borderColor: "rgba(231,106,110,.4)" }}>{op ? "OPERATIONAL" : "NON-OPERATIONAL"}</span>
      </div>
      <table className="wq-t">
        <thead><tr><th>Property</th><th style={{ textAlign: "right" }}>Value</th><th>Unit</th></tr></thead>
        <tbody>
          <tr className="wq-g"><td colSpan={3}>Infrastructure</td></tr>
          {row("Pump type", data.pump_type, "")}
          {row("Flow rate (wet season)", data.flow_wet, "L/min")}
          {hasWQ && <tr className="wq-g"><td colSpan={3}>Water quality</td></tr>}
          {hasWQ && row("pH", data.ph, "", data.ph < 6.5 || data.ph > 8.5)}
          {hasWQ && row("Total dissolved solids", data.tds, "ppm", data.tds > 500)}
          {hasWQ && row("Electrical conductivity", data.ec, "μS/cm")}
          {hasWQ && row("Total chlorine", data.total_chlorine, "mg/L", data.total_chlorine > 4)}
        </tbody>
      </table>
      {data.notes && <div style={{ padding: "8px 10px", fontSize: 11.5, lineHeight: 1.5, color: "#ABB3BF", borderTop: "1px solid #383E47", fontStyle: "italic" }}>{data.notes}</div>}
      <div className="wq-actions"><span className="wq-sub">SOURCE: UTA BOREHOLE INVESTIGATION · JUL 2022</span></div>
    </div>
  );
}


// ─── Water test tables (analytics-console styling) ───────────────────────────
const fmtWater = v => v == null ? "—" : Array.isArray(v) ? v[0] + "–" + v[1] : String(v);
const WATER_LIMITS = { ph: "6.5–8.5", fluoride: "≤ 1.5", tds: "≤ 500" };
const waterWarn = (key, v) => {
  if (v == null) return false;
  const lo = Array.isArray(v) ? v[0] : v, hi = Array.isArray(v) ? v[1] : v;
  if (key === "ph") return lo < 6.5 || hi > 8.5;
  if (key === "fluoride") return hi > 1.5;
  if (key === "tds") return hi > 500;
  return false;
};
const waterStatus = (key, v) => v == null ? "none" : waterWarn(key, v) ? "flag" : WATER_LIMITS[key] ? "ok" : "info";
const groupedParams = rows => {
  const out = []; let g = null;
  for (const p of WATER_PARAMS) { if (!rows(p)) continue; if (p.group !== g) { g = p.group; out.push({ isGroup: true, group: g }); } out.push(p); }
  return out;
};
const WQ_CSS = `
.wq{--bg:#1C2127;--panel:#252A31;--head:#2F343C;--line:#383E47;--line2:#2F343C;--tx:#F6F7F9;--mut:#ABB3BF;--dim:#738091;--blue:#4C90F0;--blue2:#8ABBFF;--red:#E76A6E;--green:#72CA9B;--mono:"JetBrains Mono","SF Mono",Menlo,Consolas,"Liberation Mono",monospace;--sans:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;font-family:var(--sans);color:var(--tx);font-feature-settings:"tnum"}
.wq *{box-sizing:border-box}
.wq-card{margin-top:14px;background:var(--bg);border:1px solid var(--line);border-radius:2px}
.wq-bar{display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;background:var(--head);border-bottom:1px solid var(--line)}
.wq-glyph{width:16px;height:16px;border-radius:2px;background:rgba(76,144,240,.18);border:1px solid rgba(76,144,240,.5);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--blue2);font-family:var(--mono)}
.wq-title{font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase}
.wq-sub{font-size:10px;color:var(--dim);font-family:var(--mono);letter-spacing:.3px}
.wq-tag{font-family:var(--mono);font-size:9.5px;color:var(--mut);border:1px solid var(--line);background:var(--panel);padding:1px 6px;border-radius:2px;letter-spacing:.3px}
.wq-t{width:100%;border-collapse:separate;border-spacing:0}
.wq-t th{height:26px;padding:0 10px;font-size:9.5px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;color:var(--dim);text-align:left;background:var(--panel);border-bottom:1px solid var(--line);white-space:nowrap}
.wq-t td{height:27px;padding:0 10px;font-size:12px;border-bottom:1px solid var(--line2);white-space:nowrap}
.wq-t tbody tr:not(.wq-g):hover td{background:rgba(76,144,240,.08)!important}
.wq-g td{height:22px;font-size:9px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--blue2);background:rgba(76,144,240,.06);border-bottom:1px solid var(--line)}
.wq-k{color:var(--mut)}
.wq-v{font-family:var(--mono);font-size:12px;text-align:right;color:var(--tx)}
.wq-v.flag{color:var(--red)} .wq-v.none{color:#4E5867}
.wq-u{font-family:var(--mono);font-size:10.5px;color:var(--dim)}
.wq-lim{font-family:var(--mono);font-size:10.5px;color:var(--dim);text-align:right}
.wq-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:7px;vertical-align:1px}
.wq-dot.ok{background:var(--green);box-shadow:0 0 0 2px rgba(114,202,155,.15)} .wq-dot.flag{background:var(--red);box-shadow:0 0 0 2px rgba(231,106,110,.18)} .wq-dot.info{background:#5F6B7C} .wq-dot.none{background:transparent;border:1px solid #4E5867}
.wq-actions{display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--panel);border-top:1px solid var(--line)}
.wq-btn{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:2px;border:1px solid var(--line);background:#383E47;color:var(--tx);font:500 11px var(--sans);cursor:pointer;text-decoration:none;letter-spacing:.2px}
.wq-btn:hover{background:#404854}
.wq-btn.pri{background:#2D72D2;border-color:#2D72D2} .wq-btn.pri:hover{background:#215DB0}
.wq-btn .i{font-family:var(--mono);font-size:11px;opacity:.85}
.wq-ov{position:fixed;inset:0;z-index:10000;background:rgba(17,20,24,.72);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:16px}
.wq-modal{width:min(1180px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:var(--bg);border:1px solid var(--line);border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 24px 64px rgba(0,0,0,.55)}
.wq-modal .wq-bar{height:44px;padding:0 12px}
.wq-scroll{overflow:auto}
.wq-grid th,.wq-grid td{border-right:1px solid var(--line2)}
.wq-grid thead th{position:sticky;top:0;z-index:2;text-align:right;vertical-align:bottom;padding-top:6px;padding-bottom:6px;height:auto;white-space:normal;min-width:104px;line-height:1.35}
.wq-grid .stk{position:sticky;left:0;z-index:1;background:var(--bg);border-right:1px solid var(--line)}
.wq-grid thead th.stk{z-index:3;background:var(--panel);text-align:left}
.wq-grid .hl{background:rgba(76,144,240,.07)} .wq-grid thead th.hl{color:var(--blue2);box-shadow:inset 0 2px 0 var(--blue);background:#28303B}
.wq-status{display:flex;align-items:center;gap:14px;height:26px;padding:0 12px;background:var(--panel);border-top:1px solid var(--line);font:10px var(--mono);color:var(--dim);letter-spacing:.3px;flex-wrap:wrap}
.wq-filter{height:26px;width:180px;padding:0 8px;border-radius:2px;border:1px solid var(--line);background:var(--bg);color:var(--tx);font:11px var(--sans);outline:none}
.wq-filter:focus{border-color:var(--blue);box-shadow:0 0 0 1px var(--blue)}
`;

function WaterTestCard({ t }) {
  const [showAll, setShowAll] = useState(false);
  if (!t) return null;
  const rows = groupedParams(p => t.values[p.key] != null);
  const flags = WATER_PARAMS.filter(p => waterWarn(p.key, t.values[p.key])).length;
  return (
    <div className="wq wq-card">
      <style>{WQ_CSS}</style>
      <div className="wq-bar">
        <span className="wq-glyph">H₂O</span>
        <span className="wq-title">Water Quality</span>
        <span style={{ marginLeft: "auto" }} className="wq-tag">{t.site.toUpperCase()}</span>
        <span className="wq-tag" style={flags ? { color: "#E76A6E", borderColor: "rgba(231,106,110,.4)" } : { color: "#72CA9B", borderColor: "rgba(114,202,155,.35)" }}>{flags ? flags + " FLAG" + (flags > 1 ? "S" : "") : "NO FLAGS"}</span>
      </div>
      <table className="wq-t">
        <thead><tr><th>Property</th><th style={{ textAlign: "right" }}>Value</th><th>Unit</th></tr></thead>
        <tbody>{rows.map(r => r.isGroup
          ? <tr key={r.group} className="wq-g"><td colSpan={3}>{r.group}</td></tr>
          : <tr key={r.key}>
              <td className="wq-k"><span className={"wq-dot " + waterStatus(r.key, t.values[r.key])} />{r.label}</td>
              <td className={"wq-v " + (waterWarn(r.key, t.values[r.key]) ? "flag" : "")}>{fmtWater(t.values[r.key])}</td>
              <td className="wq-u">{r.unit}</td>
            </tr>)}</tbody>
      </table>
      <div className="wq-actions">
        <button className="wq-btn pri" onClick={() => setShowAll(true)}><span className="i">⊞</span>Compare sites</button>
        <a className="wq-btn" href={WATER_XLSX_URL} download><span className="i">↓</span>Export .xlsx</a>
        <span className="wq-sub" style={{ marginLeft: "auto" }}>n={t.samples ?? "—"}{t.time ? " · " + t.time : ""}</span>
      </div>
      {showAll && <WaterTableModal onClose={() => setShowAll(false)} highlightId={t.id} />}
    </div>
  );
}

function WaterTableModal({ onClose, highlightId }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const needle = q.trim().toLowerCase();
  const rows = groupedParams(p => WATER_SITES.some(s => s.values[p.key] != null) && (!needle || p.label.toLowerCase().includes(needle) || p.group.toLowerCase().includes(needle)));
  const nProps = rows.filter(r => !r.isGroup).length;
  const nFlags = WATER_SITES.reduce((n, s) => n + WATER_PARAMS.filter(p => waterWarn(p.key, s.values[p.key])).length, 0);
  return createPortal(
    <div className="wq wq-ov" onClick={onClose}>
      <style>{WQ_CSS}</style>
      <div className="wq-modal" onClick={e => e.stopPropagation()}>
        <div className="wq-bar">
          <span className="wq-glyph">H₂O</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="wq-title">Water Quality · Site Comparison</span>
            <span className="wq-sub">EWB-ISU FIELD TESTS · ULLO TRADITIONAL AREA</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <input className="wq-filter" placeholder="Filter properties…" value={q} onChange={e => setQ(e.target.value)} />
            <a className="wq-btn pri" href={WATER_XLSX_URL} download><span className="i">↓</span>Export .xlsx</a>
            <button className="wq-btn" onClick={onClose}><span className="i">✕</span>Close</button>
          </div>
        </div>
        <div className="wq-scroll">
          <table className="wq-t wq-grid">
            <thead><tr>
              <th className="stk">Property</th>
              <th style={{ textAlign: "left", minWidth: 60 }}>Unit</th>
              <th style={{ minWidth: 76 }}>Guideline</th>
              {WATER_SITES.map(s => <th key={s.id} className={s.id === highlightId ? "hl" : ""}>{s.name}<div className="wq-sub" style={{ fontWeight: 400, marginTop: 2 }}>{s.site.toUpperCase()}</div></th>)}
            </tr></thead>
            <tbody>
              {rows.map(r => r.isGroup
                ? <tr key={r.group} className="wq-g"><td className="stk" style={{ background: "#1F2731" }}>{r.group}</td><td colSpan={WATER_SITES.length + 2} /></tr>
                : <tr key={r.key}>
                    <td className="stk wq-k">{r.label}</td>
                    <td className="wq-u">{r.unit}</td>
                    <td className="wq-lim">{WATER_LIMITS[r.key] || ""}</td>
                    {WATER_SITES.map(s => { const v = s.values[r.key]; const st = waterStatus(r.key, v); return (
                      <td key={s.id} className={"wq-v " + st + (s.id === highlightId ? " hl" : "")}>{v != null && WATER_LIMITS[r.key] && <span className={"wq-dot " + st} />}{fmtWater(v)}</td>); })}
                  </tr>)}
              <tr>
                <td className="stk wq-k" style={{ fontStyle: "italic" }}>Samples (n)</td><td /><td />
                {WATER_SITES.map(s => <td key={s.id} className={"wq-v none" + (s.id === highlightId ? " hl" : "")} style={{ color: "#ABB3BF" }}>{s.samples ?? "—"}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="wq-status">
          <span>{WATER_SITES.length} OBJECTS</span><span>{nProps} PROPERTIES</span>
          <span style={{ color: nFlags ? "#E76A6E" : "#72CA9B" }}>{nFlags} FLAGGED</span>
          <span style={{ marginLeft: "auto" }}><span className="wq-dot ok" />WITHIN GUIDELINE</span>
          <span><span className="wq-dot flag" />OUTSIDE GUIDELINE</span>
          <span><span className="wq-dot none" />NOT MEASURED</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── PanoVideo Component ─────────────────────────────────────────────────────
function PanoVideo({ videoUrls, listing, locationName, tall, btnHidden, onToggleHide }) {
  const videos = videoUrls || [];
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showBtn, setShowBtn] = useState(true);
  const btnTimer = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const dragRef = useRef(false);
  const current = videos[idx] || null;
  const [vidStatus, setVidStatus] = useState("checking"); // checking | found | error
  const [buffering, setBuffering] = useState(false);
  const [bufPct, setBufPct] = useState(0);
  const [playPct, setPlayPct] = useState(0);
  const [duration, setDuration] = useState(0);
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); setPlaying(false); setShowBtn(true); if (btnTimer.current) clearTimeout(btnTimer.current); if (onToggleHide) onToggleHide(false); }, [locationName]);

  const cleanup = () => {
    const s = stateRef.current;
    if (!s) return;
    if (s.animId) cancelAnimationFrame(s.animId);
    if (s.video) { s.alive = false; s.video.pause(); s.video.removeAttribute("src"); try { s.video.load(); } catch (_) {} }
    if (s.onResize) window.removeEventListener("resize", s.onResize);
    if (s.renderer) { s.renderer.dispose(); s.renderer.domElement.remove(); }
    stateRef.current = null;
  };
  const runRef = useRef(0);

  useEffect(() => {
    if (listing) { cleanup(); setVidStatus("checking"); return; }
    if (!current || !containerRef.current) return;
    cleanup();
    const run = ++runRef.current;
    const live = () => runRef.current === run;
    const url = mediaUrl(typeof current === "string" ? current : current.url);
    (async () => {
      if (!window.THREE) {
        await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; s.onload = r; s.onerror = r; document.head.appendChild(s); setTimeout(r, 20000); });
      }
      if (!live()) return;
      if (!window.THREE) { console.warn("360 player library failed to load"); setVidStatus("error"); return; }
      const THREE = window.THREE;
      const container = containerRef.current;
      const w = container.clientWidth, ht = container.clientHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, ht);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, w / ht, 0.1, 1000);
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.loop = true;
      video.muted = false;
      video.preload = "auto"; // start downloading as soon as the Video tab opens
      setVidStatus("checking"); setBuffering(false); setBufPct(0); setPlayPct(0); setDuration(0);
      const loadedPct = () => {
        const d = video.duration;
        if (!d || !isFinite(d) || !video.buffered.length) return 0;
        // furthest buffered point at/after the playhead
        let end = 0;
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime + 0.5) end = Math.max(end, video.buffered.end(i));
        }
        return Math.min(100, Math.round(end / d * 100));
      };
      // Only react to events from the video this run created
      const on = (ev, fn) => video.addEventListener(ev, (e) => { if (live()) fn(e); });
      let retries = 0;
      on("loadedmetadata", () => { setVidStatus("found"); setDuration(video.duration || 0); });
      on("progress", () => setBufPct(loadedPct()));
      on("timeupdate", () => { setBufPct(loadedPct()); if (video.duration) setPlayPct(video.currentTime / video.duration * 100); });
      on("waiting", () => setBuffering(true));
      on("stalled", () => { if (!video.paused && video.readyState < 3) setBuffering(true); });
      on("playing", () => setBuffering(false));
      on("canplaythrough", () => { if (!video.paused) setBuffering(false); });
      on("pause", () => setBuffering(false));
      on("error", () => {
        const code = video.error?.code;       // 1 aborted · 2 network · 3 decode · 4 not found / unsupported
        if (code === 1) return;               // we cancelled it ourselves
        if (code === 2 && retries < 2) {      // flaky connection: keep showing "loading" and try again
          retries++;
          const t = video.currentTime;
          setTimeout(() => { if (!live()) return; video.src = url; video.load(); if (t) video.currentTime = t; }, 1500 * retries);
          return;
        }
        console.warn("360 video failed to load:", url, video.error);
        setVidStatus("error"); setBuffering(false);
      });
      video.src = url;
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      const geo = new THREE.SphereGeometry(500, 60, 40);
      geo.scale(-1, 1, 1);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture }));
      scene.add(mesh);
      let isDragging = false, prevX = 0, prevY = 0;
      let lon = 0, lat = 0;
      let startX = 0, startY = 0, moved = false;
      const onDown = (e) => { isDragging = true; moved = false; const p = e.touches ? e.touches[0] : e; prevX = p.clientX; prevY = p.clientY; startX = p.clientX; startY = p.clientY; };
      const onMove = (e) => {
        if (!isDragging) return;
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - startX, dy = p.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
        lon -= (p.clientX - prevX) * 0.2;
        lat += (p.clientY - prevY) * 0.2;
        lat = Math.max(-85, Math.min(85, lat));
        prevX = p.clientX; prevY = p.clientY;
      };
      const onUp = () => { if (!moved && isDragging) { dragRef.current = true; } isDragging = false; };
      renderer.domElement.addEventListener("mousedown", onDown);
      renderer.domElement.addEventListener("mousemove", onMove);
      renderer.domElement.addEventListener("mouseup", onUp);
      renderer.domElement.addEventListener("mouseleave", onUp);
      renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
      renderer.domElement.addEventListener("touchmove", onMove, { passive: true });
      renderer.domElement.addEventListener("touchend", onUp);
      const state = { renderer, scene, camera, video, animId: null, onResize: null };
      stateRef.current = state;
      const animate = () => {
        state.animId = requestAnimationFrame(animate);
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
        renderer.render(scene, camera);
      };
      animate();
      state.onResize = () => {
        const nw = container.clientWidth, nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", state.onResize);
    })();
    return cleanup;
  }, [current, locationName, listing]);

  const togglePlay = (fromFrame) => {
    const s = stateRef.current;
    if (!s?.video) return;
    if (btnTimer.current) clearTimeout(btnTimer.current);
    if (s.video.paused) {
      if (s.video.readyState < 3) setBuffering(true);
      s.video.preload = "auto";
      s.video.play().catch(() => {}); setPlaying(true); setShowBtn(true);
      btnTimer.current = setTimeout(() => setShowBtn(false), 3000);
    } else {
      s.video.pause(); setPlaying(false);
      if (btnHidden && fromFrame) {}
      else { setShowBtn(true); }
    }
  };


  // Space bar plays / pauses (unless you're typing in a field)
  const toggleRef = useRef(null);
  toggleRef.current = togglePlay;
  const videoNav = useRef(null);
  videoNav.current = (d) => {
    if (videos.length < 2) return;
    setIdx(i => (i + d + videos.length) % videos.length); setPlaying(false); setShowBtn(true);
  };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {   // ← / → switch videos
        e.preventDefault();
        if (!e.repeat) videoNav.current?.(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();                      // don't scroll the page
      if (e.repeat) return;
      if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur(); // avoid double-toggling a focused button
      if (stateRef.current?.video) toggleRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fmtT = (t) => { if (!t || !isFinite(t)) return "--:--"; const m = Math.floor(t / 60); return m + ":" + String(Math.floor(t % 60)).padStart(2, "0"); };
  if (!videos.length) return (
    <div className="px-empty" style={{ width: "100%", height: h }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>◌</span>360° video not yet added
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div ref={containerRef} className="px-frame" onClick={() => { if (dragRef.current) { dragRef.current = false; if (playing || btnHidden) togglePlay(true); } }} style={{ height: h, cursor: "grab" }} />
      {vidStatus === "error" && (
        <div className="px-empty" style={{ position: "absolute", inset: 0, zIndex: 5, borderStyle: "solid", gap: 8, textAlign: "center", padding: 20 }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>◌</span>Video not available
        </div>
      )}
      {vidStatus === "checking" && <LoadingCard title="Loading video…" caption={listing ? "FINDING VIDEOS FOR THIS LOCATION" : "360 files are big"} />}
      {vidStatus === "found" && playing && buffering && <LoadingCard title="Loading video…" caption="360 files are big" pct={bufPct} />}
      {vidStatus === "found" && (
        <div style={{ position: "absolute", left: 1, right: 1, bottom: 1, height: 3, background: "rgba(56,62,71,.7)", zIndex: 4, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: bufPct + "%", background: "rgba(171,179,191,.45)", transition: "width .3s ease" }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: playPct + "%", background: "var(--blueHi)" }} />
        </div>
      )}
      {!btnHidden && vidStatus === "found" && !(playing && buffering) && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "opacity 0.5s", opacity: showBtn ? 1 : 0, pointerEvents: showBtn ? "auto" : "none" }}>
          <button className="px-btn pri lg" onClick={() => togglePlay(false)}><span className="i">{playing ? "❚❚" : "▶"}</span>{playing ? "Pause" : "Play 360° video"}</button>
          {!playing && <button className="px-btn sm out" style={{ background: "rgba(17,20,24,.8)" }} onClick={() => { if (onToggleHide) onToggleHide(true); }}>Hide button</button>}
        </div>
      )}
      {videos.length > 1 && (
        <div className="px-hud" style={{ position: "static", display: "inline-flex", marginTop: 6, height: 30, padding: "0 3px", gap: 2 }}>
          <button onMouseDown={e => e.preventDefault()} className="px-btn min icon sm" style={{ width: 24, height: 24 }} onClick={() => { setIdx((idx - 1 + videos.length) % videos.length); setPlaying(false); setShowBtn(true); }}>←</button>
          <span style={{ minWidth: 54, textAlign: "center", color: "var(--tx)" }}>{String(idx + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</span>
          <button onMouseDown={e => e.preventDefault()} className="px-btn min icon sm" style={{ width: 24, height: 24 }} onClick={() => { setIdx((idx + 1) % videos.length); setPlaying(false); setShowBtn(true); }}>→</button>
        </div>
      )}
    </div>
  );
}

// ─── DroneIntro ──────────────────────────────────────────────────────────────
function DroneIntro({ url, locationName, onSkip }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    const onTime = () => { setProgress(v.currentTime); setDuration(v.duration || 0); };
    const onEnd = () => onSkip();
    const onErr = () => onSkip();
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", onEnd); v.removeEventListener("error", onErr); v.pause(); };
  }, [url]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };


  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
  };

  const fmt = (s) => { const m = Math.floor(s / 60); return m + ":" + String(Math.floor(s % 60)).padStart(2, "0"); };

  return (
    <div className="px" style={{ position: "absolute", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
      <div className="px-bar" style={{ minHeight: 40, padding: "0 12px", background: "var(--panel)" }}>
        <span className="px-tag blue">DRONE</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{locationName}</span>
        <button className="px-btn out icon" style={{ marginLeft: "auto" }} onClick={onSkip}>✕</button>
      </div>
      <video ref={videoRef} src={mediaUrl(url)} preload="auto" playsInline style={{ flex: 1, minHeight: 0, width: "100%", objectFit: "contain", background: "#000", cursor: "pointer" }} onClick={togglePlay} />
      <div style={{ background: "var(--panel)", borderTop: "1px solid var(--line)" }}>
        <div onClick={seek} style={{ width: "100%", height: 4, background: "var(--line)", cursor: "pointer" }}>
          <div style={{ width: duration ? (progress / duration * 100) + "%" : "0%", height: "100%", background: "var(--blueHi)", transition: "width 0.1s linear" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <button className="px-btn icon" onClick={togglePlay}>{playing ? "❚❚" : "▶"}</button>
          <span className="px-mono px-muted" style={{ fontSize: 11 }}>{fmt(progress)} / {fmt(duration)}</span>
          <button className="px-btn pri" style={{ marginLeft: "auto" }} onClick={onSkip}>Explore location <span className="i">→</span></button>
        </div>
      </div>
    </div>
  );
}

// ─── MediaViewer ─────────────────────────────────────────────────────────────
// Each location's media lives in its own folder of the "pano" bucket
// (e.g. pano/rotary_borehole/). The app lists that folder so any video
// uploaded there plays, whatever its file name. The hard-coded videoUrls
// are only a fallback if the folder can't be listed.
function mediaFolder(loc) {
  const first = (loc.photoUrls || [])[0] || loc.photoUrl || (loc.videoUrls || [])[0];
  const u = typeof first === "string" ? first : first?.url;
  const m = u && u.match(/\/pano\/([^/]+)\//);
  return m ? m[1] : loc.id;
}
const VIDEO_FILE = /\.(mp4|m4v|mov|webm)$/i;
const folderVideoCache = new Map();
function listFolderVideos(folder) {
  if (folderVideoCache.has(folder)) return folderVideoCache.get(folder);
  const p = supabase.storage.from("pano").list(folder, { limit: 1000 })
    .then(({ data, error }) => {
      if (error || !data) return null;
      return data
        .filter(f => f.id && VIDEO_FILE.test(f.name))
        .map(f => f.name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map(n => "/pano/" + folder + "/" + encodeURIComponent(n));
    })
    .catch(() => null);
  folderVideoCache.set(folder, p);
  return p;
}

function MediaViewer({ loc, tall }) {
  const folder = mediaFolder(loc);
  const [listedVideos, setListedVideos] = useState(null);
  const knownCount = loc.videoUrls?.length || 0;
  useEffect(() => {
    let alive = true;
    setListedVideos(null);
    listFolderVideos(folder).then(v => { if (alive) setListedVideos(v); });
    return () => { alive = false; };
  }, [folder, knownCount]);
  const listing = listedVideos === null;
  const videoUrls = listedVideos?.length ? listedVideos : (loc.videoUrls || []);
  const hasPhotos = loc.photoUrls?.length > 0 || loc.photoUrl;
  const hasVideo = videoUrls.length > 0;
  const tabs = [];
  if (hasPhotos) tabs.push("photos");
  if (hasVideo) tabs.push("video");
  const [activeTab, setActiveTab] = useState(tabs[0] || "photos");
  const [playBtnHidden, setPlayBtnHidden] = useState(false);

  useEffect(() => { setActiveTab(tabs[0] || "photos"); setPlayBtnHidden(false); }, [loc.id]);

  if (!tabs.length) return (
    <div className="px-empty" style={{ width: "100%", height: 200 }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>◌</span>No media added yet
    </div>
  );

  return (
    <div>
      {(tabs.length > 1 || (playBtnHidden && activeTab === "video")) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          {tabs.length > 1 && (
            <div className="px-seg">
              {tabs.map(tab => (
                <button key={tab} className={activeTab === tab ? "on" : ""} onClick={() => { setActiveTab(tab); if (tab !== "video") setPlayBtnHidden(false); }}>
                  {tab === "photos" ? "360° Photos" : "360° Video"}
                </button>
              ))}
            </div>
          )}
          {playBtnHidden && activeTab === "video" && <button className="px-btn sm out" onClick={() => setPlayBtnHidden(false)}><span className="i">▶</span>Show play button</button>}
        </div>
      )}
      {activeTab === "photos" && <PanoViewer photoUrl={loc.photoUrl} photoUrls={loc.photoUrls} locationName={loc.name} tall={tall} />}
      {activeTab === "video" && <PanoVideo videoUrls={videoUrls} listing={listing} locationName={loc.name} tall={tall} btnHidden={playBtnHidden} onToggleHide={setPlayBtnHidden} />}
    </div>
  );
}


// ─── Cloud layer ─────────────────────────────────────────────────────────────
// Volumetric cumulus drawn with WebGL, the way flight sims do it. For every
// pixel the shader follows that pixel's line of sight through a cloud deck
// wrapped around the (curved) Earth, using the map's own camera, and adds up
// light from many small steps through 3D noise (Perlin-Worley for the billowy
// shapes, Worley for the cauliflower detail). Each step also looks toward the
// sun to see how much cloud is in the way, so clouds shade themselves.
//   • Where it's cloudy comes from NASA's Blue Marble cloud map, plus local
//     clumping; around Ullo it's always partly cloudy.
//   • From far away the detail becomes a soft haze, then the NASA map itself.
// Clouds fade in past CLOUDS.start metres of camera range and part in the
// middle of the screen at low altitude so the area you're looking at stays visible.
const CLOUDS = {
  start: 2200, full: 8000,          // camera range (m): clouds fade in between these
  fadeOut: 4e7, gone: 6e7,          // fade out again this far away (default: never)
  base: 1.2, top: 2.8,              // cloud deck: km above Ullo's ground (bottoms and tallest tops)
  size: 9,                          // km: bigger = bigger, fewer clouds
  sunElevation: 40,                 // degrees above the horizon
  sunAzimuth: 150,                  // compass degrees the light comes from (bottom right)
  density: 7,                       // how solid the clouds are
  cover: 0.42,                      // how cloudy it is around Ullo (0–1)
  shadows: 0.35,                    // darkness of cloud shadows on the ground, 0 = off
  wind: 0.06,                       // km per second, west → east
  map: "/clouds/earth_clouds.jpg",   // NASA Blue Marble cloud map, used from high up
  noise: "/clouds/cloud_noise.png",  // 3D noise for the cloud shapes (64 slices of 64×64)
  minScale: 0.08, flareSpeed: 2500 /* m/s of zoom-in for full bloom */, flare: 1 /* bloom strength, 0 = off */, maxOpacity: 0.97,
};

const CLOUD_VS = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const CLOUD_FS = `#version 300 es
precision highp float; precision highp sampler3D;
uniform sampler3D uNoise;                            // R Perlin-Worley, G low Worley, B fine Worley
uniform sampler2D uCloudMap;                         // NASA cloud map (world, equirectangular)
uniform vec2 uRes, uTan;
uniform vec3 uCamE, uCamA, uF, uR, uU, uWind, uSunDir, uUp;
uniform float uCb, uCt, uCg, uRb, uRt, uMid, uPix, uShown, uGlow, uHole, uHoleAmt, uMaxA, uSigma, uShadow, uMapOK, uSize, uCover;
uniform vec4 uLab[48]; uniform int uLabN;            // map labels on screen: centre xy, half-size zw (canvas px)
out vec4 o;
const mat3 MR = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
float remap(float v, float a, float b, float c, float d) { return c + (v - a) * (d - c) / (b - a); }
bool sphere(float b, float c, out float tn, out float tf) {  // ray vs sphere about Earth's centre (c = |cam|² − r²)
  float disc = b * b - c; if (disc < 0.0) return false;
  float q = -b - (b >= 0.0 ? 1.0 : -1.0) * sqrt(disc);
  float r1 = q, r2 = c / q; tn = min(r1, r2); tf = max(r1, r2); return true;
}
// Cloud density at X (km from Ullo, wind applied), h = 0 at the base, 1 at the top.
// lod = mip level for the pixel footprint; cov = how cloudy (0–1); dw = how much fine detail to show
float density(vec3 X, float h, float cov, float lod, float dw) {
  float topH = mix(0.45, 1.0, clamp(cov * 1.4, 0.0, 1.0));          // more cover → taller clouds
  float hp = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(topH * 0.5, topH, h));
  if (hp <= 0.0 || cov <= 0.0) return 0.0;
  // two rotated layers at different sizes so the pattern never visibly repeats
  vec3 n = textureLod(uNoise, X / uSize, lod).rgb;
  vec3 n2 = dw >= 0.0 ? textureLod(uNoise, MR * X / (uSize * 2.3), max(lod - 1.2, 0.0)).rgb : n;  // (skipped for the light samples)
  float pr = mix(n.r, n2.r, 0.4), pg = mix(n.g, n2.g, 0.4);
  float base = clamp(remap(pr, pg - 1.0, 1.0, 0.0, 1.0), 0.0, 1.0);
  base = clamp((base - 0.45) / 0.5, 0.0, 1.0);                     // spread out the noise range
  float c = clamp(remap(base * hp, 1.0 - cov, 1.0, 0.0, 1.0), 0.0, 1.0);
  if (c <= 0.0 || dw <= 0.0) return c;   // dw < 0: light sample, no detail
  float df = textureLod(uNoise, X / (uSize * 0.16), lod + 2.6).b;   // cauliflower edges
  float m = mix(df, 1.0 - df, clamp(h * 3.0, 0.0, 1.0)) * 0.3 * dw; // wispy at the base, billowy above
  return clamp(remap(c, m, 1.0, 0.0, 1.0), 0.0, 1.0);
}
void main() {
  vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  vec3 d = normalize(uF + ndc.x * uTan.x * uR + ndc.y * uTan.y * uU);
  float b = dot(d, uCamE);
  float r = length(gl_FragCoord.xy - uRes * 0.5) / (0.5 * length(uRes));
  float va = uGlow * mix(0.26, 0.08, clamp(r, 0.0, 1.0));          // bloom veil
  // Where does this line of sight enter and leave the cloud deck?
  float tnT, tfT, tnB, tfB, t0, t1;
  bool hT = sphere(b, uCt, tnT, tfT), hB = sphere(b, uCb, tnB, tfB);
  if (uCt > 0.0) {                                                    // camera above the clouds
    if (!hT || tfT < 0.0) { o = vec4(vec3(va), va); return; }
    t0 = max(tnT, 0.0); t1 = (hB && tnB > 0.0) ? tnB : tfT;
  } else if (uCb > 0.0) { t0 = 0.0; t1 = (hB && tnB > 0.0) ? tnB : tfT; }
  else { t0 = tfB; t1 = tfT; }
  float tm = 0.5 * (t0 + t1);
  vec3 hitA = uCamA + d * tm;
  vec3 gE = normalize(uCamE + d * tm);
  float cosI = abs(dot(gE, d));
  float fp = tm * uPix / max(cosI, 0.08);                             // size of one pixel at the clouds (km)
  // ── How cloudy it is here ──
  vec2 uvm = vec2(atan(gE.y, gE.x) / 6.2831853 + 0.5, 0.5 - asin(clamp(gE.z, -1.0, 1.0)) / 3.14159265);
  float lodM = log2(max(fp / 15.5, 1.0));                             // one map pixel ≈ 15.5 km
  float mapF = textureLod(uCloudMap, uvm, lodM).r, mapV = textureLod(uCloudMap, uvm, max(lodM, 2.5)).r;
  vec3 Pc = hitA - uWind;
  float clump = textureLod(uNoise, Pc / (uSize * 9.0), log2(max(fp / (uSize * 0.14), 1.0))).r;  // groups of clouds and gaps, ~20-40 km
  float cov = (uMapOK > 0.5 ? 0.12 + mapV * 0.75 : 0.4) + (clump - 0.68) * 0.75;
  cov = mix(cov, uCover + (clump - 0.68) * 0.75, exp(-length(hitA) / 150.0));
  cov = clamp(cov, 0.0, 1.0);
  float wFar = uMapOK > 0.5 ? smoothstep(2.0, 9.0, fp) : 0.0;        // very far: the NASA map itself
  float texel = uSize / 64.0;
  float lod = log2(max(fp / texel, 1.0));
  float dw = 1.0 - smoothstep(0.04, 0.16, fp);                        // fine detail only up close
  // Far away a pixel covers many clouds: blend toward their average so they
  // fade into haze of the right amount instead of vanishing or merging
  float wAvg = smoothstep(0.3, 2.2, lod);
  float covEff = cov;
  float hk = uRt - uRb;
  float avgD = -log(max(1.0 - 0.85 * smoothstep(0.08, 0.75, cov), 0.02)) / (uSigma * hk * 0.45);
  // ── March through the deck ──
  vec3 acc = vec3(0.0); float T = 1.0;
  if (wFar < 0.999 && cov > 0.02) {
    const int STEPS = 32;
    float seg = t1 - t0, dt = seg / float(STEPS);
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float dtE = min(dt, hk * 2.0);                                    // grazing rays: don't let one step go solid
    float up = dot(uSunDir, uUp);
    for (int i = 0; i < STEPS; i++) {
      float ts = t0 + (float(i) + jit) * dt;
      vec3 X = uCamA + d * ts - uWind;
      float h = clamp((length(uCamE + d * ts) - uRb) / hk, 0.0, 1.0);
      float dn = density(X, h, covEff, lod, dw);
      if (wAvg > 0.0) {
        float topH = mix(0.45, 1.0, clamp(cov * 1.4, 0.0, 1.0));
        float hp = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(topH * 0.5, topH, h));
        dn = mix(dn, avgD * hp, wAvg);
      }
      if (dn < 0.002) continue;
      // Light reaching this point from the sun: march a short way toward it
      float od = 0.0, ls = 0.06;
      vec3 L = X;
      for (int j = 0; j < 5; j++) {
        L += uSunDir * ls;
        float hl = h + up * ls * float(j + 1) / hk;
        if (hl > 1.0) break;
        od += density(L, hl, covEff, lod + 0.5, -1.0) * ls;
        ls *= 1.8;
      }
      od = mix(od, avgD * 0.35, wAvg);
      float beer = exp(-od * uSigma);
      float sunL = max(beer, exp(-od * uSigma * 0.25) * 0.45);           // multiple scattering keeps shadows soft
      float powder = 1.0 - exp(-dn * uSigma * 0.6);                       // dark crevices on the sunlit side
      sunL *= mix(1.0, mix(0.6, 1.0, powder), dw);
      vec3 amb = mix(vec3(0.50, 0.56, 0.66), vec3(0.80, 0.85, 0.94), h); // undersides greyer, tops lit by the sky
      vec3 col = vec3(1.0, 0.97, 0.92) * sunL * 1.05 + amb * 0.42;
      col = 1.0 - exp(-col * 1.7);                                        // soft highlight rolloff
      col = min(vec3(1.0), col + uGlow * 0.2);                            // bloom
      float a = 1.0 - exp(-dn * uSigma * dtE);
      acc += T * a * col; T *= 1.0 - a;
      if (T < 0.02) break;
    }
  }
  float cloudA = 1.0 - T;
  // Very far: the NASA map
  float aMap = smoothstep(0.04, 0.6, mapF) * 0.95;
  acc = mix(acc, vec3(mix(0.8, 1.0, mapF), mix(0.82, 1.0, mapF), mix(0.86, 1.0, mapF)) * aMap, wFar);
  cloudA = mix(cloudA, aMap, wFar);
  // Keep map labels readable
  float lab = 0.0;
  for (int i = 0; i < 48; i++) {
    if (i >= uLabN) break;
    vec2 qq = abs(gl_FragCoord.xy - uLab[i].xy) - uLab[i].zw;
    lab = max(lab, 1.0 - smoothstep(-2.0, 8.0, max(qq.x, qq.y)));
  }
  float labK = 1.0 - 0.85 * lab;
  float clearMask = mix(1.0, smoothstep(uHole * 0.4, min(1.0, uHole + 0.45), r), uHoleAmt);
  float k = uMaxA * uShown * clearMask * smoothstep(0.03, 0.3, cosI) * labK;
  // ── Shadows on the ground ──
  float sh = 0.0, tnG, tfG;
  if (uShadow > 0.0 && T > 0.02 && fp < 0.6 && sphere(b, uCg, tnG, tfG) && tnG > 0.0) {
    vec3 G = uCamA + d * tnG;
    vec3 S = G + uSunDir * (uMid / max(dot(uSunDir, uUp), 0.3)) - uWind;
    float fpG = tnG * uPix / max(cosI, 0.08);
    float lodG = log2(max(max(fp, fpG) / texel, 1.0)) + 1.0;
    float ds = density(S, 0.35, cov, lodG, 0.0) + density(S + uSunDir * 0.5, 0.6, cov, lodG, 0.0);
    sh = (1.0 - exp(-ds * uSigma * 0.5)) * uShadow * (1.0 - smoothstep(0.15, 0.6, fp));
  }
  float A = cloudA * k, sA = sh * uShown * clearMask * labK * (1.0 - A);
  float outA = A + sA;
  o = vec4(acc * k + vec3(1.0) * va * (1.0 - outA), outA + va * (1.0 - outA));
}`;

// Earth-centred position (km) and local east/north/up at a lat/lng
const R_EARTH = 6371;
function geoFrame(lat, lng, altKm) {
  const φ = (lat * Math.PI) / 180, λ = (lng * Math.PI) / 180;
  const U = [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
  const E = [-Math.sin(λ), Math.cos(λ), 0];
  const N = [-Math.sin(φ) * Math.cos(λ), -Math.sin(φ) * Math.sin(λ), Math.cos(φ)];
  const r = R_EARTH + altKm;
  return { P: U.map(v => v * r), U, E, N };
}

function CloudLayer({ map3dRef, labelsRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const gl = cv.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // very old browser: no clouds
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("cloud shader:", gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, CLOUD_VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, CLOUD_FS));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("cloud program:", gl.getProgramInfoLog(prog)); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; for (const n of ["uNoise", "uCloudMap", "uRes", "uTan", "uCamE", "uCamA", "uF", "uR", "uU", "uWind", "uSunDir", "uUp", "uCb", "uCt", "uCg", "uRb", "uRt", "uMid", "uPix", "uShown", "uGlow", "uHole", "uHoleAmt", "uMaxA", "uSigma", "uShadow", "uMapOK", "uSize", "uCover", "uLab", "uLabN"]) U[n] = gl.getUniformLocation(prog, n);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    let alive = true, noiseOK = false;
    const loadImg = (src, onload) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => alive && onload(im); im.src = src; };
    // 3D noise volume: a 512×512 PNG holding 64 slices of 64×64
    const noiseTex = gl.createTexture(); gl.uniform1i(U.uNoise, 0);
    loadImg(CLOUDS.noise, (im) => {
      const c2 = document.createElement("canvas"); c2.width = c2.height = 512;
      const x2 = c2.getContext("2d", { willReadFrequently: true }); x2.drawImage(im, 0, 0);
      const px = x2.getImageData(0, 0, 512, 512).data, N = 64, vol = new Uint8Array(N * N * N * 4);
      for (let z = 0; z < N; z++) { const ox = (z % 8) * N, oy = Math.floor(z / 8) * N;
        for (let y = 0; y < N; y++) { const src = ((oy + y) * 512 + ox) * 4; vol.set(px.subarray(src, src + N * 4), ((z * N + y) * N) * 4); } }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, noiseTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, N, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, vol);
      gl.generateMipmap(gl.TEXTURE_3D);
      for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, k, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      noiseOK = true;
    });
    // Real cloud cover for far views: NASA Blue Marble cloud map (public domain)
    const mapTex = gl.createTexture(); gl.uniform1i(U.uCloudMap, 1); gl.uniform1f(U.uMapOK, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mapTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([0]));
    gl.activeTexture(gl.TEXTURE0);
    loadImg(CLOUDS.map, (im) => {
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mapTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, im);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(prog); gl.uniform1f(U.uMapOK, 1);
    });
    const anchor = geoFrame(WORLD.lat, WORLD.lng, WORLD.altitude / 1000);
    const Rg = R_EARTH + WORLD.altitude / 1000, Rb = Rg + CLOUDS.base, Rt = Rg + CLOUDS.top;
    const az = (CLOUDS.sunAzimuth * Math.PI) / 180, el = (CLOUDS.sunElevation * Math.PI) / 180;
    gl.uniform3fv(U.uSunDir, anchor.N.map((v, i) => Math.cos(el) * (Math.cos(az) * v + Math.sin(az) * anchor.E[i]) + Math.sin(el) * anchor.U[i]));
    gl.uniform3fv(U.uUp, anchor.U);
    gl.uniform1f(U.uRb, Rb); gl.uniform1f(U.uRt, Rt); gl.uniform1f(U.uMid, (CLOUDS.base + CLOUDS.top) / 2);
    gl.uniform1f(U.uSigma, CLOUDS.density); gl.uniform1f(U.uShadow, CLOUDS.shadows);
    gl.uniform1f(U.uSize, CLOUDS.size); gl.uniform1f(U.uCover, CLOUDS.cover);
    let RES = 2; // canvas is half the screen size, scaled up by the browser (3 on slow machines)
    const resize = () => { cv.width = Math.max(1, Math.ceil(cv.clientWidth / RES)); cv.height = Math.max(1, Math.ceil(cv.clientHeight / RES)); gl.viewport(0, 0, cv.width, cv.height); };
    resize(); window.addEventListener("resize", resize);
    const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    let raf, last = performance.now(), t = 0, shown = 0, prevRange = null, glow = 0;
    let prevRaf = performance.now(), slow = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      // If the whole page is struggling while clouds are on screen, draw them at lower resolution
      const gap = now - prevRaf; prevRaf = now;
      if (shown > 0.3 && RES < 3) { slow = gap > 40 ? slow + 1 : Math.max(0, slow - 1); if (slow > 45) { RES = 3; resize(); } }
      if (now - last < 30) return; // ~30 fps is plenty for slow clouds, and leaves the map more room
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!still) t += dt;
      const m = map3dRef.current;
      const range = m && typeof m.range === "number" ? m.range : 0;
      const vIn = prevRange == null ? 0 : Math.max(0, (prevRange - range) / Math.max(dt, 1e-3)); // zoom-in speed, m/s
      prevRange = range;
      const k = Math.min(1, Math.max(0, (range - CLOUDS.start) / (CLOUDS.full - CLOUDS.start)));
      const f = Math.min(1, Math.max(0, (range - CLOUDS.fadeOut) / (CLOUDS.gone - CLOUDS.fadeOut)));
      const target = noiseOK ? k * k * (3 - 2 * k) * (1 - f * f * (3 - 2 * f)) : 0;
      shown += (target - shown) * Math.min(1, dt * 6);      // ease so it never pops
      if (shown < 0.01) { if (cv.style.opacity !== "0") { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); cv.style.opacity = "0"; } return; }
      cv.style.opacity = "1";
      // The map's camera
      const c = m.center || WORLD;
      const lat = typeof c.lat === "function" ? c.lat() : (c.lat ?? WORLD.lat), lng = typeof c.lng === "function" ? c.lng() : (c.lng ?? WORLD.lng);
      const cAlt = typeof c.altitude === "number" ? c.altitude : WORLD.altitude;
      const tilt = ((typeof m.tilt === "number" ? m.tilt : 55) * Math.PI) / 180, head = ((typeof m.heading === "number" ? m.heading : 0) * Math.PI) / 180;
      const fov = ((typeof m.fov === "number" && m.fov > 0 ? m.fov : 35) * Math.PI) / 180;
      const g = geoFrame(lat, lng, cAlt / 1000);
      const fh = add(g.N.map(v => v * Math.cos(head)), g.E, Math.sin(head));        // level "forward"
      const back = add(g.U.map(v => v * Math.cos(tilt)), fh, -Math.sin(tilt));      // from centre toward camera
      const camE = add(g.P, back, range / 1000);
      const F = back.map(v => -v), Up = add(fh.map(v => v * Math.cos(tilt)), g.U, Math.sin(tilt)), Rv = cross(F, Up);
      const camLen = Math.sqrt(dot(camE, camE));
      const tanH = Math.tan(fov / 2), aspect = cv.width / cv.height;
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, noiseTex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mapTex); gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform3fv(U.uCamE, camE); gl.uniform3fv(U.uCamA, add(camE, anchor.P, -1));
      gl.uniform1f(U.uCb, (camLen - Rb) * (camLen + Rb)); gl.uniform1f(U.uCt, (camLen - Rt) * (camLen + Rt)); gl.uniform1f(U.uCg, (camLen - Rg) * (camLen + Rg));
      gl.uniform3fv(U.uF, F); gl.uniform3fv(U.uR, Rv); gl.uniform3fv(U.uU, Up);
      gl.uniform2f(U.uTan, tanH * aspect, tanH);
      gl.uniform1f(U.uPix, (2 * tanH) / cv.height);
      // Where the map labels are on screen (so the clouds can thin out over them)
      const mm = labelsRef && labelsRef.current, lab = new Float32Array(48 * 4); let nLab = 0;
      if (mm && mm.live) for (const lm of mm.live) {
        if (!lm.attached || nLab >= 48) continue;
        const lp = geoFrame(lm.loc.lat, lm.loc.lng, (WORLD.altitude + (mm.altitudes[lm.idx] || 0)) / 1000).P;
        const v = add(lp, camE, -1), z = dot(v, F); if (z <= 0.01) continue;
        const nx = dot(v, Rv) / (z * tanH * aspect), ny = dot(v, Up) / (z * tanH);
        if (Math.abs(nx) > 1.3 || Math.abs(ny) > 1.3) continue;
        const lw = (lm.el._lw || 240) / RES, lh = (lm.el._lh || 60) / RES;
        lab.set([(nx + 1) / 2 * cv.width, (ny + 1) / 2 * cv.height + lh / 2, lw / 2, lh / 2], nLab * 4); nLab++;
      }
      gl.uniform4fv(U.uLab, lab); gl.uniform1i(U.uLabN, nLab);
      gl.uniform3fv(U.uWind, anchor.E.map(v => v * t * CLOUDS.wind));
      // Clear patch in the middle: smaller from higher up, gone once Ullo is a speck
      const above = Math.min(1, Math.max(CLOUDS.minScale, CLOUDS.full / Math.max(range, 1)));
      gl.uniform1f(U.uHole, (0.42 - 0.22 * shown) * (0.45 + 0.55 * above));
      const hz = Math.min(1, Math.max(0, (range - 30000) / 170000));
      gl.uniform1f(U.uHoleAmt, 1 - hz * hz * (3 - 2 * hz));
      gl.uniform1f(U.uShown, shown); gl.uniform1f(U.uMaxA, CLOUDS.maxOpacity);
      // Bloom while zooming in through the cloud layer
      const band = Math.max(0, 4 * shown * (1 - shown));           // strongest mid-way through the clouds
      const want = still ? 0 : Math.min(1, vIn / CLOUDS.flareSpeed) * band * CLOUDS.flare;
      glow += (want - glow) * Math.min(1, dt * (want > glow ? 7 : 1.8)); // quick to rise, slow to fade
      gl.uniform1f(U.uGlow, glow > 0.01 ? glow : 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); gl.deleteTexture(noiseTex); gl.deleteTexture(mapTex); gl.deleteProgram(prog); gl.deleteBuffer(buf); };
  }, [map3dRef, labelsRef]);
  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none", opacity: 0, transition: "opacity .4s" }} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UlloExplorer({ session, profile, onSignIn }) {
  const [sbOpen, setSbOpen] = useState(true);
  const [query, setQuery] = useState("");
  const pendingLoc = useRef(null);
  const [apiKey, setApiKey]           = useState(GOOGLE_API_KEY || "");
  const [keyInput, setKeyInput]       = useState("");
  const [mapReady, setMapReady]       = useState(false);
  const [mapLoading, setMapLoading]   = useState(true);
  const [activeLoc, setActiveLoc]     = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAdmin, setShowAdmin]     = useState(false);
  const [showPanel, setShowPanel]     = useState(false);
  const [showDroneIntro, setShowDroneIntro] = useState(false);
  const [droneAvail, setDroneAvail]  = useState({});
  const [focusMode, setFocusMode]    = useState(false);
  const [focusPhoto, setFocusPhoto]  = useState(null);
  const [focusHighlight, setFocusHighlight] = useState(null);
  const focusMarkersRef = useRef(new Map());
  const focusPolyRef = useRef(null);
  const [panelMin, setPanelMin]       = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue]     = useState("");
  const [localEdits, setLocalEdits]   = useState({});
  const [uploadMode, setUploadMode]   = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState("");
  const fileInputRef = useRef(null);

  const mapRef    = useRef(null);
  const map3dRef  = useRef(null);
  const initRef   = useRef(false);
  const markers   = useRef(null);
  const camera    = useRef(null);

  const visibleLocs = activeSection ? ALL_LOCATIONS.filter(l => l.sectionKey === activeSection) : ALL_LOCATIONS;

  useEffect(() => {
    const ids = ALL_LOCATIONS.map(l => l.id);
    const avail = {};
    Promise.all(ids.map(id =>
      fetch(mediaUrl("/drone/" + id + ".m4v"), { method: "HEAD" })
        .then(r => { if (r.ok) avail[id] = true; })
        .catch(() => {})
    )).then(() => setDroneAvail(avail));
  }, []);

  const selectLoc = useCallback((loc) => {
    setActiveLoc(loc);
    setShowPanel(false);
    setShowDroneIntro(false);
    setPanelMin(false);
    markers.current?.isolate(loc.id);
    camera.current?.flyAndOrbit(loc);
  }, []);

  const closeLoc = useCallback(() => {
    camera.current?.resetView();
    markers.current?.restore();
    setActiveLoc(null);
    setShowPanel(false);
    setShowDroneIntro(false);
    setEditingField(null);
    setUploadMode(null);
    setUploadMsg("");
  }, []);

  const openPanel = useCallback(() => {
    if (activeLoc && droneAvail[activeLoc.id]) {
      setShowDroneIntro(true);
    } else {
      setShowPanel(true);
      setPanelMin(false);
    }
  }, [activeLoc, droneAvail]);

  const skipDroneIntro = useCallback(() => {
    setShowDroneIntro(false);
    setShowPanel(true);
    setPanelMin(false);
  }, []);

  const changeSection = useCallback((key) => {
    camera.current?.stop();
    markers.current?.setSection(key);
    setActiveSection(key);
    setActiveLoc(null);
    setShowPanel(false);
    setShowDroneIntro(false);
  }, []);

  const resetView = useCallback(() => {
    camera.current?.resetView();
    markers.current?.restore();
    setActiveLoc(null);
    setShowPanel(false);
    setShowDroneIntro(false);
    setFocusMode(false);
    setFocusPhoto(null);
    cleanupFocusMarkers();
  }, []);

  const cleanupFocusMarkers = () => {
    focusMarkersRef.current.forEach(({ el }) => el.remove());
    focusMarkersRef.current = new Map();
    if (focusPolyRef.current) { focusPolyRef.current.remove(); focusPolyRef.current = null; }
  };

  const enterFocusMode = useCallback(() => {
    setShowPanel(false);
    setShowDroneIntro(false);
    setFocusMode(true);
    setFocusPhoto(null);
    setFocusHighlight(null);
    markers.current?.hideAll();
    const map3d = map3dRef.current;
    if (map3d) {
      map3d.flyCameraTo({
        endCamera: { center: { lat: 10.6877, lng: -2.5616, altitude: 284 }, range: 450, tilt: 0, heading: 0 },
        durationMillis: 2000,
      });
      setTimeout(async () => {
        const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
        try {
          const coords = CLINIC_BOUNDARY_IDS.map(id => {
            const p = CLINIC_FOCUS_POINTS.find(fp => fp.id === id);
            return { lat: p.lat, lng: p.lng, altitude: p.alt + 2 };
          });
          coords.push(coords[0]);
          const poly = document.createElement("gmp-polyline-3d");
          poly.setAttribute("altitude-mode", "absolute");
          poly.setAttribute("stroke-color", "#cedc00");
          poly.setAttribute("stroke-width", "4");
          const coordsEl = document.createElement("gmp-polyline-3d-coordinates");
          coordsEl.textContent = coords.map(c => `${c.lat},${c.lng},${c.altitude}`).join(" ");
          poly.appendChild(coordsEl);
          map3d.appendChild(poly);
          focusPolyRef.current = poly;
        } catch(e) { console.warn("Polyline not supported:", e); }
        CLINIC_FOCUS_POINTS.forEach(fp => {
          const marker = new Marker3DInteractiveElement({
            position: { lat: fp.lat, lng: fp.lng, altitude: fp.markerAlt || 15 },
            altitudeMode: "RELATIVE_TO_GROUND",
            extruded: true,
          });
          marker.title = fp.name;
          let img;
          if (fp.corner) {
            img = buildCornerTag(fp.name);
          } else {
            img = buildFocusDot();
          }
          const tmpl = document.createElement("template");
          tmpl.content.appendChild(img);
          marker.appendChild(tmpl);
          marker.addEventListener("gmp-click", (e) => { setFocusHighlight(fp.id); setFocusPhoto(fp); e.stopPropagation(); });
          map3d.appendChild(marker);
          focusMarkersRef.current.set(fp.id, { el: marker, fp });
        });
      }, 2500);
    }
  }, []);

  const exitFocusMode = useCallback(() => {
    cleanupFocusMarkers();
    setFocusMode(false);
    setFocusPhoto(null);
    setFocusHighlight(null);
    // Return to the location's detail panel instead of fully exiting
    if (activeLoc) {
      markers.current?.isolate(activeLoc.id);
      camera.current?.flyAndOrbit(activeLoc);
      setShowPanel(true);
      setPanelMin(false);
    } else {
      camera.current?.resetView();
      markers.current?.restore();
    }
  }, [activeLoc]);

  useEffect(() => {
    if (!focusMode) return;
    const map3d = map3dRef.current;
    if (!map3d) return;
    focusMarkersRef.current.forEach(({ el, fp }, id) => {
      if (fp.corner) return;
      while (el.firstChild) el.removeChild(el.firstChild);
      const isHighlighted = id === focusHighlight;
      const img = isHighlighted ? buildFocusLabel(fp.name) : buildFocusDot();
      const tmpl = document.createElement("template");
      tmpl.content.appendChild(img);
      el.appendChild(tmpl);
      el.position = { lat: fp.lat, lng: fp.lng, altitude: isHighlighted ? 80 : (fp.markerAlt || 15) };
    });
  }, [focusHighlight, focusMode]);

  const selectFocusPoint = (fp) => {
    setFocusHighlight(prev => prev === fp.id ? null : fp.id);
  };

  const viewFocusPhoto = (fp) => {
    setFocusPhoto(fp);
  };

  const focusListOrder = [...CLINIC_FOCUS_POINTS.filter(fp => !fp.corner), ...CLINIC_FOCUS_POINTS.filter(fp => fp.corner)];

  useEffect(() => {
    if (!focusMode || focusPhoto) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const curIdx = focusHighlight ? focusListOrder.findIndex(fp => fp.id === focusHighlight) : -1;
        let next;
        if (e.key === "ArrowDown") next = curIdx < focusListOrder.length - 1 ? curIdx + 1 : 0;
        else next = curIdx > 0 ? curIdx - 1 : focusListOrder.length - 1;
        setFocusHighlight(focusListOrder[next].id);
      } else if (e.key === "Enter" && focusHighlight) {
        const fp = focusListOrder.find(fp => fp.id === focusHighlight);
        if (fp) setFocusPhoto(fp);
      } else if (e.key === "Escape") {
        if (focusHighlight) setFocusHighlight(null);
        else exitFocusMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode, focusPhoto, focusHighlight]);

  const navLoc = (dir) => {
    if (!activeLoc) return;
    setEditingField(null);
    setUploadMode(null);
    setUploadMsg("");
    setShowDroneIntro(false);
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

  const startEdit = (field) => {
    if (!activeLoc) return;
    const edits = localEdits[activeLoc.id] || {};
    const current = field === "name"
      ? (edits.name ?? activeLoc.name)
      : (edits.description ?? activeLoc.description ?? "");
    setEditValue(current);
    setEditingField(field);
  };

  const saveEdit = () => {
    if (!activeLoc || !editingField) return;
    setLocalEdits(prev => ({
      ...prev,
      [activeLoc.id]: { ...prev[activeLoc.id], [editingField]: editValue },
    }));
    const sec = SECTIONS[activeLoc.sectionKey];
    if (sec) {
      const sub = sec.subsections.find(s => s.id === activeLoc.id);
      if (sub) sub[editingField] = editValue;
    }
    setActiveLoc(prev => ({ ...prev, [editingField]: editValue }));
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getLocValue = (loc, field) => {
    return localEdits[loc.id]?.[field] ?? loc[field] ?? "";
  };

  const startUpload = (mode) => {
    setUploadMode(mode);
    setUploadMsg("");
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeLoc) { setUploadMode(null); return; }
    setUploading(true);
    setUploadMsg(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);

    const results = [];
    for (const file of files) {
      const ts = Date.now();
      const ext = file.name.split(".").pop();
      const path = `${mediaFolder(activeLoc)}/${ts}_${file.name}`;

      const { data, error } = await supabase.storage.from("pano").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Upload error:", error);
        setUploadMsg(`Error: ${error.message}`);
        setUploading(false);
        setUploadMode(null);
        e.target.value = "";
        return;
      }

      const { data: urlData } = supabase.storage.from("pano").getPublicUrl(path);
      results.push(urlData.publicUrl);
      folderVideoCache.delete(mediaFolder(activeLoc)); // re-list after upload
    }

    const sec = SECTIONS[activeLoc.sectionKey];
    const sub = sec?.subsections.find(s => s.id === activeLoc.id);

    if (uploadMode === "photo") {
      const newPhotos = results.map(url => ({ url, yaw: 0, pitch: 0, hfov: 110 }));
      if (sub) {
        sub.photoUrls = [...(sub.photoUrls || []), ...newPhotos];
        if (!sub.photoUrl) sub.photoUrl = results[0];
      }
      setActiveLoc(prev => ({
        ...prev,
        photoUrls: [...(prev.photoUrls || []), ...newPhotos],
        photoUrl: prev.photoUrl || results[0],
      }));
    } else {
      if (sub) {
        sub.videoUrls = [...(sub.videoUrls || []), ...results];
      }
      setActiveLoc(prev => ({
        ...prev,
        videoUrls: [...(prev.videoUrls || []), ...results],
      }));
    }

    setUploadMsg(`${results.length} ${uploadMode === "photo" ? "photo" : "video"}${results.length > 1 ? "s" : ""} uploaded`);
    setTimeout(() => setUploadMsg(""), 3000);
    setUploading(false);
    setUploadMode(null);
    e.target.value = "";
  };

  const initMap = useCallback(async (key) => {
    if (!mapRef.current || initRef.current) return;
    initRef.current = true;
    if (!window.google?.maps) {
      await new Promise(r => { const s = document.createElement("script"); s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=${MAPS_CHANNEL}&libraries=maps3d`; s.async = true; s.onload = r; document.head.appendChild(s); });
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
        // Make sure the label fonts are loaded before labels are drawn to canvas
        try { await Promise.race([Promise.all([document.fonts.load('600 12px Inter'), document.fonts.load('500 8px "JetBrains Mono"')]), new Promise(r => setTimeout(r, 1500))]); } catch (_) {}
        markers.current = new MarkerManager(map3d, LABELED_LOCATIONS, Marker3DInteractiveElement, selectLoc);
      } catch (err) { console.error("MarkerManager init failed:", err); }
    }, 1200);
  }, [selectLoc]);

  useEffect(() => { if (apiKey && !initRef.current) initMap(apiKey); }, [apiKey, initMap]);
  useEffect(() => {
    if (markers.current) { activeSection ? markers.current.setSection(activeSection) : markers.current.clearSection(); }
    if (pendingLoc.current) { const l = pendingLoc.current; pendingLoc.current = null; selectLoc(l); }
  }, [activeSection]);
  useEffect(() => () => { markers.current?.dispose(); camera.current?.stop(); }, []);

  // Pick a location from the sidebar or search; switch category first if needed
  const pickLoc = (loc) => {
    if (activeSection && loc.sectionKey !== activeSection) { pendingLoc.current = loc; setActiveSection(loc.sectionKey); }
    else selectLoc(loc);
  };
  const SB_W = sbOpen ? 288 : 48;
  const q = query.trim().toLowerCase();
  const searchHits = q ? ALL_LOCATIONS.filter(l => l.name.toLowerCase().includes(q) || (l.sectionLabel || "").toLowerCase().includes(q) || (l.tags || []).some(t => t.toLowerCase().includes(q))) : null;
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email || "";
  const coordStr = (lat, lng, d = 4) => lat.toFixed(d) + "°N  " + Math.abs(lng).toFixed(d) + "°W";
  const roleTag = profile?.role === "admin" ? "orange" : profile?.role === "member" ? "green" : "";

  if (profile?.restricted) return (
    <div className="px" style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div className="px-panel" style={{ maxWidth: 420, width: "100%" }}>
        <div className="px-bar"><span className="px-sq" style={{ background: "var(--red)" }} /><span className="px-title">Access Restricted</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="px-callout err">Your account has been restricted by an administrator. If you believe this is an error, contact an EWB-ISU team lead.</div>
          <button className="px-btn danger" style={{ alignSelf: "flex-start" }} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    </div>
  );

  if (!apiKey) return (
    <div className="px" style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div className="px-panel" style={{ maxWidth: 440, width: "100%" }}>
        <div className="px-bar"><span className="px-glyph">U</span><span className="px-title">Ullo Explorer</span><span className="px-tag" style={{ marginLeft: "auto" }}>CONFIG</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="px-label">Google Maps API key</div>
          <input className="px-input px-mono" type="text" placeholder="AIzaSy…" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && keyInput.startsWith("AIza")) setApiKey(keyInput); }} />
          <button className="px-btn pri lg" onClick={() => { if (keyInput.startsWith("AIza")) setApiKey(keyInput); }}>Launch explorer <span className="i">→</span></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px" style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: C.bg }}>
      <style>{GLOBAL_CSS}</style>

      <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
      {mapReady && <CloudLayer map3dRef={map3dRef} labelsRef={markers} />}

      {mapLoading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: C.bg }}>
          <div className="px-spin" />
          <div className="px-label">Loading terrain · Ullo, Upper West Region</div>
        </div>
      )}

      {/* ── Docked sidebar (navigation, search, categories, account) ── */}
      <div className="px-side" style={{ width: SB_W, display: focusMode ? "none" : "flex" }}>
        {sbOpen ? (<>
          <div className="px-bar" style={{ minHeight: 48, gap: 10 }}>
            <span className="px-glyph" style={{ width: 24, height: 24, fontSize: 11 }}>U</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span className="px-title" style={{ fontSize: 12, letterSpacing: 1.6 }}>Ullo Explorer</span>
              <span className="px-mono px-dim" style={{ fontSize: 9, letterSpacing: .4, whiteSpace: "nowrap" }}>EWB–ISU · UPPER WEST REGION, GH</span>
            </div>
            <button className="px-btn min icon sm" style={{ marginLeft: "auto", width: 24, height: 24 }} title="Collapse sidebar" onClick={() => setSbOpen(false)}>«</button>
          </div>

          <div style={{ padding: "10px 10px 6px" }}>
            <div style={{ position: "relative" }}>
              <span className="px-dim" style={{ position: "absolute", left: 9, top: 9, display: "flex", pointerEvents: "none" }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/></svg></span>
              <input className="px-input" style={{ height: 30, paddingLeft: 26, fontSize: 12 }} placeholder="Search locations…" value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setQuery(""); if (e.key === "Enter" && searchHits?.length) pickLoc(searchHits[0]); }} />
              {query && <button className="px-btn min icon sm" style={{ position: "absolute", right: 3, top: 4, width: 22, height: 22 }} onClick={() => setQuery("")}>✕</button>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", padding: "6px 12px 6px" }}>
            <span className="px-label">{searchHits ? "Results" : "Categories"}</span>
            <span className="px-tag" style={{ marginLeft: "auto" }}>{searchHits ? searchHits.length + " MATCH" + (searchHits.length === 1 ? "" : "ES") : ALL_LOCATIONS.length + " OBJ"}</span>
          </div>

          <div className="px-scroll" style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--line2)" }}>
            {Object.entries(SECTIONS).map(([key, sec]) => {
              const locs = ALL_LOCATIONS.filter(l => l.sectionKey === key && (!searchHits || searchHits.includes(l)));
              if (searchHits && !locs.length) return null;
              const open = searchHits ? true : activeSection === key;
              return (
                <div key={key}>
                  <button className={"px-cat" + (activeSection === key ? " on" : "")} onClick={() => { if (!searchHits) changeSection(activeSection === key ? null : key); }}>
                    <span className="px-sq" style={{ background: sec.color }} />
                    <span style={{ flex: 1, textAlign: "left" }}>{sec.label}</span>
                    <span className="px-mono" style={{ fontSize: 10, color: "var(--faint)" }}>{locs.length}</span>
                    {!searchHits && <span className="px-mono px-dim" style={{ fontSize: 10, width: 10 }}>{open ? "▾" : "▸"}</span>}
                  </button>
                  {open && (
                    <div style={{ padding: "2px 0 6px", background: "rgba(17,20,24,.35)", borderBottom: "1px solid var(--line2)" }}>
                      {locs.map((loc, i) => { const isA = activeLoc?.id === loc.id; return (
                        <button key={loc.id} className={"px-item" + (isA ? " on" : "")} style={{ paddingLeft: 20, height: 30 }} onClick={() => pickLoc(loc)}>
                          <span className="n">{String(i + 1).padStart(2, "0")}</span>
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.name}</span>
                          {WATER_TESTS[loc.id] && <span className="px-tag blue" style={{ height: 16, fontSize: 8.5 }}>H₂O</span>}
                          {!loc.realCoords && <span className="px-tag" title="Approximate position" style={{ height: 16, fontSize: 8.5 }}>~GPS</span>}
                        </button>); })}
                    </div>
                  )}
                </div>
              );
            })}
            {searchHits && !searchHits.length && <div className="px-mono px-dim" style={{ padding: 14, fontSize: 10.5 }}>NO LOCATIONS MATCH “{query.toUpperCase()}”</div>}
          </div>

          <div style={{ borderTop: "1px solid var(--line)", background: "var(--panel2)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {session ? (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="px-glyph" style={{ width: 26, height: 26, fontSize: 11, color: "var(--tx)", background: "var(--head)", borderColor: "var(--line)" }}>{(userName[0] || "?").toUpperCase()}</span>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
                  {session?.user?.user_metadata?.full_name && <span className="px-mono px-dim" style={{ fontSize: 9.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</span>}
                </div>
                <span className={"px-tag " + roleTag}>{(profile?.role || "supporter").toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="px-btn" style={{ flex: 1 }} onClick={resetView}><span className="i">⌂</span>Reset view</button>
                {profile?.role === "admin" && <button className="px-btn" onClick={() => setShowAdmin(true)}>Users</button>}
                <button className="px-btn out" onClick={() => supabase.auth.signOut()}>Sign out</button>
              </div>
            </>) : (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="px-glyph" style={{ width: 26, height: 26, fontSize: 11, color: "var(--mut)", background: "var(--head)", borderColor: "var(--line)" }}>◎</span>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Viewing as guest</span>
                  <span className="px-mono px-dim" style={{ fontSize: 9.5 }}>EWB-ISU MEMBERS CAN SIGN IN</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="px-btn" style={{ flex: 1 }} onClick={resetView}><span className="i">⌂</span>Reset view</button>
                <button className="px-btn pri" onClick={onSignIn}>Sign in</button>
              </div>
            </>)}
          </div>
        </>) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "10px 0", gap: 6 }}>
            <button className="px-btn min icon" title="Expand sidebar" onClick={() => setSbOpen(true)}><span className="px-glyph" style={{ width: 24, height: 24, fontSize: 11 }}>U</span></button>
            <button className="px-btn min icon" title="Search" onClick={() => setSbOpen(true)}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/></svg></button>
            <div style={{ width: 24, height: 1, background: "var(--line)", margin: "4px 0" }} />
            {Object.entries(SECTIONS).map(([key, sec]) => (
              <button key={key} className={"px-btn min icon" + (activeSection === key ? " railon" : "")} title={sec.label}
                onClick={() => { changeSection(activeSection === key ? null : key); setSbOpen(true); }}>
                <span className="px-sq" style={{ background: sec.color, width: 10, height: 10 }} />
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button className="px-btn min icon" title="Reset view" onClick={resetView}>⌂</button>
            <button className="px-btn min icon" title="Expand sidebar" onClick={() => setSbOpen(true)}>»</button>
          </div>
        )}
      </div>

      {/* ── Welcome ── */}
      {mapReady && showWelcome && !activeLoc && (
        <div className="px-panel" style={{ position: "absolute", top: "50%", left: `calc(50% + ${SB_W / 2}px)`, transform: "translate(-50%,-50%)", zIndex: 150, width: 400, maxWidth: "calc(100vw - 32px)" }}>
          <div className="px-bar"><span className="px-glyph">U</span><span className="px-title">Ullo Explorer</span><span className="px-tag" style={{ marginLeft: "auto" }}>{ALL_LOCATIONS.length} OBJECTS</span></div>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Water, sanitation &amp; community infrastructure in Ullo, Ghana</div>
            <p className="px-muted" style={{ fontSize: 12.5, lineHeight: 1.7 }}>Labels on the map mark confirmed GPS locations. Click a label, or pick a category in the sidebar, to inspect 360° imagery, drone footage and field data.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="px-btn pri lg" onClick={() => setShowWelcome(false)}>Start exploring <span className="i">→</span></button>
            </div>
          </div>
        </div>
      )}


      {activeLoc && !showPanel && !showDroneIntro && !focusMode && (
        <div className="px-panel" style={{ position: "absolute", bottom: 24, left: `calc(50% + ${SB_W / 2}px)`, transform: "translateX(-50%)", zIndex: 200, pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 12px", animation: "pxInCenter .35s ease both", animationDelay: "1.2s" }}>
          <span className="px-sq" style={{ background: activeLoc.sectionColor || C.blue }} />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{getLocValue(activeLoc, "name")}</span>
            <span className="px-mono px-dim" style={{ fontSize: 9.5 }}>{(activeLoc.sectionLabel || "").toUpperCase()}</span>
          </div>
          <button className="px-btn pri" style={{ marginLeft: 8 }} onClick={openPanel}>Open details <span className="i">↗</span></button>
          <button className="px-btn out icon" onClick={closeLoc}>✕</button>
        </div>
      )}

      {/* ── Focus mode ── */}
      {focusMode && (
        <>
          <div style={{ position: "absolute", inset: 0, zIndex: 590, pointerEvents: "none", boxShadow: "inset 0 0 120px 60px rgba(0,0,0,0.5)", background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)" }} />
          <div className="px-panel" style={{ position: "absolute", top: 12, left: 12, bottom: 12, width: 248, zIndex: 600, pointerEvents: "auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="px-bar"><span className="px-sq" style={{ background: "#60A5FA" }} /><span className="px-title">Site Locations</span></div>
            <div className="px-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {CLINIC_FOCUS_POINTS.filter(fp => !fp.corner).map(fp => {
                const sel = focusHighlight === fp.id;
                return (
                  <div key={fp.id} className={"px-item" + (sel ? " on" : "")} onMouseEnter={() => setFocusHighlight(fp.id)} onClick={() => viewFocusPhoto(fp)}>
                    <span className="px-sq" style={{ background: "#60A5FA", borderRadius: "50%" }} />
                    <span style={{ flex: 1 }}>{fp.name}</span>
                    {sel && <button className="px-btn sm pri" onClick={(e) => { e.stopPropagation(); viewFocusPhoto(fp); }}>360°</button>}
                  </div>
                );
              })}
              <div className="px-label" style={{ padding: "10px 12px 4px" }}>Corner posts</div>
              {CLINIC_FOCUS_POINTS.filter(fp => fp.corner).map(fp => {
                const sel = focusHighlight === fp.id;
                return (
                  <div key={fp.id} className={"px-item" + (sel ? " on" : "")} onMouseEnter={() => setFocusHighlight(fp.id)} onClick={() => viewFocusPhoto(fp)}>
                    <span className="px-sq" style={{ background: "var(--orange)" }} />
                    <span style={{ flex: 1 }}>{fp.name}</span>
                    {sel && <button className="px-btn sm warn" onClick={(e) => { e.stopPropagation(); viewFocusPhoto(fp); }}>360°</button>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="px-panel" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 600, pointerEvents: "none", display: "flex", alignItems: "center", gap: 10, height: 34, padding: "0 12px" }}>
            <span className="px-tag orange">FOCUS MODE</span>
            <span className="px-muted" style={{ fontSize: 12 }}>Ullo Clinic Site Boundary</span>
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 600, pointerEvents: "auto" }}>
            <button className="px-btn" onClick={exitFocusMode}><span className="i">✕</span>Exit focus mode</button>
          </div>
          {focusPhoto && (
            <div style={{ position: "absolute", inset: 0, zIndex: 700, background: "rgba(17,20,24,0.9)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
              <div className="px-bar" style={{ minHeight: 44, padding: "0 14px" }}>
                <span className="px-sq" style={{ background: focusPhoto.corner ? "var(--orange)" : "#60A5FA" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{focusPhoto.name}</span>
                <span className="px-tag">{coordStr(focusPhoto.lat, focusPhoto.lng, 6)}</span>
                <button className="px-btn out icon" style={{ marginLeft: "auto" }} onClick={() => setFocusPhoto(null)}>✕</button>
              </div>
              <div style={{ flex: 1, padding: 14 }}>
                <PanoViewer photoUrl={"/pano/clinic_site/" + focusPhoto.file} locationName={focusPhoto.name} tall={true} />
              </div>
            </div>
          )}
        </>
      )}

      {activeLoc && showDroneIntro && droneAvail[activeLoc.id] && (
        <DroneIntro url={activeLoc.droneVideoUrl} locationName={activeLoc.name} onSkip={skipDroneIntro} />
      )}

      {/* ── Detail panel ── */}
      {activeLoc && showPanel && (<>
        {!panelMin && <div onClick={closeLoc} style={{ position: "absolute", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.35)", pointerEvents: "auto" }} />}
        <div className={panelMin ? "px-panel" : ""} style={{
          position: "absolute", zIndex: 501,
          ...(panelMin ? { bottom: 16, right: 16, width: "40%", maxWidth: 480, height: "45%" } : { top: 0, left: 0, right: 0, bottom: 0, background: "var(--app)" }),
          overflow: "hidden", display: "flex", flexDirection: "column",
          transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)", pointerEvents: "auto",
        }}>
          <div className="px-bar" style={{ minHeight: panelMin ? 38 : 48, padding: panelMin ? "0 10px" : "0 16px", gap: 10 }}>
            <span className="px-sq" style={{ background: activeLoc.sectionColor || C.blue }} />
            <span className="px-label" style={{ color: "var(--mut)" }}>{activeLoc.sectionLabel}</span>
            <span className="px-dim">/</span>
            {editingField === "name" ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
                <input className="px-input" style={{ height: 28, fontSize: 14, fontWeight: 600 }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} />
                <button className="px-btn pri" onClick={saveEdit}>Save</button>
                <button className="px-btn out" onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <h2 style={{ fontSize: panelMin ? 13 : 16, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getLocValue(activeLoc, "name")}</h2>
            )}
            {!panelMin && WATER_TESTS[activeLoc.id] && <span className="px-tag blue">WATER DATA</span>}
            <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexShrink: 0 }}>
              <button className="px-btn out icon" onClick={() => setPanelMin(!panelMin)} title={panelMin ? "Expand" : "Minimize"}>{panelMin ? "⤢" : "⤡"}</button>
              <button className="px-btn out icon" onClick={closeLoc} title="Close">✕</button>
            </div>
          </div>

          <div className="px-scroll" style={{ overflowY: "auto", flex: 1, padding: panelMin ? 10 : "14px 16px 20px" }}>
            <div style={{ maxWidth: panelMin ? "none" : 1400, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <span className="px-tag">{coordStr(activeLoc.lat, activeLoc.lng)}</span>
                <span className="px-tag">JIRAPA DISTRICT · UPPER WEST</span>
                {!activeLoc.realCoords && <span className="px-tag orange">APPROX. POSITION</span>}
                <span style={{ flex: 1 }} />
                {droneAvail[activeLoc.id] && <button className="px-btn" onClick={() => { setShowPanel(false); setShowDroneIntro(true); }}><span className="i">▶</span>Drone flyover</button>}
                {activeLoc.id === "c1" && <button className="px-btn warn" onClick={enterFocusMode}><span className="i">◎</span>Focus mode · clinic boundary</button>}
              </div>

              <MediaViewer loc={activeLoc} tall={!panelMin} />

              {editingField === "description" ? (
                <div style={{ marginTop: 14 }}>
                  <textarea className="px-input" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus rows={6} />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="px-btn pri" onClick={saveEdit}>Save</button>
                    <button className="px-btn out" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                getLocValue(activeLoc, "description") && (
                  <div style={{ marginTop: 14 }}>
                    <div className="px-label" style={{ marginBottom: 6 }}>Description</div>
                    <p className="px-muted" style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-line", maxWidth: 820 }}>{getLocValue(activeLoc, "description")}</p>
                  </div>
                )
              )}
              {activeLoc.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>{activeLoc.tags.map(tag => <span key={tag} className="px-tag">{tag}</span>)}</div>}

              <div style={{ display: "grid", gridTemplateColumns: panelMin ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: 14, alignItems: "start" }}>
                {WATER_TESTS[activeLoc.id] && <WaterTestCard t={WATER_TESTS[activeLoc.id]} />}
                {activeLoc.sectionKey === "boreholes" && activeLoc.data && <BoreholeDataCard data={activeLoc.data} />}
              </div>

              {(canEdit(profile) || canUpload(profile) || isAdmin(profile)) && (
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div className="px-label" style={{ marginBottom: 8 }}>Actions</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {canEdit(profile) && editingField !== "description" && <button className="px-btn" onClick={() => startEdit("description")}><span className="i">✎</span>Edit description</button>}
                    {canEdit(profile) && editingField !== "name" && <button className="px-btn" onClick={() => startEdit("name")}><span className="i">✎</span>Edit name</button>}
                    {canUpload(profile) && <button className="px-btn" onClick={() => startUpload("photo")} disabled={uploading}><span className="i">↑</span>Upload photos</button>}
                    {canUpload(profile) && <button className="px-btn" onClick={() => startUpload("video")} disabled={uploading}><span className="i">↑</span>Upload video</button>}
                    {isAdmin(profile) && <button className="px-btn warn" onClick={() => alert("Edit Coordinates — coming soon")}><span className="i">⌖</span>Edit coordinates</button>}
                    {isAdmin(profile) && <button className="px-btn warn" onClick={() => alert("Add Location — coming soon")}><span className="i">+</span>Add location</button>}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple
                accept={uploadMode === "video" ? "video/*" : "image/*"}
                onChange={handleFileSelect}
                style={{ display: "none" }} />
              {uploadMsg && (
                <div className={"px-callout " + (uploading ? "info" : "ok")} style={{ marginTop: 10, alignItems: "center" }}>
                  {uploading && <span className="px-spin" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                  {uploadMsg}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, padding: panelMin ? "6px 10px" : "8px 16px", borderTop: "1px solid var(--line)", background: "var(--panel)", flexShrink: 0 }}>
            <button className="px-btn" style={{ flex: 1 }} onClick={() => navLoc("prev")}><span className="i">←</span>Previous</button>
            <button className="px-btn" style={{ flex: 1 }} onClick={() => navLoc("next")}>Next<span className="i">→</span></button>
          </div>
        </div>
      </>)}

      {showAdmin && <AdminPanel currentUser={session?.user} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
