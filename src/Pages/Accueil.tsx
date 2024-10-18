import React, { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import '../Styles/Accueil.css';
import LeftDrawer from './LeftDrawer.tsx'; // Importation du composant LeftDrawer
import Carte from './Carte.tsx'; // Importation du composant Carte
import {Intersection, Point} from '../Utils/points';
import {Box, Button} from "@mui/material";
import {charger_carte} from "../Appels_api/chargerCarte.ts";
import toast, {Toaster} from "react-hot-toast";  // Importation de l'interface Point

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
    const [intersections, setIntersections] = useState<Intersection[]>([]); // Stockage des intersections

    
    
    const  ajouteLesPointsSurLaCarte = (nouveauPoints: Blob) => {
        

    }
    
    // Fonction pour ajouter les points sur la carte
    const loadPoints = (donnees: Blob) => {
        try {
            // Extraction des points depuis le fichier JSON
            const nouvellesIntersections: Intersection[] = donnees.intersections.map((point: any) => ({
                id: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                voisins: point.voisins.map((voisin: any) => ({
                    nomRue: voisin.nomRue,
                    longueur: voisin.longueur,
                })),
            }));
            setIntersections(nouvellesIntersections);
            console.log("nouvellesIntersections", nouvellesIntersections);
            //rempli les points maintenant : 
            const nouveauPoints: Point[] = nouvellesIntersections.map(
                (intersection: Intersection) => ({
                    id: intersection.id,
                    lat: intersection.latitude,
                    long: intersection.longitude,
                })
            );
            setPoints(nouveauPoints);
            console.log("nouveauPoints", nouveauPoints);
            
            
            
            
        } catch (error) {
            setErrorMessage('Erreur lors du chargement des points depuis le fichier JSON');
        }

    }
    
    const testChargementFichierXML = () => {
        charger_carte("petitPlan.xml")
            .then((response) => {
                // Traiter les données de la réponse ici
                const { message, data } = response;
                console.log(data);
                loadPoints(data)
                // ajouteLesPointsSurLaCarte(data);
                toast.success(message);
                
                
                
               
            })
            .catch((error) => console.error(error));
    };
    

    // Fonction pour lire le fichier XML (inchangée)
    const handleFileRead = (file: File, isCarte: boolean = false) => {
        if (file && file.type === 'text/xml') {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target && typeof e.target.result === 'string') {
                    if (isCarte) {
                        setXmlCarte({ name: file.name, content: e.target.result, file });
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

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>, isCarte: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileRead(file, isCarte);
        }
    };

    const handleFileDrop = (event: DragEvent<HTMLDivElement>, isCarte: boolean = false) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        handleFileRead(file, isCarte);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <Box sx = {{display : "flex", flexDirection : "row", witdh : '100%', height : '100%', justifyContent: "center"}}>
            <Toaster/>
            <LeftDrawer selected="Accueil" />
            <Box sx = {{display : "flex", flexDirection : "column", witdh : '100%', gap : "5dvh"}}>
                <Box>
                    <h1>Gestion des livraisons</h1>

                    {/* Charger le plan XML */}
                    <h2>Charger une carte XML</h2>
                </Box>

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
                    onChange={(event) => handleFileSelect(event, true)}
                />
                {xmlCarte && (
                    <div>
                        <p>Fichier de carte chargé: {xmlCarte.name}</p>
                    </div>
                )}

                {/* Affichage des messages */}
                {message && <p className="success-message">{message}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                {/* Affichage de la carte avec les points */}
                {points.length > 0 && <Carte points={points}/>}

                <Button variant="contained" color="primary" onClick={testChargementFichierXML}>Charger</Button>
            </Box>

        </Box>
    );
}
