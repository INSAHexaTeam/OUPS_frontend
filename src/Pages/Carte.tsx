import React, { useEffect, useState, useRef } from 'react';
import {MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, Polyline} from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { Button } from '@mui/material';
import { Point, Intersection } from '../Utils/points';
import 'leaflet/dist/leaflet.css';
import {Action} from "../Utils/types";

interface CarteProps {
    ajoutActionStack: (action: Action) => void;
    viderListeUndoRollback : () => void;
    intersections: Intersection[];
    adressesLivraisonsAjoutees: Intersection[];
    adressesLivraisonsXml: Intersection[];
    setAdresseLivraisonsAjoutees: (adresses: Intersection[]) => void;
    adresseEntrepot: Intersection | null;
    setAdresseEntrepot : (adresse: Intersection) => void;
    zoomerVersPoint: (latitude: number, longitude: number) => void; // New prop
    itineraires: {
        cheminIntersections: Intersection[];
        livraisons: {
            entrepot: {
                intersection: Intersection;
            };
            livraisons: {
                intersection: Intersection;
                estUneLivraison: boolean;
            }[];
        };
    }[];
}

const marqueurIntersections = new L.Icon({
    iconUrl: require('../img/bouton-denregistrement.png'),
    iconSize: [15, 15],
    popupAnchor: [1, -15],
});

const marqueurRequeteLivraison = new L.Icon({
    iconUrl: require('../img/colis-color.png'),
    iconSize: [32, 32],
    popupAnchor: [1, -15],
});

const marqueurLivraisonAjoutee = new L.Icon({
    iconUrl: require('../img/colis-color-2.png'),
    iconSize: [32, 32],
    popupAnchor: [1, -15],
});

