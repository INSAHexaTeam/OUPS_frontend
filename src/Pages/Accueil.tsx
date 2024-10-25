import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import '../Styles/Accueil.css';
import Carte from './Carte.tsx';
import { Intersection, Point } from '../Utils/points';
import { Box, Button, CircularProgress } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { enregistrerCarte } from "../Appels_api/enregistrerCarte.ts";
import ListeRequetesLivraisonAjoutManuel from "./ListeRequetesLivraisonAjoutManuel.tsx";
import { enregistrerRequetesLivraisons } from "../Appels_api/enregistrerRequetesLivraisons.ts";
import MailIcon from '@mui/icons-material/Mail';
import MapIcon from '@mui/icons-material/Map';
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function Accueil() {
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [intersections, setIntersections] = useState<Intersection[]>([]);
    const [adressesLivraisonsAjoutees, setAdresseLivraisonsAjoutees] = useState<Intersection[]>([]);
    const [adressesLivraisonsXml, setAdressesLivraisonsXml] = useState<Intersection[]>([]);
    const [listesTotalAdressesLivraisons, setListesTotalAdressesLivraisons] = useState<Intersection[]>([]);
    const [pointDeRetrait, setPointDeRetrait] = useState<Intersection | null>(null);
    const [planCharge, setPlanCharge] = useState(false);
    const [loading, setLoading] = useState(false);
    const zoomToPointRef = useRef<(latitude: number, longitude: number) => void>(() => {});

    useEffect(() => {
        setListesTotalAdressesLivraisons([...adressesLivraisonsAjoutees, ...adressesLivraisonsXml]);
    }, [adressesLivraisonsAjoutees, adressesLivraisonsXml]);

    const loadPoints = (donnees: Blob) => {
        try {
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

    const handleFileRead = (file: File, isCarte: boolean = false) => {
        if (file && file.type === 'text/xml') {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target && typeof e.target.result === 'string') {
                    setLoading(true);
                    if (isCarte) {
                        enregistrerCarte("CHARGEMENT", file)
                            .then((response) => {
                                const { message, data } = response;
                                loadPoints(data);
                                toast.success(message);
                                setLoading(false);
                            }).catch((error) => {
                            toast.error(error);
                            setLoading(false);
                        });
                        setPlanCharge(true);
                    } else {
                        enregistrerRequetesLivraisons("CHARGEMENT", file)
                            .then((response) => {
                                const { message, data } = response;
                                const entrepot = data.entrepot;
                                const listeLivraisons = data.livraisonList;

                                const pointDeRetrait = {
                                    id: entrepot.intersection.id,
                                    latitude: entrepot.intersection.latitude,
                                    longitude: entrepot.intersection.longitude,
                                    adresse: entrepot.intersection?.voisins.length > 0 ? entrepot.intersection?.voisins[0].nomRue : 'pas définie',
                                    voisins: entrepot.intersection?.voisins
                                };

                                setPointDeRetrait(pointDeRetrait);

                                const adressesLivraisonsMapped = listeLivraisons.map((livraison: any) => ({
                                    id: livraison.id,
                                    latitude: livraison.latitude,
                                    longitude: livraison.longitude,
                                    adresse: livraison.voisins.length > 0 ? livraison.voisins[0].nomRue : 'pas définie',
                                    voisins: livraison.voisins
                                }));

                                setAdressesLivraisonsXml(adressesLivraisonsMapped);
                                toast.success(message);
                                setLoading(false);
                            }).catch((error) => {
                            toast.error(error);
                            setLoading(false);
                        });
                    }
                    setMessage(null);
                    setErrorMessage(null);
                }
            };
            reader.onerror = () => {
                setErrorMessage('Erreur de lecture du fichier');
                setLoading(false);
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

    const calculTournee = () => {
        if (listesTotalAdressesLivraisons.length === 0) {
            toast.error("Veuillez ajouter des adresses de livraison");
            return;
        } else {
            console.log("Liste des adresses de livraison ajoutées à la main : ", listesTotalAdressesLivraisons);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "row", width: '100%', height: '100%', justifyContent: "center" }}>
            <Toaster />
            <Box sx={{display: "flex", flexDirection: "column", width: '90%', gap: "2dvh"}}>
                <Box>
                    <h1>Gestion des livraisons</h1>
                    <h2>{planCharge ? "Charger un autre plan" : "Charger une carte XML"}</h2>
                </Box>
                <Box className="box-buttons">
                    <Button
                        component="label"
                        role={undefined}
                        variant="contained"
                        tabIndex={-1}
                        startIcon={<MapIcon />}
                    >
                        Charger un plan
                        <VisuallyHiddenInput
                            type="file"
                            accept=".xml"
                            onChange={(event) => handleFileSelect(event, true)}
                            multiple
                        />
                    </Button>

                    {planCharge && (
                        <Button
                            component="label"
                            role={undefined}
                            variant="contained"
                            tabIndex={-1}
                            startIcon={<MailIcon />}
                        >
                            Charger des livraisons
                            <VisuallyHiddenInput
                                type="file"
                                accept=".xml"
                                onChange={(event) => handleFileSelect(event, false)}
                                multiple
                            />
                        </Button>
                    )}
                </Box>

                {message && <p className="success-message">{message}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                {loading ? (
                    <Box sx={{display: 'flex', flexDirection: 'row', gap: '2dvw'}}>
                        <Box sx={{width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems:'center'}}>
                            <CircularProgress />
                        </Box>
                    </Box>
                ) : (
                    points.length > 0 && (
                        <Box sx={{display: 'flex', flexDirection: 'row', gap: '2dvw'}}>
                            <Box sx={{width: '60%'}}>
                                <Carte
                                    intersections={intersections}
                                    setAdresseLivraisonsAjoutees={setAdresseLivraisonsAjoutees}
                                    adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                                    adressesLivraisonsXml={adressesLivraisonsXml}
                                    adresseEntrepot={pointDeRetrait}
                                    zoomToPoint={(fn) => { zoomToPointRef.current = fn; }} // Pass the function
                                />
                            </Box>

                            <Box sx={{width: '40%', overflowY: 'auto'}}>
                                <ListeRequetesLivraisonAjoutManuel
                                    adressesLivraisonsXml={adressesLivraisonsXml}
                                    adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                                    setAdresseLivraisonsAjoutees={setAdresseLivraisonsAjoutees}
                                    pointDeRetrait={pointDeRetrait}
                                    setPointDeRetrait={setPointDeRetrait}
                                    zoomToPoint={zoomToPointRef.current} // Pass the function
                                />
                            </Box>
                        </Box>
                    )
                )}

                {planCharge && (
                    <span>Nombre total de requêtes de livraisons : <b>{listesTotalAdressesLivraisons.length}</b></span>
                )}

                <Box  className="box-buttons">
                    <Button variant="contained" color="primary" onClick={calculTournee}>
                        Calculer la tournée
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}