// Field water-quality tests by EWB-ISU, keyed by map location id.
// Generated from soil_and_water_testings_excel.xlsx (sheet "GIS") — regenerate rather than hand-edit.
// Values are a single number, or [min, max] when several samples differed.
// Metals panel and E. coli intentionally not included yet (pending confirmation).

export const WATER_PARAMS = [
  {
    "key": "ph",
    "label": "pH",
    "unit": "",
    "group": "Chemistry"
  },
  {
    "key": "fluoride",
    "label": "Fluoride",
    "unit": "mg/L",
    "group": "Chemistry"
  },
  {
    "key": "nitrate",
    "label": "Nitrate",
    "unit": "ppm",
    "group": "Chemistry"
  },
  {
    "key": "tds",
    "label": "Total Dissolved Solids",
    "unit": "ppm",
    "group": "Chemistry"
  },
  {
    "key": "hardness",
    "label": "Total Hardness",
    "unit": "ppm",
    "group": "Chemistry"
  },
  {
    "key": "ca_hardness",
    "label": "Calcium Hardness",
    "unit": "ppm",
    "group": "Chemistry"
  },
  {
    "key": "temp",
    "label": "Temperature",
    "unit": "°C",
    "group": "Physical"
  },
  {
    "key": "do_mgl",
    "label": "Dissolved Oxygen",
    "unit": "mg/L",
    "group": "Physical"
  },
  {
    "key": "do_pct",
    "label": "Dissolved Oxygen Saturation",
    "unit": "%",
    "group": "Physical"
  },
  {
    "key": "turbidity",
    "label": "Turbidity",
    "unit": "",
    "group": "Physical"
  },
  {
    "key": "tss",
    "label": "Total Suspended Solids",
    "unit": "",
    "group": "Physical"
  },
  {
    "key": "depth",
    "label": "Depth",
    "unit": "m",
    "group": "Well"
  },
  {
    "key": "water_height",
    "label": "Water Height",
    "unit": "m",
    "group": "Well"
  },
  {
    "key": "rod_length",
    "label": "Rod Length",
    "unit": "m",
    "group": "Well"
  },
  {
    "key": "flow",
    "label": "Flow Rate",
    "unit": "L/min",
    "group": "Well"
  }
];

export const WATER_SITES = [
  {
    "id": "cm5",
    "name": "Sama Yiri Solar Borehole",
    "site": "EWB",
    "lat": 10.68295,
    "lng": -2.556299,
    "samples": 1,
    "time": "late afternoon",
    "values": {
      "ph": 7,
      "fluoride": 0.05,
      "nitrate": 0.2,
      "temp": 38.9,
      "do_mgl": 5.34,
      "do_pct": 81.9,
      "turbidity": 0,
      "tss": 0,
      "water_height": 6.75,
      "flow": 25.84
    }
  },
  {
    "id": "cm4",
    "name": "Islamic School Borehole",
    "site": "Islamic",
    "lat": 10.687624,
    "lng": -2.558649,
    "samples": 1,
    "time": "morning",
    "values": {
      "ph": 7,
      "fluoride": 0,
      "nitrate": 0,
      "temp": 33.1,
      "do_mgl": 2.79,
      "do_pct": 38.9,
      "turbidity": 5,
      "tss": 0,
      "depth": 24,
      "water_height": 0.61,
      "rod_length": 23.72
    }
  },
  {
    "id": "cm6",
    "name": "Rotary Borehole",
    "site": "Rotary",
    "lat": 10.691812,
    "lng": -2.563331,
    "samples": 3,
    "time": "afternoon",
    "values": {
      "ph": [
        6.79,
        6.81
      ],
      "fluoride": [
        0.42,
        0.62
      ],
      "nitrate": [
        3.7,
        4.7
      ],
      "tds": [
        78.1,
        86.2
      ],
      "hardness": [
        84,
        98
      ],
      "ca_hardness": [
        48,
        68
      ],
      "temp": [
        30.7,
        31.4
      ],
      "do_mgl": [
        4.98,
        5.07
      ],
      "do_pct": [
        66.7,
        68.7
      ],
      "turbidity": 3,
      "tss": [
        0,
        3
      ],
      "depth": 23.27,
      "water_height": 0.45,
      "rod_length": 23.05
    }
  },
  {
    "id": "sh3",
    "name": "Kitchen - Ullo Senior HS",
    "site": "Kitchen",
    "lat": 10.689484,
    "lng": -2.566155,
    "samples": 1,
    "time": "morning",
    "values": {
      "ph": 7,
      "fluoride": 0,
      "nitrate": 0,
      "temp": 25.3,
      "do_mgl": 6.86,
      "do_pct": 83.5,
      "turbidity": 0,
      "tss": 0
    }
  },
  {
    "id": "cm8",
    "name": "Baazu Borehole",
    "site": "Yir_Paala",
    "lat": 10.688189,
    "lng": -2.56301,
    "samples": 1,
    "time": "afternoon",
    "values": {
      "ph": 7,
      "nitrate": 9.5,
      "turbidity": 0,
      "tss": 0
    }
  },
  {
    "id": "sh6",
    "name": "Male Dormitory Water Tanks",
    "site": "Boys_Dorm",
    "lat": 10.6891249,
    "lng": -2.5679612,
    "samples": 1,
    "time": "morning",
    "values": {
      "ph": 7,
      "fluoride": 0,
      "nitrate": 0,
      "temp": [
        29.4,
        30.4
      ],
      "do_mgl": [
        7.63,
        7.83
      ],
      "do_pct": [
        27.1,
        101
      ],
      "turbidity": 0,
      "tss": 0
    }
  },
  {
    "id": "sh11",
    "name": "Female Poly Tank",
    "site": "Girls_Dorm",
    "lat": 10.6880821,
    "lng": -2.5661691,
    "samples": 1,
    "time": "morning",
    "values": {
      "ph": 7,
      "fluoride": 0,
      "nitrate": 0,
      "temp": 28.6,
      "do_mgl": [
        6.11,
        6.98
      ],
      "do_pct": [
        81.15,
        93
      ],
      "turbidity": 0,
      "tss": 0
    }
  },
  {
    "id": "sh7",
    "name": "School Solar Borehole 2024",
    "site": "Solar",
    "lat": 10.6895444,
    "lng": -2.5702185,
    "samples": null,
    "time": null,
    "values": {
      "water_height": 17.15
    }
  },
  {
    "id": "sh2",
    "name": "Gate Borehole",
    "site": "Gate",
    "lat": null,
    "lng": null,
    "samples": null,
    "time": null,
    "values": {
      "depth": 92.78,
      "water_height": 19.1
    }
  }
];

export const WATER_TESTS = Object.fromEntries(WATER_SITES.map(s => [s.id, s]));

export const WATER_XLSX_URL = "/data/ullo_water_tests.xlsx";
