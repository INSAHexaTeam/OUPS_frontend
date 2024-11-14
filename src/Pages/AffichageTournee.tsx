import React from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/AffichageTournee.css';

const calculerDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const AffichageTournee = () => {
    const location = useLocation();
    const { donneesTournee } = location.state;
    const vitesseMoyenneKmpm = 15 / 60; // Speed in km per minute

    return (
        <div id="conteneur-tournee">
            {donneesTournee.map((tournee, index) => {
                const idsLivraison = new Set(tournee.livraisons.livraisons.map(livraison => livraison.intersection.id));
                const lastDeliveryId = tournee.livraisons.livraisons[tournee.livraisons.livraisons.length - 1].intersection.id;
                let indexLivraisonActuelle = 0;
                const nombreDeLivraisons = tournee.livraisons.livraisons.length;
                const { entrepot } = tournee.livraisons;
                
                let livraisonCounter = 1; // Counter for "Livraison" labels
                let arretCounter = 1; // Counter for "Arrêt" labels

                return (
                    <div key={index} className="bloc-tournee">
                        <h3>Coursier {index + 1}</h3>
                        <div className="chemin-intersections">
                            <h4>Itinéraire :</h4>
                            {tournee.cheminIntersections.map((intersection, idx, array) => {
                                let distanceAuSuivant = 0;
                                let tempsDeTrajetEnMinutesAuSuivant = 0;
                                let distanceALivraison = 0;
                                let tempsDeTrajetALivraison = 0;
                                const estDerniereLivraison = indexLivraisonActuelle === nombreDeLivraisons;

                                // Calculate distance to the next intersection (or to the warehouse at the end)
                                if (idx < array.length - 1) {
                                    const prochaineIntersection = array[idx + 1];
                                    distanceAuSuivant = calculerDistance(
                                        intersection.latitude,
                                        intersection.longitude,
                                        prochaineIntersection.latitude,
                                        prochaineIntersection.longitude
                                    );
                                    tempsDeTrajetEnMinutesAuSuivant = distanceAuSuivant / vitesseMoyenneKmpm;
                                } else if (estDerniereLivraison && entrepot.latitude && entrepot.longitude) {
                                    distanceAuSuivant = calculerDistance(
                                        intersection.latitude,
                                        intersection.longitude,
                                        entrepot.latitude,
                                        entrepot.longitude
                                    );
                                    tempsDeTrajetEnMinutesAuSuivant = distanceAuSuivant / vitesseMoyenneKmpm;
                                }

                                // Calculate distance to the next delivery
                                if (!estDerniereLivraison && indexLivraisonActuelle < nombreDeLivraisons) {
                                    const livraison = tournee.livraisons.livraisons[indexLivraisonActuelle];
                                    if (intersection.id !== livraison.intersection.id) {
                                        distanceALivraison = calculerDistance(
                                            intersection.latitude,
                                            intersection.longitude,
                                            livraison.intersection.latitude,
                                            livraison.intersection.longitude
                                        );
                                        tempsDeTrajetALivraison = distanceALivraison / vitesseMoyenneKmpm;
                                    } else {
                                        indexLivraisonActuelle++;
                                        livraisonCounter++;
                                        arretCounter = 1;
                                    }
                                }

                                return (
                                    <p key={intersection.id} className={idsLivraison.has(intersection.id) ? 'highlight' : ''}>
                                        {!estDerniereLivraison ? (
                                        <span className="step-number">
                                            {idsLivraison.has(intersection.id) ? `Livraison ${livraisonCounter-1} - Arrêt final` : `Livraison ${livraisonCounter} - Arrêt ${arretCounter++}`}
                                        </span>
                                        ): null }
                                        <br />
                                        <span className="label">Nom Rue:</span> <span className="value">{intersection.adresse || intersection.voisins[0].nomRue}</span>
                                        <div className="distance-time">
                                            <span>Distance au suivant: {distanceAuSuivant.toFixed(2)} km</span>
                                            <span>Temps: {tempsDeTrajetEnMinutesAuSuivant.toFixed(2)} minutes</span>
                                        </div>

                                        {intersection.id === lastDeliveryId ? (
                                            <>Dernière livraison complétée, retour à l'entrepôt</>
                                        ) : idsLivraison.has(intersection.id) ? (
                                            <><br /> Arrivé</>
                                        ) : (!estDerniereLivraison && intersection.id !== lastDeliveryId) ? (
                                            <div className="distance-time">
                                                <span>Distance restante: {distanceALivraison.toFixed(2)} km</span>
                                                <span>Temps restant: {tempsDeTrajetALivraison.toFixed(2)} minutes</span>
                                            </div>
                                        ) : null}
                                    </p>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AffichageTournee;
