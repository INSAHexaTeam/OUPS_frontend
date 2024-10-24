import React, { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import '../Styles/Accueil.css';
// @ts-ignore
import Carte from './Carte.tsx'; // Importation du composant Carte
import { Intersection, Point } from '../Utils/points';
import { Box, Button } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
// @ts-ignore
import { enregistrerCarte } from "../Appels_api/enregistrerCarte.ts";
// @ts-ignore
import ListeRequetesLivraisonAjoutManuel from "./ListeRequetesLivraisonAjoutManuel.tsx";

interface XmlFile {
    name: string;
    content: string;
    file: File;
}

export default function Accueil() {
    const [xmlCarte, setXmlCarte] = useState<XmlFile | null>(null);
    const [xmlDemande, setXmlDemande] = useState<XmlFile | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]); // Stockage des points
    const [intersections, setIntersections] = useState<Intersection[]>([]);

    // correspond à la liste des adresses de livraison ajoutées à la main
    const [adressesLivraisonsAjoutees, setAdresseLivraisons] = useState<Intersection[]>([]);
    const [adressesLivraisonsXml, setAdressesLivraisonsXml] = useState<Intersection[]>([]);

    // Correspond à la liste COMPLETE des adresses de livraison (ajoutées à la main + celles du fichier XML)
    const [listesTotalAdressesLivraisons, setListesTotalAdressesLivraisons] = useState<Intersection[]>([]);
    const [pointDeRetrait, setPointDeRetrait] = useState<Intersection | null>(null);

    // Nouvel état pour vérifier si le plan est chargé
    const [planCharge, setPlanCharge] = useState(false);

    // Concaténer les 2 listes lors de la mise à jour des listes
    useEffect(() => {
        setListesTotalAdressesLivraisons([...adressesLivraisonsAjoutees, ...adressesLivraisonsXml]);
    }, [adressesLivraisonsAjoutees, adressesLivraisonsXml]);

    // Fonction pour ajouter les points sur la carte
    const loadPoints = (donnees: Blob) => {
        try {
            // Extraction des points depuis le fichier JSON
            const nouvellesIntersections: Intersection[] = donnees.intersections.map((point: any) => ({
                id: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                adresse: point.voisins.length > 0 ? point.voisins[0].nomRue : 'pas définie',
                voisins: point.voisins.map((voisin: any) => ({
                    nomRue: voisin.nomRue,
                    longueur: voisin.longueur,
                })),
            }));
            setIntersections(nouvellesIntersections);
            const nouveauPoints: Point[] = nouvellesIntersections.map(
                (intersection: Intersection) => ({
                    id: intersection.id,
                    lat: intersection.latitude,
                    long: intersection.longitude,
                })
            );
            setPoints(nouveauPoints);
        } catch (error) {
            setErrorMessage('Erreur lors du chargement des points depuis le fichier JSON');
        }
    };

    // Fonction pour lire le fichier XML
    const handleFileRead = (file: File, isCarte: boolean = false) => {
        if (file && file.type === 'text/xml') {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target && typeof e.target.result === 'string') {
                    if (isCarte) {
                        setXmlCarte({ name: file.name, content: e.target.result, file });
                        // Appel de l'API pour enregistrer le fichier
                        enregistrerCarte("CHARGEMENT", file).then((response) => {
                            const { message, data } = response;
                            loadPoints(data);
                            toast.success(message);
                        });
                        setPlanCharge(true); // Le plan est chargé.
                    } else {
                        setXmlDemande({ name: file.name, content: e.target.result, file });
                    }
                    setMessage(null);
                    setErrorMessage(null);
                }
            };
            reader.onerror = () => {
                setErrorMessage('Erreur de lecture du fichier');
            };
            reader.readAsText(file);
        } else {
            setErrorMessage('Veuillez télécharger un fichier XML valide');
        }
    };

    // Fonction pour gérer la sélection du fichier plan via le bouton de sélection de fichier
    const handleFileSelectPlan = (event: ChangeEvent<HTMLInputElement>, isCarte: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileRead(file, isCarte);
        }
    };

    // Fonction pour gérer le dépôt du fichier via le drag and drop
    const handleFileDrop = (event: DragEvent<HTMLDivElement>, isCarte: boolean = false) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        handleFileRead(file, isCarte);
    };

    // Fonction pour gérer le survol du fichier (inchangée)
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const calculTournee = () => {
        if (listesTotalAdressesLivraisons.length === 0) {
            toast.error("Veuillez ajouter des adresses de livraison");
            return;
        } else {
            console.log("Liste des adresses de livraison ajoutées à la main : ", listesTotalAdressesLivraisons);
            // Appel API qui envoie toutes les adresses de livraison au back
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "row", width: '100%', height: '100%', justifyContent: "center" }}>
            <Toaster />
            {/*<LeftDrawer selected="Accueil" />*/}
            <Box sx={{ display: "flex", flexDirection: "column", width: '80%', gap: "2dvh" }}>
                <Box>
                    <h1>Gestion des livraisons</h1>

                    {/* Charger le plan XML */}
                    <h2>{planCharge ? "Charger un autre plan" : "Charger une carte XML"}</h2>
                </Box>

                {!planCharge && (
                    <>
                        <div
                            onDrop={(event) => handleFileDrop(event, true)}
                            onDragOver={handleDragOver}
                            className="dropzone"
                        >
                            <p>Glissez et déposez votre fichier carte ici</p>
                        </div>
                        <input
                            type="file"
                            accept=".xml"
                            onChange={(event) => handleFileSelectPlan(event, true)}
                        />
                    </>
                )}

                {xmlCarte && (
                    <div>
                        <p>Fichier de carte chargé: {xmlCarte.name}</p>
                    </div>
                )}

                {planCharge && (
                    <Button sx={{width: "20%"}} variant="contained" color="primary" onClick={() => {/* Handle requêtes loading */}}>
                        Charger les requêtes de livraison
                    </Button>
                )}

                {message && <p className="success-message">{message}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                {points.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '2dvw' }}>
                        {/* Carte à gauche */}
                        <Box sx={{ width: '60%' }}>
                            <Carte
                                intersections={intersections}
                                setAdresseLivraisons={setAdresseLivraisons}
                                adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                            />
                        </Box>

                        {/* Liste des adresses de livraison à droite */}
                        <Box sx={{ width: '40%', overflowY: 'auto' }}>
                            <ListeRequetesLivraisonAjoutManuel
                                adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                                setAdresseLivraisons={setAdresseLivraisons}
                                pointDeRetrait={pointDeRetrait}
                                setPointDeRetrait={setPointDeRetrait}
                            />
                        </Box>
                    </Box>
                )}

                <Button size="small" variant="contained" color="primary" onClick={calculTournee}>
                    Calculer la tournée
                </Button>
            </Box>
        </Box>
    );
}
