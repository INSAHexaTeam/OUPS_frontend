import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Intersection, Itineraire } from '../Utils/points';
import 'leaflet/dist/leaflet.css';

interface CarteTourneeProps {
    adressesLivraisons: Intersection[];
    adresseEntrepot: Intersection | null;
    zoomerVersPoint: (latitude: number, longitude: number) => void;
    itineraires: Itineraire[];
}

const marqueurRequeteLivraison = new L.Icon({
    iconUrl: require('../img/colis-color.png'),
    iconSize: [32, 32],
    popupAnchor: [1, -15],
});
const marqueurEntrepot = new L.Icon({
    iconUrl: require('../img/entrepot.png'),
    iconSize: [35, 35],
    popupAnchor: [1, -15],
});

// Fonction pour générer une couleur aléatoire en hexadécimal
const genererCouleurAleatoire = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const Carte: React.FC<CarteTourneeProps> = ({
                                                adressesLivraisons,
                                                adresseEntrepot,
                                                zoomerVersPoint,
                                                itineraires
                                            }) => {
    const refCarte = useRef<L.Map>(null);

    return (
        <MapContainer center={[45.75, 4.85]} zoom={13} style={{ height: '400px', width: '100%' }} ref={refCarte}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Tracer les itinéraires entre l'entrepôt et les livraisons */}
            {adresseEntrepot && itineraires.map((itineraire, index) => {
                // Générer une couleur aléatoire pour chaque tournée
                const color = itineraire.couleur || genererCouleurAleatoire();
                return (
                    <Polyline
                        key={index}
                        positions={[
                            [adresseEntrepot.latitude, adresseEntrepot.longitude], // Entrepôt
                            ...itineraire.livraisons.map((delivery) => [delivery.intersection.latitude, delivery.intersection.longitude]) // Livraison(s)
                        ]}
                        color={color}
                        weight={4}
                    />
                );
            })}

            {/* Marqueurs des adresses de livraison */}
            {adressesLivraisons.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]} icon={marqueurRequeteLivraison}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br />
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br /></span>
                    </Popup>
                </Marker>
            ))}

            {/* Marqueur de l'entrepôt */}
            {adresseEntrepot && (
                <Marker key={adresseEntrepot.id} position={[adresseEntrepot.latitude, adresseEntrepot.longitude]} icon={marqueurEntrepot}>
                    <Popup>
                        <span>{`Entrepôt ID: ${adresseEntrepot.id}`}</span>
                        <br />
                        <span><b>{`Adresse de l'entrepôt : ${adresseEntrepot.adresse}`}</b><br /></span>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export default Carte;
