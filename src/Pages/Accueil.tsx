import React, { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import '../Styles/Accueil.css';
import pointsData from '../Test/Points.json'; // Importation du fichier Points.json
import Carte from './Carte.tsx'; // Importation du composant Carte
import { Point } from '../Utils/points';  // Importation de l'interface Point

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

    // Utilisation du hook useEffect pour charger les points immédiatement
    useEffect(() => {
        loadPoints();
    }, []);  // Le tableau vide [] signifie que l'effet ne sera exécuté qu'une seule fois au montage du composant

    // Fonction pour charger les points depuis le fichier JSON
    const loadPoints = () => {
        try {
            // Extraction des points depuis le fichier JSON
            const extractedPoints: Point[] = pointsData.points.point.map((point: any) => ({
                id: point.id,
                long: point.long,
                lat: point.lat,
            }));
            setPoints(extractedPoints);
            setMessage('Points chargés avec succès');
        } catch (error) {
            setErrorMessage('Erreur lors du chargement des points depuis le fichier JSON');
        }
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
        <div>
            <h1>Gestion des livraisons</h1>

            {/* Charger le plan XML */}
            <h2>Charger une carte XML</h2>
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
            {points.length > 0 && <Carte points={points} />}
        </div>
    );
}
