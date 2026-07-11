import { useState } from "react";
import { Activity, Map } from "lucide-react";

import "./StateMap.css";
import { GeographicDossierReader } from "./GeographicDossierReader";










const DISTRICT_SHAPES = [
// 1. KUTCH (North-West)
{ id: "kutch", name: "Kutch", points: "40,160 140,110 240,135 280,185 240,240 180,245 120,230 40,210", labelX: 140, labelY: 180, region: "Kutch" },
// 2. SAURASHTRA (Peninsula)
{ id: "devbhumi-dwarka", name: "Devbhumi Dwarka", points: "30,350 75,340 65,390 30,380", labelX: 50, labelY: 365, region: "Saurashtra" },
{ id: "porbandar", name: "Porbandar", points: "30,380 65,390 90,405 75,445 40,435", labelX: 55, labelY: 415, region: "Saurashtra" },
{ id: "junagadh", name: "Junagadh", points: "75,445 125,435 140,480 90,490", labelX: 110, labelY: 465, region: "Saurashtra" },
{ id: "gir-somnath", name: "Gir Somnath", points: "140,480 185,470 170,520 120,510", labelX: 155, labelY: 505, region: "Saurashtra" },
{ id: "amreli", name: "Amreli", points: "155,420 215,410 230,465 185,470", labelX: 195, labelY: 445, region: "Saurashtra" },
{ id: "bhavnagar", name: "Bhavnagar", points: "215,410 280,390 290,440 250,470 230,465", labelX: 255, labelY: 430, region: "Saurashtra" },
{ id: "botad", name: "Botad", points: "195,355 255,345 280,390 215,410", labelX: 235, labelY: 375, region: "Saurashtra" },
{ id: "rajkot", name: "Rajkot", points: "135,355 195,355 215,410 155,420 125,410", labelX: 170, labelY: 395, region: "Saurashtra" },
{ id: "jamnagar", name: "Jamnagar", points: "75,340 135,330 145,370 110,385 65,390", labelX: 110, labelY: 355, region: "Saurashtra" },
{ id: "morbi", name: "Morbi", points: "135,270 215,260 225,300 175,315 135,305", labelX: 175, labelY: 290, region: "Saurashtra" },
{ id: "surendranagar", name: "Surendranagar", points: "215,260 280,270 300,320 255,345 195,355 225,300", labelX: 250, labelY: 310, region: "Saurashtra" },
// 3. NORTH GUJARAT
{ id: "banaskantha", name: "Banaskantha", points: "300,105 400,75 420,120 350,130", labelX: 350, labelY: 105, region: "North" },
{ id: "patan", name: "Patan", points: "285,150 350,130 370,180 310,195", labelX: 325, labelY: 165, region: "North" },
{ id: "mehsana", name: "Mehsana", points: "350,130 400,120 410,170 370,180", labelX: 382, labelY: 150, region: "North" },
{ id: "sabarkantha", name: "Sabarkantha", points: "400,75 460,105 450,160 410,170", labelX: 430, labelY: 125, region: "North" },
{ id: "aravalli", name: "Aravalli", points: "450,160 500,150 510,195 455,205", labelX: 480, labelY: 175, region: "North" },
{ id: "gandhinagar", name: "Gandhinagar", points: "385,185 415,180 420,205 390,210", labelX: 402, labelY: 200, region: "North" },
// 4. CENTRAL GUJARAT
{ id: "ahmedabad", name: "Ahmedabad", points: "280,270 335,260 385,235 375,290 325,330 300,320", labelX: 345, labelY: 295, region: "Central" },
{ id: "kheda", name: "Kheda", points: "385,235 445,230 455,270 410,280", labelX: 420, labelY: 255, region: "Central" },
{ id: "anand", name: "Anand", points: "410,280 455,270 445,315 395,315", labelX: 425, labelY: 298, region: "Central" },
{ id: "mahisagar", name: "Mahisagar", points: "455,205 520,195 510,235 470,245", labelX: 490, labelY: 220, region: "Central" },
{ id: "panchmahal", name: "Panchmahal", points: "470,245 530,235 520,285 465,285", labelX: 500, labelY: 265, region: "Central" },
{ id: "dahod", name: "Dahod", points: "520,195 595,205 585,265 530,235", labelX: 560, labelY: 235, region: "Central" },
{ id: "vadodara", name: "Vadodara", points: "445,315 505,305 515,355 455,365", labelX: 480, labelY: 335, region: "Central" },
// 5. SOUTH GUJARAT
{ id: "chhota-udepur", name: "Chhota Udepur", points: "505,305 580,295 570,355 515,355", labelX: 550, labelY: 325, region: "South" },
{ id: "bharuch", name: "Bharuch", points: "395,315 455,365 440,425 390,405", labelX: 420, labelY: 385, region: "South" },
{ id: "narmada", name: "Narmada", points: "455,365 515,355 505,425 440,425", labelX: 480, labelY: 395, region: "South" },
{ id: "surat", name: "Surat", points: "390,405 450,445 440,505 390,495", labelX: 418, labelY: 455, region: "South" },
{ id: "tapi", name: "Tapi", points: "450,445 515,445 505,505 440,505", labelX: 480, labelY: 475, region: "South" },
{ id: "navsari", name: "Navsari", points: "390,495 440,505 430,555 390,555", labelX: 412, labelY: 525, region: "South" },
{ id: "the-dangs", name: "The Dangs", points: "440,505 495,515 485,565 430,555", labelX: 465, labelY: 535, region: "South" },
{ id: "valsad", name: "Valsad", points: "390,555 440,555 430,615 390,605", labelX: 412, labelY: 585, region: "South" }];


