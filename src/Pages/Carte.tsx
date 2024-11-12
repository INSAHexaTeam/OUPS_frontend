import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import * as turf from '@turf/turf';
import { Button } from '@mui/material';
import { Point, Intersection } from '../Utils/points';
import 'leaflet/dist/leaflet.css';
import { Action } from "../Utils/types";
import MapTaille from './MapTaille.tsx';

interface CarteProps {
    ajoutActionStack: (action: Action) => void;
    viderListeUndoRollback: () => void;
    intersections: Intersection[];
    adressesLivraisonsAjoutees: Intersection[];
    adressesLivraisonsXml: Intersection[];
    setAdresseLivraisonsAjoutees: (adresses: Intersection[]) => void;
    adresseEntrepot: Intersection | null;
    setAdresseEntrepot: (adresse: Intersection) => void;
    zoomerVersPoint: (latitude: number, longitude: number) => void;
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
    itineraireSelectionne?: number;
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
    color: 'purple',
    opacity: 0.8,
    dashArray: '5, 5',
};

const couleursItineraires = ['#FF0000', '#0000FF', '#808080', '#DE2AEE', '#008000'];

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
                                         itineraires,
                                         itineraireSelectionne,
                                         isTourneeCalculee
                                     }) => {
    const [niveauZoom, setNiveauZoom] = useState<number>(13);
    const [convexHull, setConvexHull] = useState<any>(null);
    const [intersectionsFiltrees, setIntersectionsFiltrees] = useState<Intersection[]>([]);
    const [limitesCarte, setLimitesCarte] = useState<L.LatLngBounds | null>(null);
    const refCarte = useRef<L.Map>(null);
    const [initialCenter, setInitialCenter] = useState<L.LatLng | null>(null);
    const [decorateursFlèches, setDecorateursFlèches] = useState<L.Layer[]>([]);

    const minNiveauZoomForIntersections = 16;

    const ajouterBouton = (id: number, longitude: number, latitude: number, adresse: string) => {
        const adresseExiste = adressesLivraisonsAjoutees.some((livraison) => livraison.id === id);
        if (!adresseExiste) {
            const nouvelleIntersection = { id, longitude, latitude, adresse };
            if (!adresseEntrepot) {
                ajoutActionStack({ type: 0, intersection: nouvelleIntersection, isEntrepot: true });
                setAdresseEntrepot(nouvelleIntersection);
            } else {
                setAdresseLivraisonsAjoutees([...adressesLivraisonsAjoutees, nouvelleIntersection]);
                viderListeUndoRollback();
                ajoutActionStack({ type: 0, intersection: nouvelleIntersection, isEntrepot: false });
            }
        }
    };

    const addArrowsToPolyline = (positions, isSelected = false) => {
        const polyline = L.polyline(positions);
        const arrowOptions = {
            offset: '10%',
            repeat: '60px',
            symbol: L.Symbol.arrowHead({
                pixelSize: isSelected ? 20 : 15,
                polygon: false,
                pathOptions: {
                    color: isSelected ? '#000000' : '#FFD700', // Couleur jaune si sélectionné
                    fillOpacity: 1,
                    weight: isSelected ? 3 : 2,
                    opacity: 1
                }
            })
        };
        const decorator = L.polylineDecorator(polyline, { patterns: [arrowOptions] });
        decorator.addTo(refCarte.current); // Ajouter le décorateur de flèches à la carte
        return decorator;
    };

    const reinitialiserFlèches = () => {
        decorateursFlèches.forEach(decorateur => decorateur.remove());
        setDecorateursFlèches([]);
    };

    useEffect(() => {
        reinitialiserFlèches();
        const nouveauxDecorateurs = itineraires.map((itineraire, index) => {
            const positions = itineraire.cheminIntersections.map(intersection => [
                intersection.latitude,
                intersection.longitude
            ]);
            const isSelected = itineraireSelectionne === index;
            return addArrowsToPolyline(positions, isSelected);
        });
        setDecorateursFlèches(nouveauxDecorateurs);
    }, [itineraires, itineraireSelectionne]);

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
                allPoints.map((point) => turf.point([point.longitude, point.latitude]))
            );

            const hull = turf.convex(pointsGeoJson);

            if (hull) {
                const coordinates = hull.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]);
                setConvexHull(coordinates);
            }
        }
    }, [intersections, adressesLivraisonsXml, adresseEntrepot, adressesLivraisonsAjoutees, limitesCarte]);

    useEffect(() => {
        if (convexHull) {
            const calculatedCenter = L.polygon(convexHull).getBounds().getCenter();
            setInitialCenter(calculatedCenter);
        }
    }, [convexHull]);

    const gererZoomSurPoint = (latitude: number, longitude: number) => {
        if (refCarte.current) {
            refCarte.current.setView([latitude, longitude], 16);
        }
    };

    useEffect(() => {
        zoomerVersPoint(gererZoomSurPoint);
    }, [zoomerVersPoint]);

    const offsetLatLng = (lat: number, lng: number, offsetLat: number, offsetLng: number) => {
        const metersToDegreesLat = 0.000009;
        const metersToDegreesLng = 0.000009;
        return [
            lat + (offsetLat * metersToDegreesLat),
            lng + (offsetLng * metersToDegreesLng)
        ];
    };
    return (initialCenter ? (
        <MapContainer center={initialCenter} zoom={niveauZoom} style={{ height: '100%', width: '100%' }} ref={refCarte}>
            <MapTaille isTourneeCalculee={isTourneeCalculee} />
            <MapEvents />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Rendre tous les itinéraires sauf le sélectionné */}
            {adresseEntrepot && itineraires.map((itineraire, index) => {
                if (itineraireSelectionne === index) return null; // Ignorer l'itinéraire sélectionné ici

                const color = couleursItineraires[index % couleursItineraires.length];
                const offset = index * 1;

                const offsetPositions = itineraire.cheminIntersections.map(intersection => {
                    return offsetLatLng(
                        intersection.latitude,
                        intersection.longitude,
                        offset,
                        offset
                    );
                });

                return (
                    <React.Fragment key={index}>
                        <Polyline positions={offsetPositions} color={'white'} weight={8} opacity={1} />
                        <Polyline positions={offsetPositions} color={color} weight={4} opacity={1}>
                            <Popup>Tournée {index + 1}</Popup>
                        </Polyline>
                    </React.Fragment>
                );
            })}

            {/* Rendre l'itinéraire sélectionné au-dessus des autres */}
            {itineraireSelectionne !== undefined && (
                <React.Fragment key={`selected-${itineraireSelectionne}`}>
                    {adresseEntrepot && (() => {
                        const itineraire = itineraires[itineraireSelectionne];
                        if (!itineraire) return null; // Vérifier si l'itinéraire existe

                        const color = couleursItineraires[itineraireSelectionne % couleursItineraires.length];
                        const positions = itineraire.cheminIntersections.map(intersection => [
                            intersection.latitude,
                            intersection.longitude
                        ]);

                        return (
                            <>
                                <Polyline positions={positions} color={'white'} weight={10} opacity={1} />
                                <Polyline positions={positions} color={color} weight={6} opacity={1}>
                                    <Popup>Tournée {itineraireSelectionne + 1}</Popup>
                                </Polyline>
                            </>
                        );
                    })()}
                </React.Fragment>
            )}

            {niveauZoom >= minNiveauZoomForIntersections && intersectionsFiltrees.map((intersection) => (
                <Marker key={intersection.id} position={[intersection.latitude, intersection.longitude]}
                        icon={marqueurIntersections}>
                    <Popup>
                        <span>{`Intersection ID: ${intersection.id}`}</span>
                        <br />
                        <span><b>{`Adresse : ${intersection.adresse}`}</b><br /></span>
                        <Button onClick={() => ajouterBouton(intersection.id, intersection.longitude, intersection.latitude, intersection.adresse)}>
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
                        <br />
                        <span><b>{`Adresse de l'entrepôt : ${adresseEntrepot.adresse}`}</b><br /></span>
                    </Popup>
                </Marker>
            )}

            {adressesLivraisonsXml.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]}
                        icon={marqueurRequeteLivraison}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br />
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br /></span>
                    </Popup>
                </Marker>
            ))}

            {adressesLivraisonsAjoutees.map((livraison) => (
                <Marker key={livraison.id} position={[livraison.latitude, livraison.longitude]}
                        icon={marqueurLivraisonAjoutee}>
                    <Popup>
                        <span>{`Livraison ID: ${livraison.id}`}</span>
                        <br />
                        <span><b>{`Adresse de livraison : ${livraison.adresse}`}</b><br /></span>
                    </Popup>
                </Marker>
            ))}
            {convexHull && (
                <Polygon positions={convexHull} pathOptions={polygonStyle} />
            )}
        </MapContainer>
    ) : (
        <div>Chargement de la carte...</div>
    ));

};

export default Carte;