const marqueurEntrepot = new L.Icon({
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

// Fonction pour générer une couleur aléatoire en hexadécimal
const genererCouleurAleatoire = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};


const Carte: React.FC<CarteProps> = ({
                                         ajoutActionStack,
                                         viderListeUndoRollback,
                                         intersections,
                                         adressesLivraisonsAjoutees,
                                         adressesLivraisonsXml,
                                         setAdresseLivraisonsAjoutees,
                                         adresseEntrepot,
                                         setAdresseEntrepot,
                                         zoomerVersPoint,
                                         itineraires
                                     }) => {
    const [niveauZoom, setNiveauZoom] = useState<number>(13);
    const [convexHull, setConvexHull] = useState<any>(null);
    const [intersectionsFiltrees, setIntersectionsFiltrees] = useState<Intersection[]>([]);
    const [limitesCarte, setLimitesCarte] = useState<L.LatLngBounds | null>(null);
    const refCarte = useRef<L.Map>(null); // Reference to the map

    const minNiveauZoomForIntersections = 16;

    const ajouterBouton = (id: number, longitude: number, latitude: number, adresse: string) => {
        const adresseExiste = adressesLivraisonsAjoutees.some((livraison) => livraison.id === id);
        if (!adresseExiste) {
            const newIntersection = { id, longitude, latitude, adresse };
            if (!adresseEntrepot) {
                // on ajoute l'action de l'ajout de la livraison à la stack
                ajoutActionStack({ type: 0, intersection: newIntersection, isEntrepot: true });
                
                setAdresseEntrepot(newIntersection);
            } else {
                setAdresseLivraisonsAjoutees([...adressesLivraisonsAjoutees, newIntersection]);
                // vider la liste undo rollback car une action a été effectuée
                viderListeUndoRollback();
                
                // on ajoute l'action de l'ajout de la livraison à la stack
                ajoutActionStack({ type: 0, intersection: newIntersection,  isEntrepot: false });
            }
        }
    };

    const MapEvents = () => {
        useMapEvents({
            zoomend: (e) => {
                setNiveauZoom(e.target.getZoom());
                setLimitesCarte(e.target.getBounds());
            },
            moveend: (e) => {
                setLimitesCarte(e.target.getBounds());
            }
        });
        return null;
    };

    useEffect(() => {
        const filteredIntersections = intersections.filter(intersection => {
            const isInAdressesLivraisonsXMLs = adressesLivraisonsXml.some(livraison => livraison.id === intersection.id);
            const isEntrepot = adresseEntrepot && adresseEntrepot.id === intersection.id;
            const isAdresseLivraisonsAjoutees = adressesLivraisonsAjoutees.some(livraison => livraison.id === intersection.id);
            const isInBounds = limitesCarte ? limitesCarte.contains([intersection.latitude, intersection.longitude]) : true;
            return !isInAdressesLivraisonsXMLs && !isEntrepot && !isAdresseLivraisonsAjoutees && isInBounds;
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

    }, [intersections, adressesLivraisonsXml, adresseEntrepot, adressesLivraisonsAjoutees, limitesCarte]);

    // Function to zoom and center the map on a specific point
    const gererZoomSurPoint = (latitude: number, longitude: number) => {
        if (refCarte.current) {
            refCarte.current.setView([latitude, longitude], 16); // Zoom level 18
        }
    };

    // Pass the function to the parent component
    useEffect(() => {
        zoomerVersPoint(gererZoomSurPoint);
    }, [zoomerVersPoint]);

    // Fonction pour décaler un point géographique
    const offsetLatLng = (lat: number, lng: number, offsetLat: number, offsetLng: number) => {
        // Conversion approximative de mètres en degrés
        // À ajuster selon votre zone géographique
        const metersToDegreesLat = 0.000009;
        const metersToDegreesLng = 0.000009;

        return [
            lat + (offsetLat * metersToDegreesLat),
            lng + (offsetLng * metersToDegreesLng)
        ];
    };

    return (
        <MapContainer center={[45.75, 4.85]} zoom={niveauZoom} style={{height: '400px', width: '100%'}} ref={refCarte}>
            <MapEvents/>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Tracer les itinéraires entre l'entrepôt et les livraisons */}
            {adresseEntrepot && itineraires.map((itineraire, index) => {
                const color = genererCouleurAleatoire();

                // Calculer le décalage pour chaque trajet
                // Le premier trajet n'est pas décalé, les suivants sont décalés progressivement
                const offset = index * 1; // 20 mètres de décalage entre chaque trajet

                // Créer le trajet décalé
                const offsetPositions = itineraire.cheminIntersections.map(intersection => {
                    // Décaler le point perpendiculairement au trajet
                    return offsetLatLng(
                        intersection.latitude,
                        intersection.longitude,
                        offset,
                        offset
                    );
                });

                return (
                    <React.Fragment key={index}>
                        {/* Contour blanc */}
                        <Polyline
                            positions={offsetPositions}
                            color={'white'}
                            weight={8}
                            opacity={0.6}
                        />

                        {/* Ligne colorée principale */}
                        <Polyline
                            positions={offsetPositions}
                            color={color}
                            weight={4}
                            opacity={1}
                        >
                            <Popup>Tournée {index + 1}</Popup>
                        </Polyline>

                        {/* Marqueurs pour les points de livraison */}
                        {itineraire.livraisons.livraisons
                            .filter(livraison => livraison?.estUneLivraison)
                            .map((livraison, livraisonIndex) => {
                                const [offsetLat, offsetLng] = offsetLatLng(
                                    livraison?.intersection?.latitude,
                                    livraison?.intersection?.longitude,
                                    offset,
                                    offset
                                );

                                return (
                                    <Marker
                                        key={`${index}-${livraisonIndex}`}
                                        position={[offsetLat, offsetLng]}
                                        icon={L.divIcon({
                                            html: `
                                    <div style="
                                        background-color: ${color};
                                        color: white;
                                        border-radius: 50%;
                                        width: 24px;
                                        height: 24px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        border: 2px solid white;
                                        font-size: 12px;
                                    ">
                                        ${livraisonIndex + 1}
                                    </div>
                                `,
                                            className: 'custom-div-icon',
                                            iconSize: [24, 24],
                                            iconAnchor: [12, 12]
                                        })}
                                    >
                                        <Popup>
                                            <div>Point de livraison {livraisonIndex + 1}</div>
                                            <div>ID: {livraison?.intersection?.id}</div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                    </React.Fragment>
                );
            })}
            
            {niveauZoom >= minNiveauZoomForIntersections && intersectionsFiltrees.map((intersection) => (
                <Marker key={intersection.id} position={[intersection.latitude, intersection.longitude]}
                        icon={marqueurIntersections}>
                    <Popup>
                        <span>{`Intersection ID: ${intersection.id}`}</span>
                        <br/>
                        <span><b>{`Adresse : ${intersection.adresse}`}</b><br/></span>
                        <Button onClick={() =>
                            ajouterBouton(intersection.id, intersection.longitude, intersection.latitude, intersection.adresse)}
                        >
                            {adresseEntrepot ? 'Ajouter une livraison' : 'Définir comme entrepôt'}
                        </Button>
                    </Popup>
                </Marker>
            ))}

            {adresseEntrepot && (
                <Marker key={adresseEntrepot.id} position={[adresseEntrepot.latitude, adresseEntrepot.longitude]}
                        icon={marqueurEntrepot}>
                    <Popup>
                        <span>{`Entrepôt ID: ${adresseEntrepot.id}`}</span>
                        <br/>
                        <span><b>{`Adresse de l'entrepôt : ${adresseEntrepot.adresse}`}</b><br/></span>
                    </Popup>
                </Marker>
            )}

            {adressesLivraisonsXml && adressesLivraisonsXml.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]}
                        icon={marqueurRequeteLivraison}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br/>
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br/></span>
                    </Popup>
                </Marker>
            ))}

            {adressesLivraisonsAjoutees && adressesLivraisonsAjoutees.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]}
                        icon={marqueurLivraisonAjoutee}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br/>
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