const DISTRICT_COORDS = {
  ahmedabad: [23.0225, 72.5714], surat: [21.1702, 72.8311], rajkot: [22.3039, 70.8022],
  vadodara: [22.3072, 73.1812], bhavnagar: [21.7645, 72.1519], banaskantha: [24.1724, 72.4334],
  dahod: [22.8373, 74.2562], kutch: [23.2420, 69.6669], panchmahal: [22.7745, 73.6149],
  gandhinagar: [23.2156, 72.6369], anand: [22.5645, 72.9289], mehsana: [23.5880, 72.3693],
  junagadh: [21.5222, 70.4579], bharuch: [21.7051, 72.9959], kheda: [22.6916, 72.8634],
  valsad: [20.5993, 72.9342], jamnagar: [22.4707, 70.0577], sabarkantha: [23.5977, 72.9620],
  navsari: [20.9467, 72.9282], surendranagar: [22.7262, 71.6381], patan: [23.8493, 72.1266],
  morbi: [22.8120, 70.8236], amreli: [21.6021, 71.2205], aravalli: [23.4619, 73.3009],
  "chhota-udepur": [22.3106, 74.0112], porbandar: [21.6417, 69.6093], "devbhumi-dwarka": [22.2442, 68.9685],
  botad: [22.1702, 71.6673], "gir-somnath": [20.9016, 70.3622], tapi: [21.1215, 73.4012],
  narmada: [21.8415, 73.5015], mahisagar: [23.1363, 73.6213], "the-dangs": [20.7588, 73.6845]
};

const getSeverityFill = (severity, isHovered) => {
  switch (severity) {
    case "critical":return isHovered ? "fill-rose-800" : "fill-rose-950-80";
    case "high":return isHovered ? "fill-orange-800" : "fill-orange-950-80";
    case "medium":return isHovered ? "fill-amber-800" : "fill-amber-950-80";
    case "low":return isHovered ? "fill-emerald-800" : "fill-emerald-950-80";
    default:return isHovered ? "fill-default-hover" : "fill-default";
  }
};

const matchDistrictId = (geojsonName) => {
  const norm = geojsonName.toLowerCase().trim();
  if (norm.includes("kachchh") || norm.includes("kutch")) return "kutch";
  if (norm.includes("dang") || norm.includes("the dangs")) return "the-dangs";
  if (norm.includes("dohad") || norm.includes("dahod")) return "dahod";
  if (norm.includes("panch")) return "panchmahal";
  if (norm.includes("sabar")) return "sabarkantha";
  if (norm.includes("banas")) return "banaskantha";
  if (norm.includes("chhota") || norm.includes("udepur") || norm.includes("udaipur")) return "chhota-udepur";
  if (norm.includes("somnath") || norm.includes("gir")) return "gir-somnath";
  if (norm.includes("dwarka") || norm.includes("devbhumi")) return "devbhumi-dwarka";
  if (norm.includes("ahmedabad") || norm.includes("ahmadabad")) return "ahmedabad";
  if (norm.includes("baroda") || norm.includes("vadodara")) return "vadodara";
  if (norm.includes("broach") || norm.includes("bharuch")) return "bharuch";
  if (norm.includes("bulsar") || norm.includes("valsad")) return "valsad";

  const found = Object.keys(DISTRICT_COORDS).find((id) => {
    const cleanId = id.replace(/-/g, "");
    const cleanNorm = norm.replace(/[\s-]/g, "");
    return cleanNorm.includes(cleanId) || cleanId.includes(cleanNorm);
  });
  return found || norm.replace(/\s+/g, "-");
};







