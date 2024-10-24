// @ts-ignore
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf'; // Import de Turf.js
import { Button } from '@mui/material';
import { Point, Intersection } from '../Utils/points';
import 'leaflet/dist/leaflet.css';

interface CarteProps {
    intersections: Intersection[]; // Typage des intersections reçues en props
    adressesLivraisonsAjoutees: Intersection[]; // Typage des livraisons ajoutées manuellement
    adressesLivraisonsXml: Intersection[]; // Typage des livraisons provenant du fichier XML
    setAdresseLivraisonsAjoutees: (adresses: Intersection[]) => void; // Setter pour ajouter les livraisons
    adresseEntrepot: Intersection | null; // Typage de l'entrepôt (un seul entrepôt, ou null)
}

const customMarkerIntersections = new L.Icon({
    iconUrl: require('../img/bouton-denregistrement.png'),
    iconSize: [15, 15],
    popupAnchor: [1, -15],
});

const customMarkerRequeteLivraison = new L.Icon({
    iconUrl: require('../img/colis-color.png'),
    iconSize: [32, 32],
    popupAnchor: [1, -15],
});

const customMarkerLivraisonAjoutee = new L.Icon({
    iconUrl: require('../img/colis-color-2.png'),
    iconSize: [32, 32],
    popupAnchor: [1, -15],
});

const customMarkerEntrepot = new L.Icon({
    iconUrl: require('../img/entrepot.png'),
    iconSize: [35, 35],
    popupAnchor: [1, -15],
});

const polygonStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    weight: 3,
    color: '#000',
    opacity: 1
};

const Carte: React.FC<CarteProps> = ({
                                         intersections,
                                         adressesLivraisonsAjoutees,
                                         adressesLivraisonsXml,
                                         setAdresseLivraisonsAjoutees,
                                         adresseEntrepot
                                     }) => {
    const [zoomLevel, setZoomLevel] = useState<number>(13);
    const [convexHull, setConvexHull] = useState<any>(null);
    const [intersectionsFiltrees, setIntersectionsFiltrees] = useState<Intersection[]>([]);
    
    const minZoomLevelForIntersections = 16;
    
    const ajouterBouton = (id: number, longitude:number, latitude:number, adresse: string) => {
        const adresseExiste = adressesLivraisonsAjoutees.some((livraison) => livraison.id === id);
        if (!adresseExiste) {
            setAdresseLivraisonsAjoutees([...adressesLivraisonsAjoutees, 
                { id: id, 
                longitude: longitude, 
                latitude: latitude, 
                adresse: adresse }]);
        }
    };

    const MapEvents = () => {
        useMapEvents({
            zoomend: (e) => {
                setZoomLevel(e.target.getZoom());
            },
        });
        return null;
    };

    useEffect(() => {

        // Permet de filtre les intersections pour ne pas afficher celles déjà ajoutées
        const filteredIntersections = intersections.filter(intersection => {
            const isInAdressesLivraisonsXMLs = adressesLivraisonsXml.some(livraison => livraison.id === intersection.id);
            const isEntrepot = adresseEntrepot && adresseEntrepot.id === intersection.id;
            const isAdresseLivraisonsAjoutees = adressesLivraisonsAjoutees.some(livraison => livraison.id === intersection.id);
            return !isInAdressesLivraisonsXMLs && !isEntrepot && !isAdresseLivraisonsAjoutees;
        });
        setIntersectionsFiltrees(filteredIntersections);
        
        const allPoints = [...intersections, ...adressesLivraisonsXml];
        if (adresseEntrepot) {
            allPoints.push(adresseEntrepot);
        }

        if (allPoints.length > 2) {
            const pointsGeoJson = turf.featureCollection(
                allPoints.map((point) =>
                    turf.point([point.longitude, point.latitude])
                )
            );

            const hull = turf.convex(pointsGeoJson);

            if (hull) {
                const coordinates = hull.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]);
                setConvexHull(coordinates);
            }
        }

    }, [intersections, adressesLivraisonsXml, adresseEntrepot, adressesLivraisonsAjoutees]);

    return (
        <MapContainer center={[45.75, 4.85]} zoom={zoomLevel} style={{ height: '400px', width: '100%' }}>
            <MapEvents />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {zoomLevel >= minZoomLevelForIntersections && intersectionsFiltrees.map((intersection) => (
                <Marker key={intersection.id} position={[intersection.latitude, intersection.longitude]} icon={customMarkerIntersections}>
                    <Popup>
                        <span>{`Intersection ID: ${intersection.id}`}</span>
                        <br />
                        <span><b>{`Adresse : ${intersection.adresse}`}</b><br/></span>
                        <Button onClick={() => 
                            ajouterBouton(intersection.id, intersection.longitude, intersection.latitude, intersection.adresse)}>Ajouter</Button>
                    </Popup>
                </Marker>
            ))}

            {adresseEntrepot && (
                <Marker key={adresseEntrepot.id} position={[adresseEntrepot.latitude, adresseEntrepot.longitude]} icon={customMarkerEntrepot}>
                    <Popup>
                        <span>{`Entrepôt ID: ${adresseEntrepot.id}`}</span>
                        <br />
                        <span><b>{`Adresse de l'entrepôt : ${adresseEntrepot.adresse}`}</b><br/></span>
                    </Popup>
                </Marker>
            )}

            {adressesLivraisonsXml && adressesLivraisonsXml.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]} icon={customMarkerRequeteLivraison}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br />
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br/></span>
                    </Popup>
                </Marker>
            ))}
            
            {adressesLivraisonsAjoutees && adressesLivraisonsAjoutees.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]} icon={customMarkerLivraisonAjoutee}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br />
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br/></span>
                    </Popup>
                </Marker>
            ))}

            {convexHull && (
                <Polygon positions={convexHull} pathOptions={polygonStyle}/>
            )}
        </MapContainer>
    );
};

export default Carte;