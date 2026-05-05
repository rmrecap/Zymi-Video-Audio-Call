import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const NearbyMap = ({ center, markers = [] }) => {
  // Center is [lat, lng]
  const defaultCenter = center || [23.8103, 90.4125]; // Default to Dhaka

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
      >
        {/* CartoDB Dark Matter Tiles - 100% Free & Cyberpunk Themed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Current User Marker */}
        <Marker position={defaultCenter}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Nearby Users Markers */}
        {markers.map((user, idx) => (
          <Marker key={idx} position={[user.lat, user.lng]}>
            <Popup>
              <div style={{ color: '#0f172a' }}>
                <strong>{user.username}</strong><br />
                {user.distance ? `${user.distance.toFixed(1)} km away` : 'Nearby'}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default NearbyMap;