export default function StateMap({ districts = [], onDistrictClick, stateCode = "GJ" }) {
  const [hoveredDistrictId, setHoveredDistrictId] = useState(null);

  const getDistrictDetails = (id) => {
    return districts.find((d) => matchDistrictId(d.district_name) === id);
  };

  const hoveredDetails = hoveredDistrictId ? getDistrictDetails(hoveredDistrictId) : null;
  const hoveredShape = hoveredDistrictId ? DISTRICT_SHAPES.find((s) => s.id === hoveredDistrictId) : null;

  return (
    <div className="state-map-container">
      <div className="map-main-canvas">
        <div className="map-header">
          <div>
            <div className="map-header-subtitle">
              <Activity size={12} color="#f43f5e" className="pulse-icon" />
              Interactive State Layout ({stateCode})
            </div>
            <h3 className="map-header-title">Judicial GIS Command Map</h3>
          </div>
          <div className="map-toggle-group">
            <button className="map-toggle-btn active">
              <Map size={12} /> Vector Layout
            </button>
          </div>
        </div>

        <div className="map-content-layout">
          <div className="abstract-map-wrapper">
            <svg viewBox="0 0 650 650" className="abstract-svg">
              <defs>
                <pattern id="map-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#222A36" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="650" height="650" fill="url(#map-grid)" opacity="0.4" />
              
              <g style={{ cursor: 'pointer' }}>
                {DISTRICT_SHAPES.map((shape) => {
                  const details = getDistrictDetails(shape.id) || {
                    district_name: shape.name,
                    pending_count: 0,
                    disposed_count: 0,
                    disposal_rate: 0.0,
                    avg_case_age_days: 0.0,
                    severity_tier: "low"
                  };
                  const isHovered = hoveredDistrictId === shape.id;
                  return (
                    <g key={shape.id} onMouseEnter={() => setHoveredDistrictId(shape.id)} onMouseLeave={() => setHoveredDistrictId(null)} onClick={() => onDistrictClick && onDistrictClick(details.district_name)}>
                      <title>{shape.name}: {details.pending_count} pending cases ({details.severity_tier} load)</title>
                      <polygon points={shape.points} style={{ transition: "all 0.3s ease", strokeWidth: "1.5px", filter: isHovered ? "drop-shadow(0 0 12px rgba(176,141,87,0.4))" : "none", transformOrigin: `${shape.labelX}px ${shape.labelY}px` }} className={getSeverityFill(details.severity_tier, isHovered)} />
                      {details.severity_tier === "critical" &&
                      <g transform={`translate(${shape.labelX}, ${shape.labelY})`}>
                          <circle r="6" fill="#f43f5e" opacity="0.4" className="pulse-icon" />
                          <circle r="3.5" fill="#f43f5e" stroke="#000" strokeWidth="1" />
                        </g>
                      }
                      <text x={shape.labelX} y={shape.labelY - 6} style={{ fontSize: isHovered ? "9px" : "8px", fill: isHovered ? "#B08D57" : "rgba(255,255,255,0.6)", fontFamily: "monospace", textAnchor: "middle", pointerEvents: "none", textTransform: "uppercase", fontWeight: "bold" }}>
                        {shape.name.split(" ")[0]}
                      </text>
                      <text x={shape.labelX} y={shape.labelY + 4} style={{ fontSize: "7px", fill: isHovered ? "#fff" : "#71717a", fontFamily: "monospace", textAnchor: "middle", pointerEvents: "none" }}>
                        {details.pending_count} cases
                      </text>
                    </g>);

                })}
              </g>
            </svg>
          </div>

          <div className="geo-dossier-sidebar">
            <GeographicDossierReader
              hoveredDetails={hoveredDetails || null}
              hoveredShape={hoveredShape} />
            
          </div>
        </div>

        <div className="map-footer">
          <span>* Labels reflect pending case load</span>
          <span>Click district to view dossier</span>
        </div>
      </div>
    </div>);

}