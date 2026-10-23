import React, { useState, useMemo } from 'react';
import {
  Building2,
  Warehouse,
  Heart,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Phone,
  Clock,
  Compass,
  Filter,
  Layers,
  ChevronRight,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import {
  HospitalProfile,
  BloodBankProfile,
  DonorProfile,
  BloodRequest,
  BloodGroup,
} from '../../types';
import {
  INITIAL_HOSPITALS,
  INITIAL_BLOOD_BANKS,
  INITIAL_DONORS,
  INITIAL_BLOOD_INVENTORY,
} from '../../data/mockData';

interface SimulatedMapProps {
  activeRequest?: BloodRequest | null;
  onSelectFacility?: (type: 'hospital' | 'blood_bank' | 'donor', id: string) => void;
  onRequestBlood?: (hospitalId: string) => void;
}

// Coordinate bounds for Chennai Metropolitan Region
const CHENNAI_BOUNDS = {
  minLat: 12.92,
  maxLat: 13.18,
  minLng: 80.12,
  maxLng: 80.32,
};

function projectCoords(lat: number, lng: number, width = 900, height = 620) {
  const x =
    ((lng - CHENNAI_BOUNDS.minLng) /
      (CHENNAI_BOUNDS.maxLng - CHENNAI_BOUNDS.minLng)) *
      (width - 120) +
    60;
  const y =
    ((CHENNAI_BOUNDS.maxLat - lat) /
      (CHENNAI_BOUNDS.maxLat - CHENNAI_BOUNDS.minLat)) *
      (height - 100) +
    50;
  return { x: Math.max(30, Math.min(width - 30, x)), y: Math.max(30, Math.min(height - 30, y)) };
}

export const SimulatedMap: React.FC<SimulatedMapProps> = ({
  activeRequest,
  onSelectFacility,
  onRequestBlood,
}) => {
  const [selectedPin, setSelectedPin] = useState<{
    type: 'hospital' | 'blood_bank' | 'donor';
    id: string;
    item: HospitalProfile | BloodBankProfile | DonorProfile;
  } | null>(null);

  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showBloodBanks, setShowBloodBanks] = useState<boolean>(true);
  const [showDonors, setShowDonors] = useState<boolean>(true);
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>('ALL');

  // Filter donors by blood group
  const filteredDonors = useMemo(() => {
    return INITIAL_DONORS.filter((d) => {
      if (filterBloodGroup !== 'ALL' && d.bloodGroup !== filterBloodGroup) return false;
      return true;
    });
  }, [filterBloodGroup]);

  // Active hospital focus point if request is active
  const focusHospital = useMemo(() => {
    if (!activeRequest) return INITIAL_HOSPITALS[0];
    const match = INITIAL_HOSPITALS.find((h) => h.id === activeRequest.hospitalId);
    return match || INITIAL_HOSPITALS[0];
  }, [activeRequest]);

  const focusCenter = projectCoords(
    focusHospital.coordinates?.latitude || 13.0827,
    focusHospital.coordinates?.longitude || 80.2777
  );

  // Pixel radius mapping (25km ≈ 130px)
  const radiusPx = (radiusKm / 25) * 125;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Chennai Metropolitan Emergency Telemetry Map
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Real-time spatial tracking of trauma centers, blood banks, and verified voluntary donors
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Blood Group Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-500">Group:</span>
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="bg-transparent font-bold text-neutral-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">All Groups</option>
              <option value="O-">O- (Universal)</option>
              <option value="O+">O+</option>
              <option value="A-">A-</option>
              <option value="A+">A+</option>
              <option value="B-">B-</option>
              <option value="B+">B+</option>
              <option value="AB-">AB-</option>
              <option value="AB+">AB+</option>
            </select>
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <Crosshair className="w-3.5 h-3.5 text-red-500" />
            <span className="font-semibold text-neutral-500">Radius:</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-transparent font-bold text-neutral-900 dark:text-white outline-none cursor-pointer"
            >
              <option value={10}>10 km (Immediate)</option>
              <option value={25}>25 km (Metro Core)</option>
              <option value={50}>50 km (Greater Chennai)</option>
              <option value={100}>100 km (Regional Tier 1)</option>
              <option value={250}>250 km (North TN Grid)</option>
            </select>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showHospitals
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Hospitals
            </button>
            <button
              onClick={() => setShowBloodBanks(!showBloodBanks)}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showBloodBanks
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" /> Banks
            </button>
            <button
              onClick={() => setShowDonors(!showDonors)}
              className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showDonors
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <Heart className="w-3.5 h-3.5" /> Donors
            </button>
          </div>
        </div>
      </div>

      {/* Map View Canvas Container */}
      <div className="relative w-full aspect-video min-h-[460px] max-h-[580px] bg-[#0c1017] overflow-hidden select-none">
        {/* SVG Map Canvas */}
        <svg
          viewBox="0 0 900 620"
          className="w-full h-full object-cover"
          style={{ background: 'radial-gradient(circle at 50% 50%, #0d131f 0%, #080c14 100%)' }}
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="mapGrid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path
                d="M 45 0 L 0 0 0 45"
                fill="none"
                stroke="#172233"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />
            </pattern>
            {/* Pulsing beacon glow */}
            <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bayOfBengal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0b1b30" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f2647" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="900" height="620" fill="url(#mapGrid)" />

          {/* Coastline Graphic (Bay of Bengal on East) */}
          <path
            d="M 740 0 C 720 120, 710 240, 725 380 C 735 480, 720 540, 705 620 L 900 620 L 900 0 Z"
            fill="url(#bayOfBengal)"
          />
          <text
            x="790"
            y="310"
            fill="#3b82f6"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="3"
            opacity="0.35"
            transform="rotate(90 790 310)"
          >
            BAY OF BENGAL
          </text>

          {/* Major Chennai Road Arteries */}
          {/* Anna Salai / Mount Road */}
          <path
            d="M 540 220 C 470 310, 390 410, 320 520"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3.5"
            opacity="0.8"
          />
          <text x="440" y="340" fill="#64748b" fontSize="8" fontWeight="600" opacity="0.5" transform="rotate(-40 440 340)">
            ANNA SALAI (NH 45)
          </text>

          {/* Poonamallee High Road */}
          <path
            d="M 540 220 C 430 210, 270 215, 120 220"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            opacity="0.8"
          />
          <text x="320" y="210" fill="#64748b" fontSize="8" fontWeight="600" opacity="0.5">
            POONAMALLEE HIGH RD
          </text>

          {/* OMR (Rajiv Gandhi Salai) */}
          <path
            d="M 580 430 C 600 480, 610 550, 620 620"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            opacity="0.8"
          />
          <text x="615" y="530" fill="#64748b" fontSize="8" fontWeight="600" opacity="0.5" transform="rotate(75 615 530)">
            OMR IT CORRIDOR
          </text>

          {/* Inner Ring Road / GST Road */}
          <path
            d="M 280 180 C 260 290, 290 420, 320 520"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            opacity="0.7"
          />

          {/* Dynamic Radius Circle around Focus Hospital */}
          <circle
            cx={focusCenter.x}
            cy={focusCenter.y}
            r={radiusPx}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <circle
            cx={focusCenter.x}
            cy={focusCenter.y}
            r={radiusPx}
            fill="url(#beaconGlow)"
            opacity="0.25"
          />
          <text
            x={focusCenter.x + radiusPx - 35}
            y={focusCenter.y - 8}
            fill="#ef4444"
            fontSize="9"
            fontWeight="bold"
            opacity="0.8"
          >
            {radiusKm} km radius
          </text>

          {/* Animated Dispatch Trajectory Route (Connecting nearest blood bank to hospital) */}
          {activeRequest && (
            <g>
              <path
                d={`M ${focusCenter.x} ${focusCenter.y} Q ${(focusCenter.x + 580) / 2} ${(focusCenter.y + 260) / 2 - 30} 580 260`}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
              <circle cx="580" cy="260" r="5" fill="#10b981" />
            </g>
          )}

          {/* DONOR PINS */}
          {showDonors &&
            filteredDonors.map((donor) => {
              if (!donor.coordinates) return null;
              const pos = projectCoords(donor.coordinates.latitude, donor.coordinates.longitude);
              const isSelected = selectedPin?.id === donor.id;
              return (
                <g
                  key={donor.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPin({ type: 'donor', id: donor.id, item: donor })}
                >
                  <circle
                    r={isSelected ? '9' : '6'}
                    fill={donor.bloodGroup === 'O-' ? '#10b981' : '#059669'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-200 group-hover:scale-125"
                  />
                  <text
                    y="-9"
                    textAnchor="middle"
                    fill="#a7f3d0"
                    fontSize="8"
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity select-none font-mono"
                  >
                    {donor.bloodGroup}
                  </text>
                </g>
              );
            })}

          {/* BLOOD BANK PINS */}
          {showBloodBanks &&
            INITIAL_BLOOD_BANKS.map((bank) => {
              if (!bank.coordinates) return null;
              const pos = projectCoords(bank.coordinates.latitude, bank.coordinates.longitude);
              const isSelected = selectedPin?.id === bank.id;
              return (
                <g
                  key={bank.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPin({ type: 'blood_bank', id: bank.id, item: bank })}
                >
                  <rect
                    x={isSelected ? -12 : -9}
                    y={isSelected ? -12 : -9}
                    width={isSelected ? 24 : 18}
                    height={isSelected ? 24 : 18}
                    rx="6"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    className="transition-all duration-200 group-hover:scale-125 shadow-lg"
                  />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                  <text
                    y="18"
                    textAnchor="middle"
                    fill="#93c5fd"
                    fontSize="8"
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity select-none"
                  >
                    {bank.bloodBankName.split(' ')[0]}
                  </text>
                </g>
              );
            })}

          {/* HOSPITAL PINS */}
          {showHospitals &&
            INITIAL_HOSPITALS.map((hosp) => {
              if (!hosp.coordinates) return null;
              const pos = projectCoords(hosp.coordinates.latitude, hosp.coordinates.longitude);
              const isSelected = selectedPin?.id === hosp.id;
              const isFocus = hosp.id === focusHospital.id;
              return (
                <g
                  key={hosp.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPin({ type: 'hospital', id: hosp.id, item: hosp })}
                >
                  {isFocus && (
                    <circle
                      r="22"
                      fill="#ef4444"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  <polygon
                    points="0,-14 12,0 0,14 -12,0"
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    className="transition-all duration-200 group-hover:scale-125"
                  />
                  <text
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="black"
                  >
                    +
                  </text>
                  <text
                    y="-18"
                    textAnchor="middle"
                    fill="#fca5a5"
                    fontSize="9"
                    fontWeight="bold"
                    className="opacity-80 group-hover:opacity-100 transition-opacity select-none"
                  >
                    {hosp.hospitalName.includes('RGGGH')
                      ? 'RGGGH Trauma'
                      : hosp.hospitalName.includes('Apollo')
                      ? 'Apollo Greams'
                      : hosp.hospitalName.includes('Stanley')
                      ? 'Stanley Med'
                      : 'MIOT Center'}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Legend Overlay Box (Bottom Left) */}
        <div className="absolute bottom-4 left-4 bg-neutral-900/90 backdrop-blur-md p-3 rounded-2xl border border-neutral-700/60 text-xs text-white shadow-xl space-y-1.5 max-w-[210px]">
          <div className="font-bold text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
            Map Facility Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-600 flex items-center justify-center text-[10px] text-white font-black">
              +
            </span>
            <span className="text-[11px]">Trauma Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-blue-600 flex items-center justify-center text-[10px] text-white">
              ■
            </span>
            <span className="text-[11px]">Licensed Blood Bank</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">
              ●
            </span>
            <span className="text-[11px]">Verified Citizen Donor</span>
          </div>
          {activeRequest && (
            <div className="pt-1.5 border-t border-neutral-800 text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Active Dispatch Corridor
            </div>
          )}
        </div>

        {/* Selected Marker Details Flyout (Bottom Right) */}
        {selectedPin && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl max-w-xs w-full text-xs animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedPin.type === 'hospital'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : selectedPin.type === 'blood_bank'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {selectedPin.type === 'hospital'
                  ? 'Trauma Center'
                  : selectedPin.type === 'blood_bank'
                  ? 'Blood Bank'
                  : 'Voluntary Donor'}
              </span>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {selectedPin.type === 'hospital' && (
              <div className="space-y-1.5">
                <div className="font-bold text-sm text-neutral-900 dark:text-white">
                  {(selectedPin.item as HospitalProfile).hospitalName}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  {(selectedPin.item as HospitalProfile).address}
                </div>
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 pt-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{(selectedPin.item as HospitalProfile).emergencyContact}</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('hospital', selectedPin.id);
                      if (onRequestBlood) onRequestBlood(selectedPin.id);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
                  >
                    View Active Requests <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {selectedPin.type === 'blood_bank' && (
              <div className="space-y-1.5">
                <div className="font-bold text-sm text-neutral-900 dark:text-white">
                  {(selectedPin.item as BloodBankProfile).bloodBankName}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  {(selectedPin.item as BloodBankProfile).address}
                </div>
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{(selectedPin.item as BloodBankProfile).operatingHours}</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('blood_bank', selectedPin.id);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    Inspect Inventory Units <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {selectedPin.type === 'donor' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {(selectedPin.item as DonorProfile).fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                    {(selectedPin.item as DonorProfile).bloodGroup}
                  </span>
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  Locality: {(selectedPin.item as DonorProfile).city} (Privacy Protected)
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                  Donations: {(selectedPin.item as DonorProfile).totalDonationsCount} completed
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('donor', selectedPin.id);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                  >
                    Match for Dispatch <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
