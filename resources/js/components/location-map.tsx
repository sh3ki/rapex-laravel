import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_LOCATION: [number, number] = [14.636, 120.959];

export function LocationMap({ latitude, longitude, googleMapsApiKey: _googleMapsApiKey, onLocationChange, compact = false }: {
    latitude: number | null;
    longitude: number | null;
    googleMapsApiKey?: string;
    onLocationChange?: (location: { latitude: number; longitude: number }) => void;
    compact?: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.CircleMarker | null>(null);
    const onLocationChangeRef = useRef(onLocationChange);
    onLocationChangeRef.current = onLocationChange;
    const selected = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : DEFAULT_LOCATION;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { zoomControl: !compact, attributionControl: true }).setView(selected, compact ? 13 : 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        map.on('click', (event) => onLocationChangeRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    }, [compact]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const refreshLocation = () => {
            map.invalidateSize({ animate: false, pan: false });
            map.setView(selected, compact ? 13 : map.getZoom(), { animate: false });
            markerRef.current?.remove();
            if (latitude !== null && longitude !== null) {
                markerRef.current = L.circleMarker(selected, { radius: 9, color: '#2563eb', weight: 3, fillColor: '#60a5fa', fillOpacity: 0.9 }).addTo(map);
            }
        };
        refreshLocation();
        const frame = requestAnimationFrame(refreshLocation);
        const timer = window.setTimeout(refreshLocation, 120);
        return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
    }, [latitude, longitude, compact]);

    return <div ref={containerRef} className={`relative z-0 ${compact ? 'h-full' : 'h-64'} w-full overflow-hidden rounded-lg border`} role={onLocationChange ? 'application' : undefined} aria-label={onLocationChange ? 'Click the OpenStreetMap map to select a location' : 'Location map'} />;
}
