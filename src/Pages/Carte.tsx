import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Point } from '../Utils/points';  // Importation de l'interface Point
import L from 'leaflet';
import PlaceIcon from '@mui/icons-material/Place';

interface CarteProps {
    points: Point[];  // Typage des points reçus en props
}

const customIcon = new L.Icon({
    iconUrl: require('../img/marker.png'),  // Correctly use the imported icon
    iconSize: [25, 25], // taille de l'icône
    iconAnchor: [12, 41], // point d'ancrage de l'icône
    popupAnchor: [1, -34], // point d'ancrage du popup
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    shadowSize: [20, 20 ], // taille de l'ombre
});

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
                <Marker key={point.id} position={[point.lat, point.long]} icon={customIcon}>
                    <Popup>
                        <span>{`Point ID: ${point.id}`}</span>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Carte;