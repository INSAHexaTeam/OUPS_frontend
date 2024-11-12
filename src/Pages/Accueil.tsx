import React, {useState, useEffect, ChangeEvent, useRef} from 'react';
import '../Styles/Accueil.css';
import Carte from './Carte.tsx';
import {Intersection, Itineraire, Point} from '../Utils/points.tsx';
import {
    Box,
    Button,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle, DialogContentText, DialogContent, DialogActions
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import ListeRequetesLivraisonAjoutManuel from "./ListeRequetesLivraisonAjoutManuel.tsx";
import MailIcon from '@mui/icons-material/Mail';
import MapIcon from '@mui/icons-material/Map';
import { Livraisons } from '../Utils/points.tsx';
import { enregistrerCarte } from "../Appels_api/enregistrerCarte.ts";
import { enregistrerRequetesLivraisons } from "../Appels_api/enregistrerRequetesLivraisons.ts";
import '../Styles/Accueil.css';
import {calculerItineraire} from "../Appels_api/calculerItineraire.ts";
import {styled} from "@mui/material/styles";
import ItineraireManager from "./GestionnaireItineraire.tsx";
import {Action, itineraire, livraisonAjouteePourCoursier} from "../Utils/types";
import {definirAdressesSelonVoisins} from "../Utils/utils.ts";

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

const actionStackRollback: Action[] = [];

export default function Accueil() {
    const [message, setMessage] = useState<string | null>(null);
    const [erreurMessage, setErreurMessage] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [intersections, setIntersections] = useState<Intersection[]>([]);
    const [adressesLivraisonsAjoutees, setAdresseLivraisonsAjoutees] = useState<Intersection[]>([]);
    const [adressesLivraisonsXml, setAdressesLivraisonsXml] = useState<Intersection[]>([]);
    const [listesTotalAdressesLivraisons, setListesTotalAdressesLivraisons] = useState<Intersection[]>([]);
    const [pointDeRetrait, setPointDeRetrait] = useState<Intersection | null>(null);
    const [planCharge, setPlanCharge] = useState(false);
    const [numCouriers, setNumCouriers] = useState(1);
    const zoomToPointRef = useRef<(latitude: number, longitude: number) => void>(() => {});
    const [itineraires, setItineraires] = useState<itineraire[]>([]);
    const [isTourneeCalculee, setIsTourneeCalculee] = useState(false);
    const [actionStackRollback, setActionStackRollback] = useState<Action[]>([]);
    const [pileUndoRollback, setPileUndoRollback] = useState<Action[]>([]);
    const [isRollbackDesactive, setIsRollbackDesactive] = useState(true);
    const [isUndoRollbackDesactive, setIsUndoRollbackDesactive] = useState(true);
    const [fichierSelectionne, setFichierSelectionne] = useState<File | null>(null);
    
    // permet de savoir à quel coursier on ajoute une adresse de livraison (après calcul de la tournée)
    const [livraisonAjouteePourCoursier,  setLivraisonAjouteePourCoursier] = useState<livraisonAjouteePourCoursier | null>(null);
    
    const [dialogRequetesLivraisonOuvert, setDialogRequetesLivraisonOuvert] = useState(false);
    
    
    useEffect(() => {
        console.log("changement livraisonAjouteePourCoursier : ", livraisonAjouteePourCoursier);
    }, [livraisonAjouteePourCoursier]);
    
    // permet d'ajouter une action à la pile
    const ajoutActionStack = (action: Action) => {
        setActionStackRollback(prev => [...prev, action]);
    };
    
    useEffect(() => {
        setIsRollbackDesactive(actionStackRollback.length === 0);
        setIsUndoRollbackDesactive(pileUndoRollback.length === 0);
    }, [actionStackRollback, pileUndoRollback]);

    // permet de défaire la dernière action
    const rollbackDerniereAction = () => {
        setActionStackRollback(prev => {
            const lastAction = prev.pop();
            if (lastAction) {
                setPileUndoRollback(prevUndo => [...prevUndo, lastAction]);
                if (lastAction.type === 1) {
                    setAdresseLivraisonsAjoutees(prev => [...prev, lastAction.intersection]);
                } else if (lastAction.type === 0) {
                    if (lastAction.isEntrepot){
                        setPointDeRetrait(null);
                    }else{
                        setAdresseLivraisonsAjoutees(prev => prev.filter(intersection => intersection.id !== lastAction.intersection.id));
                    }
                }
            }
            return [...prev];
        });
    };

    // permet de défaire la dernière action de rollback
    const undoDernierRollback = () => {
        setPileUndoRollback(prev => {
            const lastUndoAction = prev.pop();
            if (lastUndoAction) {
                // Ajouter l'action à la pile de rollback
                setActionStackRollback(prevRollback => [...prevRollback, lastUndoAction]);
                if (lastUndoAction.type === 1) {
                    setAdresseLivraisonsAjoutees(prev => prev.filter(intersection => intersection.id !== lastUndoAction.intersection.id));
                } else if (lastUndoAction.type === 0) {
                    if (lastUndoAction.isEntrepot){
                        setPointDeRetrait(lastUndoAction.intersection);
                    }else {
                        setAdresseLivraisonsAjoutees(prev => [...prev, lastUndoAction.intersection]);
                    }
                }
            }
            return [...prev];
        });
    };
    
    // permet de vider la liste  
    const viderListeUndoRollback = () => {
        setPileUndoRollback([]);
    }
    
    const [chargementPlanEnCours, setChargementPlanEnCours] = useState(false);
    const [chargemementCalculTournee, setChargemementCalculTournee] = useState(false);

    const [itineraireSelectionne, setItineraireSelectionne] = useState<number | undefined>(undefined);

    useEffect(() => {
        setListesTotalAdressesLivraisons([...adressesLivraisonsAjoutees, ...adressesLivraisonsXml]);
    }, [adressesLivraisonsAjoutees, adressesLivraisonsXml]);

    const gereLesChangementsdItineraire = (newItineraires: Itineraire[]) => {
        setItineraires(newItineraires);
        // Appeler votre API ou mettre à jour la carte ici
    };

    const garderRequetesLivraisons = () => {
        if (fichierSelectionne) {
            chargerRequetesLivraisons(fichierSelectionne);
        }
        setDialogRequetesLivraisonOuvert(false);
    };
    
    const chargerPoints = (donnees: Blob) => {
        try {
            setIsTourneeCalculee(false);
            const nouvellesIntersections: Intersection[] = donnees.intersections.map((point: any) => ({
                id: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                adresse: definirAdressesSelonVoisins(point),
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
            setErreurMessage('Erreur lors du chargement des points depuis le fichier JSON');
        }
    };

    const chargerRequetesLivraisons = (file: File) => {
        enregistrerRequetesLivraisons("CHARGEMENT", file)
            .then((response) => {
                const {message, data} = response;
                const entrepot = data.entrepot;
                const listeLivraisons = data.livraisons;

                const pointDeRetrait = {
                    id: entrepot.intersection.id,
                    latitude: entrepot.intersection.latitude,
                    longitude: entrepot.intersection.longitude,
                    adresse: definirAdressesSelonVoisins(entrepot.intersection),
                    voisins: entrepot.intersection?.voisins
                };
                setPointDeRetrait(pointDeRetrait);

                const adressesLivraisonsMapped = listeLivraisons.map((livraison: any) => ({
                    id: livraison.intersection.id,
                    latitude: livraison.intersection.latitude,
                    longitude: livraison.intersection.longitude,
                    adresse: definirAdressesSelonVoisins(livraison.intersection),
                    voisins: livraison.intersection.voisins
                }));

                setActionStackRollback([]);
                setPileUndoRollback([]);
                setAdressesLivraisonsXml(adressesLivraisonsMapped);
                toast.success(message);
            }).catch((error) => {
            toast.error(error);
        });
    };

    const resetState = () => {
        setMessage(null);
        setErreurMessage(null);
        setPoints([]);
        setIntersections([]);
        setAdresseLivraisonsAjoutees([]);
        setAdressesLivraisonsXml([]);
        setListesTotalAdressesLivraisons([]);
        setPointDeRetrait(null);
        setPlanCharge(false);
        setNumCouriers(1);
        setItineraires([]);
        setIsTourneeCalculee(false);
        setActionStackRollback([]);
        setPileUndoRollback([]);
        setIsRollbackDesactive(true);
        setIsUndoRollbackDesactive(true);
        setFichierSelectionne(null);
        setChargementPlanEnCours(false);
        setChargemementCalculTournee(false);
        setItineraireSelectionne(undefined);
        setDialogRequetesLivraisonOuvert(false);
    };
    
    const gererLectureFichier = (file: File, isCarte: boolean = false) => {
        setIsTourneeCalculee(false);
        if (file && file.type === 'text/xml') {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target && typeof e.target.result === 'string') {

                    if (isCarte) {
                        resetState();
                        setChargementPlanEnCours(true);
                        enregistrerCarte("CHARGEMENT", file)
                            .then((response) => {
                                const { message, data } = response;
                                chargerPoints(data);
                                toast.success(message);
                                setChargementPlanEnCours(false);
                            }).catch((error) => {
                            toast.error(error);
                            setChargementPlanEnCours(false);
                        });
                        setActionStackRollback([]);
                        setPileUndoRollback([]);
                        setPlanCharge(true);
                    } else {
                        if(adressesLivraisonsAjoutees.length > 0){
                            setDialogRequetesLivraisonOuvert(true);
                        }else {
                            chargerRequetesLivraisons(file);
                        }
                    }
                    setMessage(null);
                    setErreurMessage(null);
                }
            };
            reader.onerror = () => {
                setErreurMessage('Erreur de lecture du fichier');
                setChargementPlanEnCours(false);
            };
            reader.readAsText(file);
        } else {
            setErreurMessage('Veuillez télécharger un fichier XML valide');
        }
    };

    const gererSelectionFichier = (event: ChangeEvent<HTMLInputElement>, isCarte: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            setFichierSelectionne(file);
            gererLectureFichier(file, isCarte);
        }
    };

    const calculTournee = async () => {
        if(!pointDeRetrait){
            toast.error("Veuillez définir un entrepôt");
            return;
        }
        if (listesTotalAdressesLivraisons.length === 0) {
            toast.error("Veuillez ajouter des adresses de livraison");
            return;
        }

        const livraisons: Livraisons = {
            coursier: numCouriers,
            entrepot: {
                heureDepart: "08:00:00",
                intersection: pointDeRetrait
            },
            livraisons: listesTotalAdressesLivraisons.map(livraison => ({
                intersection: livraison
            }))
        };

        try {
            setChargemementCalculTournee(true);
            const result = await calculerItineraire(livraisons);

            const itinerairesFomrmated = result.data.livraisons.map((itineraire, coursierIndex) => {
                itineraire.livraisons.coursier = coursierIndex;
                return itineraire;
            });
            setItineraires(itinerairesFomrmated);
            setIsTourneeCalculee(true);
            setChargemementCalculTournee(false);
            toast.success("Tournée calculée avec succès");
        } catch (error) {
            console.error("Erreur lors du calcul de la tournée :", error);
            toast.error("Erreur lors du calcul de la tournée");
            setIsTourneeCalculee(false);
            setChargemementCalculTournee(false);
        }
    };

    function supprimerRequetesLivraisons() {
        // on supprime les adresses rentrées par l'utilisateur
        setAdresseLivraisonsAjoutees([]);
        if (fichierSelectionne) {
            chargerRequetesLivraisons(fichierSelectionne);
        }
        setDialogRequetesLivraisonOuvert(false);
    }

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
                            onChange={(event) => gererSelectionFichier(event, true)}
                            multiple
                        />
                    </Button>

                    {planCharge && (
                        <Button
                            component="label"
                            role={undefined}
                            variant="contained"
                            tabIndex={-1}
                            disabled={chargementPlanEnCours || isTourneeCalculee}
                            startIcon={<MailIcon />}
                        >
                            Charger des livraisons
                            <VisuallyHiddenInput
                                type="file"
                                accept=".xml"
                                onChange={(event) => gererSelectionFichier(event, false)}
                                multiple
                            />
                        </Button>
                    )}
                </Box>

                {message && <p className="success-message">{message}</p>}
                {erreurMessage && <p className="error-message">{erreurMessage}</p>}

                {chargementPlanEnCours ? (
                    <Box sx={{display: 'flex', flexDirection: 'row', gap: '2dvw', height:'60%'}}>
                        <Box sx={{width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems:'center'}}>
                            <CircularProgress />
                        </Box>
                    </Box>
                ) : (
                    points.length > 0 && (
                        <Box className="carte-liste-container" sx={{ display: 'flex', flexDirection: 'row', gap: '2dvw', height: '60%' , minHeight:'500px'}}>
                            <Box sx={{ width: isTourneeCalculee ? '100%' : '60%', height: '100%' }}>
                                <Carte
                                    ajoutActionStack={ajoutActionStack}
                                    viderListeUndoRollback={viderListeUndoRollback}
                                    intersections={intersections}
                                    setAdresseLivraisonsAjoutees={setAdresseLivraisonsAjoutees}
                                    adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                                    adressesLivraisonsXml={adressesLivraisonsXml}
                                    adresseEntrepot={pointDeRetrait}
                                    setAdresseEntrepot={setPointDeRetrait}
                                    zoomerVersPoint={(fn) => { zoomToPointRef.current = fn; }}
                                    itineraires={itineraires}
                                    itineraireSelectionne={itineraireSelectionne}
                                    isTourneeCalculee={isTourneeCalculee}
                                    livraisonAjouteePourCoursier={livraisonAjouteePourCoursier}
                                    setLivraisonAjouteePourCoursier={setLivraisonAjouteePourCoursier}
                                />
                            </Box>

                            {!isTourneeCalculee && (
                            <Box sx={{width: '40%', overflowY: 'auto'}}>
                                <ListeRequetesLivraisonAjoutManuel
                                    ajoutActionStack={ajoutActionStack}
                                    rollbackDerniereAction={rollbackDerniereAction}
                                    undoDernierRollback={undoDernierRollback}
                                    viderListeUndoRollback={viderListeUndoRollback}
                                    isRollbackDesactive={isRollbackDesactive}
                                    isUndoRollbackDesactive={isUndoRollbackDesactive}
                                    adressesLivraisonsXml={adressesLivraisonsXml}
                                    adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                                    setAdresseLivraisonsXml={setAdressesLivraisonsXml}
                                    setAdresseLivraisonsAjoutees={setAdresseLivraisonsAjoutees}
                                    pointDeRetrait={pointDeRetrait}
                                    setPointDeRetrait={setPointDeRetrait}
                                    zoomerVersPoint={zoomToPointRef.current}
                                    suppressionIndisponible={isTourneeCalculee}
                                />
                            </Box>)}

                        </Box>
                    ))}

                {planCharge && !isTourneeCalculee &&(
                    <span>Nombre total de requêtes de livraisons : <b>{listesTotalAdressesLivraisons.length}</b></span>
                )}

                {planCharge && (
                    <Box className="box-buttons" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl variant="outlined" size="medium" sx={{width: '140px'}}>
                            <InputLabel>Nombre de coursiers</InputLabel>
                            <Select
                                value={numCouriers}
                                onChange={(e) => setNumCouriers(e.target.value as number)}
                                label="Nombre de coursiers"
                                sx={{height: '40px'}}
                            >
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <MenuItem key={num} value={num}>{num}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={calculTournee}
                            disabled={chargemementCalculTournee}
                            startIcon={chargemementCalculTournee ? <CircularProgress size={20} /> : null}
                        >
                            Calculer la tournée
                        </Button>
                        
                    </Box>
                )}
                {isTourneeCalculee && (
                    <ItineraireManager
                        itineraires={itineraires}
                        onChangementItineraires={gereLesChangementsdItineraire}
                        itineraireSelectionne={itineraireSelectionne}
                        onSelectionItineraire={setItineraireSelectionne}
                        isTourneeCalculee={isTourneeCalculee}
                        
                        // On passe les adresses de livraisons (xml et manuelles) 
                        // pour les mettre à jour dans le gestionnaire d'itinéraire
                        adressesLivraisonsAjoutees={adressesLivraisonsAjoutees}
                        setAdressesLivraisonsAjoutees={setAdresseLivraisonsAjoutees}
                        adressesLivraisonsXml={adressesLivraisonsXml}
                        setAdressesLivraisonsXml={setAdressesLivraisonsXml}

                        livraisonAjouteePourCoursier={livraisonAjouteePourCoursier}
                        setLivraisonAjouteePourCoursier={setLivraisonAjouteePourCoursier}
                    />
                )}
            </Box>

            <Dialog onClose={() => setDialogRequetesLivraisonOuvert(false)}
                    open={dialogRequetesLivraisonOuvert}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {"Garder les requêtes de livraisons ? "}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Voulez-vous garder les requêtes de livraisons que vous avez ajouter à la mains ? 
                        L'entrepôt sera, lui, remplacé par le nouvel entrepôt.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={supprimerRequetesLivraisons} autoFocus sx={{ color: 'red' }}>
                        Supprimer
                    </Button>
                    <Button onClick={garderRequetesLivraisons} sx={{ color: 'green' }}>Garder</Button>
                </DialogActions>
            </Dialog>
            
        </Box>
    );
}