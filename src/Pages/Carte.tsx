import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Point } from '../Utils/points';  // Importation de l'interface Point

interface CarteProps {
    points: Point[];  // Typage des points reçus en props
}

const Carte: React.FC<CarteProps> = ({ points }) => {
    // Si des points sont disponibles, utiliser le premier point pour la position par défaut
    const defaultPosition: [number, number] = points.length > 0 ? [points[0].lat, points[0].long] : [45.75, 4.85];

    return (
        <MapContainer center={defaultPosition} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Affichage des marqueurs pour chaque point */}
            {points.map(point => (
                <Marker key={point.id} position={[point.lat, point.long]} />
            ))}
        </MapContainer>
    );
};

export default Carte;
