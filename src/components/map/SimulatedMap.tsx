import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Map as MapIcon,
  Satellite,
  Sun,
  Moon,
  Locate,
  RefreshCw,
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
import { useTheme } from '../../context/ThemeContext';

interface SimulatedMapProps {
  activeRequest?: BloodRequest | null;
  onSelectFacility?: (type: 'hospital' | 'blood_bank' | 'donor', id: string) => void;
  onRequestBlood?: (hospitalId: string) => void;
}

type MapLayerType = 'dark' | 'streets' | 'satellite';

const TILE_PROVIDERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 18,
  },
};

// Chennai Center Coordinates (Central Railway / RGGGH corridor)
const CHENNAI_CENTER: [number, number] = [13.065, 80.245];
const DEFAULT_ZOOM = 12;

export const SimulatedMap: React.FC<SimulatedMapProps> = ({
  activeRequest,
  onSelectFacility,
  onRequestBlood,
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapLayer, setMapLayer] = useState<MapLayerType>(theme === 'dark' ? 'dark' : 'streets');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showBloodBanks, setShowBloodBanks] = useState<boolean>(true);
  const [showDonors, setShowDonors] = useState<boolean>(true);
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>('ALL');

  const [selectedFacility, setSelectedFacility] = useState<{
    type: 'hospital' | 'blood_bank' | 'donor';
    id: string;
    item: HospitalProfile | BloodBankProfile | DonorProfile;
  } | null>(null);

  // Sync default map tile style when global theme changes
  useEffect(() => {
    if (mapLayer !== 'satellite') {
      setMapLayer(theme === 'dark' ? 'dark' : 'streets');
    }
  }, [theme]);

  // Determine focus hospital
  const focusHospital = useMemo(() => {
    if (!activeRequest) return INITIAL_HOSPITALS[0];
    const match = INITIAL_HOSPITALS.find((h) => h.id === activeRequest.hospitalId);
    return match || INITIAL_HOSPITALS[0];
  }, [activeRequest]);

  // Filter donors
  const filteredDonors = useMemo(() => {
    return INITIAL_DONORS.filter((d) => {
      if (filterBloodGroup !== 'ALL' && d.bloodGroup !== filterBloodGroup) return false;
      return true;
    });
  }, [filterBloodGroup]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: CHENNAI_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // We'll add custom positioned zoom control
        attributionControl: true,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Tile Layer
      const initialProvider = TILE_PROVIDERS[mapLayer];
      const tileLayer = L.tileLayer(initialProvider.url, {
        attribution: initialProvider.attribution,
        maxZoom: initialProvider.maxZoom,
      }).addTo(map);

      // Markers LayerGroup
      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;
      markersGroupRef.current = markersGroup;

      // Invalidate size after layout rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when layer type changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const provider = TILE_PROVIDERS[mapLayer];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapLayer]);

  // Recalculate & Render Markers, Radius Circle, and Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Render Radius Circle around Focus Hospital
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    const focusLat = focusHospital.coordinates?.latitude || 13.0827;
    const focusLng = focusHospital.coordinates?.longitude || 80.2777;

    const circle = L.circle([focusLat, focusLng], {
      radius: radiusKm * 1000,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5, 8',
    }).addTo(map);
    circleRef.current = circle;

    // 2. Render Hospital Markers
    if (showHospitals) {
      INITIAL_HOSPITALS.forEach((hosp) => {
        if (!hosp.coordinates) return;
        const isFocus = hosp.id === focusHospital.id;

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${
              isFocus
                ? '<div class="absolute -inset-2 rounded-full bg-red-600/30 animate-ping"></div>'
                : ''
            }
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/40 border-2 border-white dark:border-neutral-900 group-hover:scale-110 transition-transform">
              <span class="text-sm">+</span>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-neutral-950/90 text-white text-[9px] font-bold shadow-md border border-neutral-700/60 pointer-events-none">
              ${hosp.hospitalName.split(' ')[0]}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-hospital-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([hosp.coordinates.latitude, hosp.coordinates.longitude], {
          icon: customIcon,
        }).addTo(markersGroup);

        marker.on('click', () => {
          setSelectedFacility({ type: 'hospital', id: hosp.id, item: hosp });
        });
      });
    }

    // 3. Render Blood Bank Markers
    if (showBloodBanks) {
      INITIAL_BLOOD_BANKS.forEach((bank) => {
        if (!bank.coordinates) return;

        // Calculate available stock for this bank
        const bankStock = INITIAL_BLOOD_INVENTORY.filter(
          (i) => i.bloodBankId === bank.id
        ).reduce((acc, curr) => acc + curr.availableUnits, 0);

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/40 border-2 border-white dark:border-neutral-900 group-hover:scale-110 transition-transform">
              <span class="text-xs">■</span>
            </div>
            <div class="absolute -top-2 -right-2 px-1 rounded-full bg-blue-900 text-blue-200 text-[8px] font-extrabold border border-blue-400">
              ${bankStock}u
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-neutral-950/90 text-white text-[9px] font-bold shadow-md border border-neutral-700/60 pointer-events-none">
              ${bank.bloodBankName.split(' ')[0]}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-bank-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([bank.coordinates.latitude, bank.coordinates.longitude], {
          icon: customIcon,
        }).addTo(markersGroup);

        marker.on('click', () => {
          setSelectedFacility({ type: 'blood_bank', id: bank.id, item: bank });
        });
      });
    }

    // 4. Render Donor Markers
    if (showDonors) {
      filteredDonors.forEach((donor) => {
        if (!donor.coordinates) return;
        const isUniversal = donor.bloodGroup === 'O-';

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-6 h-6 rounded-full ${
              isUniversal
                ? 'bg-emerald-500 ring-2 ring-emerald-300 ring-offset-1 dark:ring-offset-neutral-900 animate-pulse'
                : 'bg-emerald-600'
            } text-white flex items-center justify-center text-[9px] font-black shadow-md border border-white dark:border-neutral-800 group-hover:scale-125 transition-transform">
              ${donor.bloodGroup}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-donor-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([donor.coordinates.latitude, donor.coordinates.longitude], {
          icon: customIcon,
        }).addTo(markersGroup);

        marker.on('click', () => {
          setSelectedFacility({ type: 'donor', id: donor.id, item: donor });
        });
      });
    }

    // 5. Draw Animated Dispatch Trajectory between Hospital & Nearest Blood Bank
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeRequest) {
      const nearestBank = INITIAL_BLOOD_BANKS[0];
      if (nearestBank?.coordinates && focusHospital.coordinates) {
        const routeCoords: [number, number][] = [
          [focusHospital.coordinates.latitude, focusHospital.coordinates.longitude],
          [
            (focusHospital.coordinates.latitude + nearestBank.coordinates.latitude) / 2 + 0.005,
            (focusHospital.coordinates.longitude + nearestBank.coordinates.longitude) / 2 - 0.008,
          ],
          [nearestBank.coordinates.latitude, nearestBank.coordinates.longitude],
        ];

        const routeLine = L.polyline(routeCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);

        routePolylineRef.current = routeLine;
      }
    }
  }, [
    focusHospital,
    radiusKm,
    showHospitals,
    showBloodBanks,
    showDonors,
    filteredDonors,
    activeRequest,
  ]);

  const handleRecenterChennai = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(CHENNAI_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
    }
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = [
      ...INITIAL_HOSPITALS.map((h) => [h.coordinates?.latitude || 0, h.coordinates?.longitude || 0] as [number, number]),
      ...INITIAL_BLOOD_BANKS.map((b) => [b.coordinates?.latitude || 0, b.coordinates?.longitude || 0] as [number, number]),
    ].filter(([lat, lng]) => lat !== 0 && lng !== 0);

    if (allCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Map Header & Interactive Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-800/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Live Geographic Telemetry Map
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GPS Telemetry
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Interactive high-resolution street, terrain & satellite mapping of Tamil Nadu transfusion facilities
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Style Switcher (Dark, Streets, Satellite) */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setMapLayer('dark')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                mapLayer === 'dark'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Dark Command Center Map"
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
            <button
              onClick={() => setMapLayer('streets')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                mapLayer === 'streets'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="OpenStreetMap Street View"
            >
              <MapIcon className="w-3.5 h-3.5" /> Streets
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                mapLayer === 'satellite'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="True Satellite Terrain View"
            >
              <Satellite className="w-3.5 h-3.5" /> Satellite
            </button>
          </div>

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

          {/* Search Radius */}
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

      {/* Real Map Canvas Container */}
      <div className="relative w-full aspect-video min-h-[500px] max-h-[640px] bg-neutral-950 overflow-hidden">
        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Quick Navigation Floating Buttons (Top Right) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleRecenterChennai}
            className="p-2.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 shadow-xl text-neutral-700 dark:text-neutral-200 hover:text-red-600 hover:bg-white dark:hover:bg-neutral-800 cursor-pointer transition-all"
            title="Recenter on Chennai City Core"
          >
            <Locate className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitBounds}
            className="p-2.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 shadow-xl text-neutral-700 dark:text-neutral-200 hover:text-blue-600 hover:bg-white dark:hover:bg-neutral-800 cursor-pointer transition-all"
            title="Fit Bounds to All Facilities"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Facility Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-neutral-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-800 text-xs text-white shadow-2xl space-y-1.5 max-w-[220px]">
          <div className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 mb-1 flex items-center justify-between">
            <span>Facility Telemetry</span>
            <span className="font-mono text-neutral-500">TN-CH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-red-600 flex items-center justify-center text-[11px] text-white font-black shadow-xs">
              +
            </span>
            <span className="text-[11px]">Trauma Center / Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] text-white shadow-xs">
              ■
            </span>
            <span className="text-[11px]">Licensed Blood Bank</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold shadow-xs">
              ●
            </span>
            <span className="text-[11px]">Verified Voluntary Donor</span>
          </div>
          {activeRequest && (
            <div className="pt-2 border-t border-neutral-800 text-[10px] text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Emergency Dispatch Corridor
            </div>
          )}
        </div>

        {/* Selected Marker Details Flyout (Bottom Right) */}
        {selectedFacility && (
          <div className="absolute bottom-4 right-16 z-30 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl max-w-sm w-full text-xs animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedFacility.type === 'hospital'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : selectedFacility.type === 'blood_bank'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {selectedFacility.type === 'hospital'
                  ? 'Trauma Center'
                  : selectedFacility.type === 'blood_bank'
                  ? 'Certified Blood Bank'
                  : 'Voluntary Citizen Donor'}
              </span>
              <button
                onClick={() => setSelectedFacility(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {selectedFacility.type === 'hospital' && (
              <div className="space-y-2">
                <div className="font-bold text-base text-neutral-900 dark:text-white">
                  {(selectedFacility.item as HospitalProfile).hospitalName}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  {(selectedFacility.item as HospitalProfile).address}
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  <span>Emergency Line: {(selectedFacility.item as HospitalProfile).emergencyContact}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('hospital', selectedFacility.id);
                      if (onRequestBlood) onRequestBlood(selectedFacility.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
                  >
                    Raise / View Requests <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {selectedFacility.type === 'blood_bank' && (
              <div className="space-y-2">
                <div className="font-bold text-base text-neutral-900 dark:text-white">
                  {(selectedFacility.item as BloodBankProfile).bloodBankName}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  {(selectedFacility.item as BloodBankProfile).address}
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hours: {(selectedFacility.item as BloodBankProfile).operatingHours}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('blood_bank', selectedFacility.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    Inspect Inventory Units <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {selectedFacility.type === 'donor' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-neutral-900 dark:text-white">
                    {(selectedFacility.item as DonorProfile).fullName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                    {(selectedFacility.item as DonorProfile).bloodGroup}
                  </span>
                </div>
                <div className="text-neutral-500 dark:text-neutral-400">
                  Area: {(selectedFacility.item as DonorProfile).city} (Privacy Protected)
                </div>
                <div className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                  Total Screened Donations: {(selectedFacility.item as DonorProfile).totalDonationsCount} completed
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (onSelectFacility) onSelectFacility('donor', selectedFacility.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
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
