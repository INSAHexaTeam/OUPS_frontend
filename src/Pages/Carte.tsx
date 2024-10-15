import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Carte: React.FC = () => {

    const position = [45.75, 4.850000]
    return (
        <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }} >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
        </MapContainer>
    );
};

export default Carte;