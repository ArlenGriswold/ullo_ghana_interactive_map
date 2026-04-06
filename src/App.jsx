import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";

// ─── Constants ───────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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
function buildFocusDot() {
  const DPR = 2, r = 5 * DPR;
  const cv = document.createElement("canvas");
  cv.width = r * 4; cv.height = r * 4;
  const ctx = cv.getContext("2d");
  const cx = cv.width / 2, cy = cv.height / 2;
  // Glow
  const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2);
  grad.addColorStop(0, "rgba(96,165,250,0.6)");
  grad.addColorStop(0.5, "rgba(96,165,250,0.15)");
  grad.addColorStop(1, "rgba(96,165,250,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cv.width, cv.height);
  // Core dot
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#60A5FA";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const img = document.createElement("img");
  img.src = cv.toDataURL(); img.width = cv.width / DPR; img.height = cv.height / DPR;
  return img;
}

function buildFocusLabel(name) {
  const DPR = 2;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const fontSize = 9 * DPR;
  ctx.font = `700 ${fontSize}px "Roboto Slab",Georgia,serif`;
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
  grad.addColorStop(0, "rgba(96,165,250,0.6)");
  grad.addColorStop(1, "rgba(96,165,250,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(dotCx - dotR * 2, 0, dotR * 6, cv.height);
  // Core dot
  ctx.beginPath();
  ctx.arc(dotCx, cy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#60A5FA";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Tag bg
  const tx = leftPad + dotR * 2 + gap;
  const ty = (cv.height - tagH) / 2;
  ctx.fillStyle = "rgba(30,60,120,0.85)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, tagW, tagH, 4 * DPR);
  ctx.fill();
  ctx.strokeStyle = "rgba(96,165,250,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `700 ${fontSize}px "Roboto Slab",Georgia,serif`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, tx + padX, cy);
  const img = document.createElement("img");
  img.src = cv.toDataURL(); img.width = cv.width / DPR; img.height = cv.height / DPR;
  return img;
}

function buildCornerTag(name) {
  const DPR = 2;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const fontSize = 9 * DPR;
  ctx.font = `800 ${fontSize}px "Roboto Slab",Georgia,serif`;
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
  ctx.fillStyle = "#cedc00";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const tx = leftPad + dotR * 2 + gap;
  const ty = (cv.height - tagH) / 2;
  ctx.fillStyle = "rgba(60,60,60,0.85)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, tagW, tagH, 4 * DPR);
  ctx.fill();
  ctx.strokeStyle = "rgba(206,220,0,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `800 ${fontSize}px "Roboto Slab",Georgia,serif`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, tx + padX, cy);
  const img = document.createElement("img");
  img.src = cv.toDataURL(); img.width = cv.width / DPR; img.height = cv.height / DPR;
  return img;
}

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
  const photo = photos[idx] || null;
  const photoUrl_ = photo?.url || "";
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); }, [locationName]);
  useEffect(() => {
    if (!photoUrl_ || !ref.current) return;
    const p = photos.find(x => x.url === photoUrl_) || { url: photoUrl_, yaw: 0, pitch: 0, hfov: 110 };
    (async () => {
      if (!document.getElementById("pann-css")) { const l = document.createElement("link"); l.id = "pann-css"; l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"; document.head.appendChild(l); }
      if (!window.pannellum) { await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"; s.onload = r; document.head.appendChild(s); }); }
      if (vRef.current) vRef.current.destroy();
      vRef.current = window.pannellum.viewer(ref.current, {
        type: "equirectangular", panorama: p.url, autoLoad: true,
        yaw: p.yaw, pitch: p.pitch, hfov: p.hfov,
        compass: true, showZoomCtrl: true, showFullscreenCtrl: true, title: locationName,
      });
      if (coordsRef.current) cancelAnimationFrame(coordsRef.current);
      const poll = () => {
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

  const copyCoords = () => {
    const c = liveCoords.current;
    const text = `{url:"${photoUrl_}",yaw:${c.yaw},pitch:${c.pitch},hfov:${c.hfov}}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  if (!photos.length) return (
    <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>📷</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>360° photo not yet added</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, position: "relative" }}>
        <div ref={ref} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1000, background: "rgba(0,0,0,0.75)", borderRadius: 6, padding: "6px 10px", fontFamily: "monospace", fontSize: 11, color: "#0f0", display: "flex", gap: 12, alignItems: "center", pointerEvents: "auto" }}>
          <span ref={overlayRef}>yaw:0  pitch:0  hfov:110</span>
          <button onClick={copyCoords} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #0f04", background: copied ? "#0f03" : "transparent", color: "#0f0", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>{copied ? "✓ copied" : "copy"}</button>
        </div>
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", alignItems: "center", gap: 12, padding: "5px 14px", borderRadius: 980, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", pointerEvents: "auto" }}>
            <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Roboto,sans-serif", minWidth: 40, textAlign: "center" }}>{idx + 1} / {photos.length}</span>
            <button onClick={() => setIdx((idx + 1) % photos.length)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
          </div>
        )}
      </div>
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

// ─── PanoVideo Component ─────────────────────────────────────────────────────
function PanoVideo({ videoUrls, locationName, tall, btnHidden, onToggleHide }) {
  const videos = videoUrls || [];
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showBtn, setShowBtn] = useState(true);
  const btnTimer = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const dragRef = useRef(false);
  const current = videos[idx] || null;
  const h = tall ? "calc(100vh - 220px)" : "240px";

  useEffect(() => { setIdx(0); setPlaying(false); setShowBtn(true); if (btnTimer.current) clearTimeout(btnTimer.current); if (onToggleHide) onToggleHide(false); }, [locationName]);

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
      if (!window.THREE) {
        await new Promise(r => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; s.onload = r; document.head.appendChild(s); });
      }
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
  }, [current, locationName]);

  const togglePlay = (fromFrame) => {
    const s = stateRef.current;
    if (!s?.video) return;
    if (btnTimer.current) clearTimeout(btnTimer.current);
    if (s.video.paused) {
      s.video.play(); setPlaying(true); setShowBtn(true);
      btnTimer.current = setTimeout(() => setShowBtn(false), 3000);
    } else {
      s.video.pause(); setPlaying(false);
      if (btnHidden && fromFrame) {}
      else { setShowBtn(true); }
    }
  };

  if (!videos.length) return (
    <div style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>🎥</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>360° video not yet added</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div ref={containerRef} onClick={() => { if (dragRef.current) { dragRef.current = false; if (playing || btnHidden) togglePlay(true); } }} style={{ width: "100%", height: h, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: "#000", cursor: "grab" }} />
      {!btnHidden && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "opacity 0.5s", opacity: showBtn ? 1 : 0, pointerEvents: showBtn ? "auto" : "none" }}>
          <button onClick={() => togglePlay(false)} style={{ padding: "12px 24px", borderRadius: 980, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          {!playing && (
            <button onClick={() => { if (onToggleHide) onToggleHide(true); }} style={{ padding: "4px 12px", borderRadius: 980, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
              Hide play button
            </button>
          )}
        </div>
      )}
      {videos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button onClick={() => { setIdx((idx - 1 + videos.length) % videos.length); setPlaying(false); setShowBtn(true); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "Roboto,sans-serif", minWidth: 50, textAlign: "center" }}>{idx + 1} / {videos.length}</span>
          <button onClick={() => { setIdx((idx + 1) % videos.length); setPlaying(false); setShowBtn(true); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid " + C.border, background: C.bgPanel, color: C.blueLight, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
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
    <div style={{ position: "absolute", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
      <video ref={videoRef} src={url} playsInline style={{ flex: 1, width: "100%", objectFit: "contain", background: "#000", cursor: "pointer" }} onClick={togglePlay} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 20px", background: "linear-gradient(transparent, rgba(0,0,0,0.85))", display: "flex", flexDirection: "column", gap: 10 }}>
        <div onClick={seek} style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, cursor: "pointer", position: "relative" }}>
          <div style={{ width: duration ? (progress / duration * 100) + "%" : "0%", height: "100%", background: C.gold, borderRadius: 2, transition: "width 0.1s linear" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={togglePlay} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {playing ? "⏸" : "▶"}
            </button>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "monospace" }}>{fmt(progress)} / {fmt(duration)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Roboto,sans-serif" }}>{locationName}</span>
            <button onClick={onSkip} style={{ padding: "8px 20px", borderRadius: 980, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
              Explore →
            </button>
          </div>
        </div>
      </div>
      <button onClick={onSkip} style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
    </div>
  );
}

// ─── MediaViewer ─────────────────────────────────────────────────────────────
function MediaViewer({ loc, tall }) {
  const hasPhotos = loc.photoUrls?.length > 0 || loc.photoUrl;
  const hasVideo = loc.videoUrls?.length > 0;
  const tabs = [];
  if (hasPhotos) tabs.push("photos");
  if (hasVideo) tabs.push("video");
  const [activeTab, setActiveTab] = useState(tabs[0] || "photos");
  const [playBtnHidden, setPlayBtnHidden] = useState(false);

  useEffect(() => { setActiveTab(tabs[0] || "photos"); setPlayBtnHidden(false); }, [loc.id]);

  if (!tabs.length) return (
    <div style={{ width: "100%", height: 240, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }}>📷</div>
      <div style={{ color: C.textDim, fontSize: 12, fontFamily: "Roboto,sans-serif" }}>No media added yet</div>
    </div>
  );

  return (
    <div>
      {tabs.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10, alignItems: "center" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab !== "video") setPlayBtnHidden(false); }}
              style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid " + (activeTab === tab ? C.blue + "55" : "rgba(255,255,255,0.1)"), background: activeTab === tab ? C.blue + "18" : "transparent", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", textTransform: "capitalize", fontFamily: "Roboto,sans-serif" }}>
              {tab === "photos" ? "📷 Photos" : "🎥 Video"}
            </button>
          ))}
          {playBtnHidden && activeTab === "video" && (
            <button onClick={() => setPlayBtnHidden(false)}
              style={{ padding: "5px 12px", borderRadius: 980, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "-apple-system,sans-serif", marginLeft: 4 }}>
              ▶ Show play button
            </button>
          )}
        </div>
      )}
      {tabs.length === 1 && playBtnHidden && activeTab === "video" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          <button onClick={() => setPlayBtnHidden(false)}
            style={{ padding: "5px 12px", borderRadius: 980, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
            ▶ Show play button
          </button>
        </div>
      )}
      {activeTab === "photos" && <PanoViewer photoUrl={loc.photoUrl} photoUrls={loc.photoUrls} locationName={loc.name} tall={tall} />}
      {activeTab === "video" && <PanoVideo videoUrls={loc.videoUrls} locationName={loc.name} tall={tall} btnHidden={playBtnHidden} onToggleHide={setPlayBtnHidden} />}
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
      fetch("/drone/" + id + ".m4v", { method: "HEAD" })
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
      const path = `${activeLoc.id}/${ts}_${file.name}`;

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

  if (profile?.restricted) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "Roboto,sans-serif", padding: 24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}"}</style>
      <div style={{ maxWidth: 420, width: "100%", padding: "48px 36px", textAlign: "center", background: C.surface, border: "1px solid rgba(224,82,82,0.3)", borderRadius: 12 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontFamily: "Roboto Slab,serif", fontSize: 22, color: C.text, fontWeight: 900, marginBottom: 10 }}>Access Restricted</h2>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>Your account has been restricted by an administrator. If you believe this is an error, please contact an EWB-ISU team lead.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: "10px 28px", background: "rgba(224,82,82,0.15)", border: "1px solid rgba(224,82,82,0.4)", borderRadius: 6, color: "#E05252", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "Roboto,sans-serif" }}>Sign Out</button>
      </div>
    </div>
  );

  if (!apiKey) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "Roboto,sans-serif", padding: 24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}"}</style>
      <div style={{ maxWidth: 480, width: "100%", padding: "48px 36px", textAlign: "center", background: C.surface, border: "1px solid " + C.border, borderRadius: 12 }}>
        <h1 style={{ fontFamily: "Roboto Slab,serif", fontSize: 32, color: C.text, fontWeight: 900 }}>Explore <span style={{ color: C.gold }}>Ullo</span></h1>
        <p style={{ color: C.blue, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, marginTop: 4 }}>Engineers Without Borders — ISU</p>
        <input type="text" placeholder="AIzaSy..." value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && keyInput.startsWith("AIza")) setApiKey(keyInput); }}
          style={{ width: "100%", marginTop: 24, padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid " + C.border, borderRadius: 6, color: C.text, fontSize: 14, fontFamily: "monospace", outline: "none" }} />
        <button onClick={() => { if (keyInput.startsWith("AIza")) setApiKey(keyInput); }} style={{ width: "100%", marginTop: 12, padding: "14px", background: C.blue, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "Roboto,sans-serif" }}>Launch Explorer →</button>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "Roboto,sans-serif", background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Roboto+Slab:wght@400;600;700;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 ${C.blue}44}50%{box-shadow:0 0 0 10px ${C.blue}00}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .sb-scroll::-webkit-scrollbar{width:4px}.sb-scroll::-webkit-scrollbar-track{background:transparent}.sb-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .loc-btn:hover{background:rgba(255,255,255,0.05)!important}
        .tb-btn:hover{background:rgba(255,255,255,0.07)!important;color:#fff!important}
      `}</style>

      <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

      {mapLoading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg }}>
          <div style={{ width: 48, height: 48, border: "2px solid " + C.blue + "22", borderTopColor: C.blue, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 20, color: C.blue, fontSize: 12, letterSpacing: 3, textTransform: "uppercase" }}>Loading Ullo</p>
        </div>
      )}

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 101, height: 52, display: focusMode ? "none" : "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "rgba(12,16,22,0.62)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)", pointerEvents: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
          <span style={{ fontSize: 14, color: "#fff", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, fontFamily: "'Inter',system-ui,sans-serif" }}>Ullo Ghana</span>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 10px" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, fontFamily: "'Inter',system-ui,sans-serif" }}>EWB–ISU Community Explorer</span>
        </div>

        <div style={{ display: "flex", alignItems: "stretch", height: "100%", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {Object.entries(SECTIONS).map(([key, sec]) => { const active = activeSection === key; return (
            <button key={key} onClick={() => changeSection(active ? null : key)}
              className="tb-btn"
              style={{ position: "relative", padding: "0 18px", height: "100%", border: "none", background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", outline: "none", fontFamily: "'Inter',system-ui,sans-serif" }}>
              {sec.label}
              {active && <span style={{ position: "absolute", bottom: 0, left: 8, right: 8, height: 2, background: "#fff", borderRadius: "2px 2px 0 0" }} />}
            </button>);
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter',system-ui,sans-serif" }}>{session?.user?.user_metadata?.full_name || session?.user?.email}</div>
            <div style={{ fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginTop: 1, color: profile?.role === "admin" ? C.gold : profile?.role === "member" ? C.lime : C.textDim, fontFamily: "'Inter',system-ui,sans-serif" }}>{profile?.role || "supporter"}</div>
          </div>
          {profile?.role === "admin" && <button onClick={() => setShowAdmin(true)} className="tb-btn" style={{ padding: "5px 10px", borderRadius: 5, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)", color: C.gold, fontSize: 10, cursor: "pointer", fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif" }}>Users</button>}
          <button onClick={() => supabase.auth.signOut()} className="tb-btn" style={{ padding: "5px 10px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer", fontFamily: "'Inter',system-ui,sans-serif" }}>Sign out</button>
        </div>
      </div>

      {activeSection && (
        <div style={{ position: "absolute", top: 60, left: 16, bottom: 24, width: 248, zIndex: 100, pointerEvents: "auto", display: "flex", flexDirection: "column", background: "rgba(10,14,20,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: SECTIONS[activeSection].color, fontWeight: 700, marginBottom: 3 }}>{SECTIONS[activeSection].icon} {SECTIONS[activeSection].label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{SECTIONS[activeSection].subsections.length} locations</div>
            </div>
            <button onClick={() => changeSection(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div className="sb-scroll" style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
            {SECTIONS[activeSection].subsections.map((sub, i) => { const isA = activeLoc?.id === sub.id, sec = SECTIONS[activeSection]; return (
              <button key={sub.id} className="loc-btn" onClick={() => selectLoc({ ...sub, droneVideoUrl: "/drone/" + sub.id + ".m4v", sectionKey: activeSection, sectionColor: sec.color, sectionIcon: sec.icon, sectionLabel: sec.label })}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: isA ? sec.color + "18" : "transparent", borderLeft: isA ? `2px solid ${sec.color}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: isA ? sec.color + "30" : "rgba(255,255,255,0.05)", border: "1px solid " + (isA ? sec.color + "60" : "rgba(255,255,255,0.1)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isA ? sec.color : "rgba(255,255,255,0.3)", fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: isA ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: isA ? 600 : 400, lineHeight: 1.3 }}>{sub.name}</span>
              </button>);
            })}
          </div>
        </div>
      )}

      {mapReady && showWelcome && !activeLoc && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 150, textAlign: "center", padding: "36px 40px", maxWidth: 420, background: C.bgCard, backdropFilter: "blur(20px)", border: "1px solid " + C.border, borderRadius: 12, backgroundImage: `radial-gradient(ellipse at 50% 0%, ${C.blue}10 0%, transparent 60%)` }}>
          <h3 style={{ fontFamily: "Roboto Slab,serif", fontSize: 22, color: C.text, margin: "0 0 10px", fontWeight: 900 }}>Welcome to <span style={{ color: C.gold }}>Ullo</span></h3>
          <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>3D labels mark confirmed GPS locations. Click any label or use the section tabs to explore.</p>
          <button onClick={() => setShowWelcome(false)} style={{ marginTop: 20, padding: "10px 28px", background: C.blue, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>Start Exploring</button>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 100, pointerEvents: "auto" }}>
        <button onClick={resetView} style={{ padding: "8px 14px", borderRadius: 6, background: C.bgCard, border: "1px solid " + C.border, color: C.blueLight, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer" }}>🏠 Reset View</button>
      </div>

      {activeLoc && !showPanel && !showDroneIntro && !focusMode && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, pointerEvents: "auto", animation: "fadeSlideUp 0.6s ease both", animationDelay: "1.5s" }}>
          <button onClick={openPanel} style={{ padding: "16px 48px", borderRadius: 980, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(60px) saturate(200%) brightness(1.2)", WebkitBackdropFilter: "blur(60px) saturate(200%) brightness(1.2)", border: "1px solid rgba(255,255,255,0.45)", color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: 0.3, cursor: "pointer", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif", boxShadow: "0 4px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Details</button>
          <button onClick={closeLoc} style={{ padding: "10px 24px", borderRadius: 980, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(60px) saturate(180%)", WebkitBackdropFilter: "blur(60px) saturate(180%)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>Close</button>
        </div>
      )}

      {focusMode && (
        <>
          <div style={{ position: "absolute", inset: 0, zIndex: 590, pointerEvents: "none", boxShadow: "inset 0 0 120px 60px rgba(0,0,0,0.5), inset 0 0 300px 100px rgba(0,0,0,0.25)", background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)" }} />
          <div style={{ position: "absolute", top: 60, left: 16, bottom: 16, width: 240, zIndex: 600, pointerEvents: "auto", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontFamily: "Roboto,sans-serif" }}>📍 Site Locations</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {CLINIC_FOCUS_POINTS.filter(fp => !fp.corner).map(fp => {
                const sel = focusHighlight === fp.id;
                return (
                  <div key={fp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: sel ? "rgba(96,165,250,0.15)" : "transparent", borderLeft: sel ? "3px solid #60A5FA" : "3px solid transparent", transition: "all 0.2s" }}
                    onMouseEnter={() => setFocusHighlight(fp.id)}
                    onClick={() => viewFocusPhoto(fp)}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA", flexShrink: 0, boxShadow: sel ? "0 0 6px #60A5FA" : "none" }} />
                    <span style={{ fontSize: 11, color: sel ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "Roboto,sans-serif", fontWeight: sel ? 600 : 400, flex: 1 }}>{fp.name}</span>
                    {sel && <button onClick={(e) => { e.stopPropagation(); viewFocusPhoto(fp); }} style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(96,165,250,0.25)", border: "1px solid rgba(96,165,250,0.4)", color: "#60A5FA", fontSize: 9, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>360°</button>}
                  </div>
                );
              })}
              <div style={{ padding: "6px 14px 4px", marginTop: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(206,220,0,0.6)", fontFamily: "Roboto,sans-serif" }}>Corner Posts</div>
              </div>
              {CLINIC_FOCUS_POINTS.filter(fp => fp.corner).map(fp => {
                const sel = focusHighlight === fp.id;
                return (
                  <div key={fp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: sel ? "rgba(206,220,0,0.1)" : "transparent", borderLeft: sel ? "3px solid #cedc00" : "3px solid transparent", transition: "all 0.2s" }}
                    onMouseEnter={() => setFocusHighlight(fp.id)}
                    onClick={() => viewFocusPhoto(fp)}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cedc00", flexShrink: 0, boxShadow: sel ? "0 0 6px #cedc00" : "none" }} />
                    <span style={{ fontSize: 11, color: sel ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "Roboto,sans-serif", fontWeight: sel ? 600 : 400, flex: 1 }}>{fp.name}</span>
                    {sel && <button onClick={(e) => { e.stopPropagation(); viewFocusPhoto(fp); }} style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(206,220,0,0.2)", border: "1px solid rgba(206,220,0,0.4)", color: "#cedc00", fontSize: 9, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>360°</button>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ position: "absolute", top: 16, right: 16, zIndex: 600, pointerEvents: "auto" }}>
            <button onClick={exitFocusMode} style={{ padding: "10px 20px", borderRadius: 980, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "-apple-system,sans-serif" }}>
              ✕ Exit Focus Mode
            </button>
          </div>
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 600, pointerEvents: "none", textAlign: "center" }}>
            <div style={{ padding: "8px 20px", borderRadius: 980, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(206,220,0,0.3)" }}>
              <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: "Roboto,sans-serif" }}>🔍 FOCUS MODE</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginLeft: 8, fontFamily: "Roboto,sans-serif" }}>Ullo Clinic Site Boundary</span>
            </div>
          </div>
          {focusPhoto && (
            <div style={{ position: "absolute", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontFamily: "Roboto Slab,serif", fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>{focusPhoto.name}</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace", margin: "4px 0 0" }}>📍 {focusPhoto.lat.toFixed(6)}°N, {Math.abs(focusPhoto.lng).toFixed(6)}°W</p>
                </div>
                <button onClick={() => setFocusPhoto(null)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ flex: 1, padding: "0 20px 20px" }}>
                <PanoViewer photoUrl={"/pano/clinic_site/" + focusPhoto.file} locationName={focusPhoto.name} tall={true} />
              </div>
            </div>
          )}
        </>
      )}

      {activeLoc && showDroneIntro && droneAvail[activeLoc.id] && (
        <DroneIntro url={activeLoc.droneVideoUrl} locationName={activeLoc.name} onSkip={skipDroneIntro} />
      )}

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
              {editingField === "name" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                    style={{ flex: 1, fontFamily: "Roboto Slab,serif", fontSize: panelMin ? 16 : 24, fontWeight: 900, color: C.text, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(206,220,0,0.4)", borderRadius: 6, padding: "6px 10px", outline: "none" }} />
                  <button onClick={saveEdit} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(206,220,0,0.2)", color: "#cedc00", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <h2 style={{ fontFamily: "Roboto Slab,serif", fontSize: panelMin ? 16 : 26, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{getLocValue(activeLoc, "name")}</h2>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <button onClick={() => setPanelMin(!panelMin)} title={panelMin ? "Expand" : "Minimize"} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid " + C.borderSubtle, background: C.surface, color: C.text, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{panelMin ? "⤢" : "⤡"}</button>
              <button onClick={closeLoc} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid " + C.borderSubtle, background: C.surface, color: C.text, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
            </div>
          </div>
          <div style={{ padding: panelMin ? "0 14px 14px" : "0 24px 24px", overflowY: "auto", flex: 1 }}>
            <p style={{ color: C.textDim, fontSize: 11, fontFamily: "monospace", marginBottom: 12 }}>📍 {activeLoc.lat.toFixed(4)}°N, {Math.abs(activeLoc.lng).toFixed(4)}°W · Jirapa District, Upper West Region</p>
            {droneAvail[activeLoc.id] && (
              <button onClick={() => { setShowPanel(false); setShowDroneIntro(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 980, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "Roboto,sans-serif", marginBottom: 12, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                🎬 Watch drone flyover
              </button>
            )}
            {activeLoc.id === "c1" && (
              <button onClick={enterFocusMode} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 980, background: "rgba(206,220,0,0.08)", border: "1px solid rgba(206,220,0,0.25)", color: C.gold, fontSize: 11, cursor: "pointer", fontFamily: "Roboto,sans-serif", marginBottom: 12, marginLeft: droneAvail[activeLoc.id] ? 8 : 0, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(206,220,0,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(206,220,0,0.08)"; }}>
                🔍 Focus Mode — Clinic Boundary
              </button>
            )}
            <MediaViewer loc={activeLoc} tall={!panelMin} />
            {editingField === "description" ? (
              <div style={{ marginTop: 14 }}>
                <textarea value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus rows={6}
                  style={{ width: "100%", color: C.text, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(206,220,0,0.4)", borderRadius: 6, padding: "10px 12px", fontSize: 13, lineHeight: 1.7, fontFamily: "Roboto,sans-serif", outline: "none", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={saveEdit} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "rgba(206,220,0,0.2)", color: "#cedc00", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              getLocValue(activeLoc, "description") && <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line" }}>{getLocValue(activeLoc, "description")}</p>
            )}
            {activeLoc.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{activeLoc.tags.map(tag => (<span key={tag} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>{tag}</span>))}</div>}
            {activeLoc.sectionKey === "boreholes" && activeLoc.data && <BoreholeDataCard data={activeLoc.data} />}
            {(canEdit(profile) || canUpload(profile) || isAdmin(profile)) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {canEdit(profile) && editingField !== "description" && (
                  <button onClick={() => startEdit("description")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(206,220,0,0.3)", background: "rgba(206,220,0,0.08)", color: "#cedc00", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5 }}>Edit Description</button>
                )}
                {canEdit(profile) && editingField !== "name" && (
                  <button onClick={() => startEdit("name")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(206,220,0,0.3)", background: "rgba(206,220,0,0.08)", color: "#cedc00", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5 }}>Edit Name</button>
                )}
                {canUpload(profile) && (
                  <button onClick={() => startUpload("photo")} disabled={uploading} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(0,101,178,0.3)", background: "rgba(0,101,178,0.08)", color: C.blueLight, fontSize: 11, fontWeight: 600, cursor: uploading ? "wait" : "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5, opacity: uploading ? 0.5 : 1 }}>Upload Photos</button>
                )}
                {canUpload(profile) && (
                  <button onClick={() => startUpload("video")} disabled={uploading} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(0,101,178,0.3)", background: "rgba(0,101,178,0.08)", color: C.blueLight, fontSize: 11, fontWeight: 600, cursor: uploading ? "wait" : "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5, opacity: uploading ? 0.5 : 1 }}>Upload Video</button>
                )}
                {isAdmin(profile) && (
                  <button onClick={() => alert("Edit Coordinates — coming soon")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.08)", color: C.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5 }}>Edit Coordinates</button>
                )}
                {isAdmin(profile) && (
                  <button onClick={() => alert("Add Location — coming soon")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.08)", color: C.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto,sans-serif", letterSpacing: 0.5 }}>Add Location</button>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple
              accept={uploadMode === "video" ? "video/*" : "image/*"}
              onChange={handleFileSelect}
              style={{ display: "none" }} />
            {uploadMsg && (
              <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 6, background: uploading ? "rgba(0,101,178,0.12)" : "rgba(59,168,82,0.12)", border: "1px solid " + (uploading ? "rgba(0,101,178,0.3)" : "rgba(59,168,82,0.3)"), fontSize: 12, color: uploading ? C.blueLight : "#5DC87A", fontFamily: "Roboto,sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                {uploading && <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(171,202,233,0.3)", borderTopColor: C.blueLight, borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
                {uploadMsg}
              </div>
            )}
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
