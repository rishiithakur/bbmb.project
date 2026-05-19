import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, ZoomControl, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { sitesApi } from '../api/sites.api';
import SiteMarker from './SiteMarker';
import { useMapStore } from '../store/map.store';

// Helper to handle map flying and centering
const MapController: React.FC<{ assignedSiteId?: number | null; geoData?: any }> = ({ assignedSiteId, geoData }) => {
  const map = useMap();
  const { selectedSite, setBounds } = useMapStore();

  // Fly to selected site from store
  useEffect(() => {
    if (selectedSite) {
      const lat = Number(selectedSite.latitude);
      const lng = Number(selectedSite.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], 13, {
          duration: 1.5
        });
      }
    }
  }, [selectedSite, map]);

  // If assignedSiteId is provided, fly to it when geoData loads
  useEffect(() => {
    if (assignedSiteId && geoData?.features) {
      const assignedFeature = geoData.features.find(
        (f: any) => f.properties.id === assignedSiteId
      );
      if (assignedFeature) {
        const [lng, lat] = assignedFeature.geometry.coordinates;
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          map.flyTo([parsedLat, parsedLng], 12, {
            duration: 1.0
          });
        }
      }
    }
  }, [assignedSiteId, geoData, map]);

  useEffect(() => {
    const updateBounds = () => {
      const b = map.getBounds();
      setBounds([
        [b.getSouthWest().lat, b.getSouthWest().lng],
        [b.getNorthEast().lat, b.getNorthEast().lng]
      ]);
    };
    map.on('moveend', updateBounds);
    return () => { map.off('moveend', updateBounds); };
  }, [map, setBounds]);

  return null;
};

interface MapContainerProps {
  resizeTrigger?: number;
  assignedSiteId?: number | null;
}

const MapResizer: React.FC<{ resizeTrigger?: number }> = ({ resizeTrigger }) => {
  const map = useMap();
  useEffect(() => {
    if (resizeTrigger !== undefined) {
      // Invalidate the map size instantly and then again shortly after for transition safety
      map.invalidateSize();
      const t = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(t);
    }
  }, [resizeTrigger, map]);
  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ resizeTrigger, assignedSiteId }) => {
  const { data: geoData, isLoading } = useQuery({
    queryKey: ['sites-geojson'],
    queryFn: () => sitesApi.getGeoJSON().then(res => res.data),
    refetchInterval: 60000,
  });

  const center: [number, number] = [31.25, 77.0]; // Central Himachal Pradesh

  // Filter features if assignedSiteId is provided
  const features = assignedSiteId && geoData?.features
    ? geoData.features.filter((f: any) => f.properties.id === assignedSiteId)
    : geoData?.features || [];

  return (
    /*
     * IMPORTANT: This wrapper uses absolute positioning so it completely
     * fills whatever sized parent box it is placed inside.
     * Mobile: parent sets explicit height (e.g. h-[55vw]).
     * Desktop: parent is a flex-1 panel — both work.
     */
    <div className="absolute inset-0 bg-slate-900 overflow-hidden" style={{ touchAction: 'none' }}>
      <style>{`
        /* Compact and offset zoom controls on mobile to prevent overlapping underneath the bottom sheet */
        @media (max-width: 767px) {
          .leaflet-bottom.leaflet-right {
            bottom: 72px !important;
            right: 8px !important;
            transition: bottom 0.3s ease-in-out;
          }
          .leaflet-control-zoom {
            margin-bottom: 0 !important;
            margin-right: 0 !important;
            scale: 0.85;
            transform-origin: bottom right;
          }
          .leaflet-top.leaflet-right {
            top: 8px !important;
            right: 8px !important;
          }
          .leaflet-control-layers {
            margin-top: 0 !important;
            margin-right: 0 !important;
            scale: 0.85;
            transform-origin: top right;
          }
        }
      `}</style>

      {isLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">Loading GIS Data...</p>
          </div>
        </div>
      )}

      <LeafletMap
        center={center}
        zoom={8}
        zoomControl={false}
        /* w-full h-full works because parent is position:absolute with inset-0 */
        className="w-full h-full"
        style={{ background: '#1e2330' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite (Esri)">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Roadmap">
            <TileLayer attribution='&copy; Google' url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Satellite">
            <TileLayer attribution='&copy; Google' url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ZoomControl position="bottomright" />
        <MapController assignedSiteId={assignedSiteId} geoData={geoData} />
        <MapResizer resizeTrigger={resizeTrigger} />

        {features.map((feature: any) => (
          <SiteMarker key={feature.properties.id} feature={feature} />
        ))}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;
