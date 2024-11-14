import React from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/AffichageTournee.css';

const calculerDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; 
};

const AffichageTournee = () => {
    const location = useLocation();
    const { donneesTournee } = location.state;
    const vitesseMoyenneMpm = (15 * 1000) / 60; 


    return (
        <div id="conteneur-tournee">
            {donneesTournee.map((tournee, index) => {
                const livraisonsDetails = tournee.livraisons.livraisons.slice(1, -1).map(livraison => ({
                    id: livraison.intersection.id,
                    latitude: livraison.intersection.latitude,
                    longitude: livraison.intersection.longitude
                }));

                const lastDeliveryId = livraisonsDetails[livraisonsDetails.length - 1]?.id;
                let indexLivraisonActuelle = 0;
                const nombreDeLivraisons = livraisonsDetails.length;
                const { entrepot } = tournee.livraisons;
                
                let livraisonCounter = 1; 
                let arretCounter = 1; 

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

                                if (idx < array.length - 1) {
                                    const prochaineIntersection = array[idx + 1];
                                    distanceAuSuivant = calculerDistance(
                                        intersection.latitude,
                                        intersection.longitude,
                                        prochaineIntersection.latitude,
                                        prochaineIntersection.longitude
                                    );
                                    tempsDeTrajetEnMinutesAuSuivant = distanceAuSuivant / vitesseMoyenneMpm;
                                }

                                if (!estDerniereLivraison && indexLivraisonActuelle < nombreDeLivraisons) {
                                    const livraison = livraisonsDetails[indexLivraisonActuelle];
                                    if (intersection.id !== livraison.id) {
                                        distanceALivraison = calculerDistance(
                                            intersection.latitude,
                                            intersection.longitude,
                                            livraison.latitude,
                                            livraison.longitude
                                        );
                                        tempsDeTrajetALivraison = distanceALivraison / vitesseMoyenneMpm;
                                    } else {
                                        livraisonCounter++;
                                        indexLivraisonActuelle++;
                                        arretCounter = 1;
                                    }
                                }

                                const isDeliveryPoint = livraisonsDetails.some(livraison => livraison.id === intersection.id);

                                return (
                                    <p key={intersection.id} className={isDeliveryPoint ? 'highlight' : ''}>
                                        {!estDerniereLivraison ? (
                                        <span className="step-number">
                                            {isDeliveryPoint ? `Livraison ${livraisonCounter - 1} - Arrêt final` : `Livraison ${livraisonCounter} - Arrêt ${arretCounter++}`}
                                        </span>
                                        ): null }
                                        <br />
                                        <span className="label">Nom Rue:</span> <span className="value">{intersection.adresse || intersection.voisins[0].nomRue}</span>
                                        <div className="distance-time">
                                            <span>Distance au suivant: {distanceAuSuivant.toFixed(2)} m</span>
                                            <span>Temps: {tempsDeTrajetEnMinutesAuSuivant.toFixed(2)} minutes</span>
                                        </div>

                                        {intersection.id === lastDeliveryId ? (
                                            <>Dernière livraison complétée, retour à l'entrepôt</>
                                        ) : isDeliveryPoint ? (
                                            <><br /> Arrivé</>
                                        ) : (!estDerniereLivraison && intersection.id !== lastDeliveryId) ? (
                                            <div className="distance-time">
                                                <span>Distance restante: {distanceALivraison.toFixed(2)} m</span>
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
