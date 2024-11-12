import React from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/AffichageTournee.css';

type Intersection = {
    id: number;
    latitude: number;
    longitude: number;
    adresse: string;
    voisins: Array<{ destination: string | null; nomRue: string; longueur: number }>;
};

type Livraison = {
    estUneLivraison: boolean;
    intersection: Intersection;
};

type Tournee = {
    cheminIntersections: Intersection[];
    livraisons: {
        heureDepart: string;
        entrepot: Intersection;
        livraisons: Livraison[];
    };
};

const AffichageTournee: React.FC = () => {
    const location = useLocation();
    const { donneesTournee } = location.state as { donneesTournee: Tournee[] };

    return (
        <div id="conteneur-tournee">
            {donneesTournee.map((tournee, index) => {
                // Creer une liste pour les ID des livraisons
                const livraisonIds = new Set(
                    tournee.livraisons.livraisons.map(livraison => livraison.intersection.id)
                );

                return (
                    <div key={index} className="bloc-tournee">
                        <h3>Coursier {index + 1}</h3>
                        <div className="chemin-intersections">
                            <h4>Itineraire :</h4>
                            {tournee.cheminIntersections.map(intersection => (
                                <p
                                    key={intersection.id}
                                    className={livraisonIds.has(intersection.id) ? 'highlight' : ''}
                                >
                                    ID: {intersection.id}, Latitude: {intersection.latitude}, Longitude: {intersection.longitude}, Nom Rue: {intersection.adresse || intersection.voisins[0].nomRue}
                                </p>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AffichageTournee;
