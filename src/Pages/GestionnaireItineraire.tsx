// ItineraireManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    IconButton,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { calculerItineraireOrdonne } from '../Appels_api/calculerItineraireOrdonne.ts';
import {definirAdressesSelonVoisins} from "../Utils/utils.ts";
import {Intersection} from "../Utils/points";
import {livraisonAjouteePourCoursier} from "../Utils/types";
import toast, {Toaster} from "react-hot-toast";

interface PointLivraison {
    intersection: {
        id: number;
        latitude: number;
        longitude: number;
        adresse?: string;
    };
    estUneLivraison: boolean;
}

interface Itineraire {
    livraisons: {
        entrepot: {
            intersection: {
                id: number;
                latitude: number;
                longitude: number;
                adresse?: string;
            };
        };
        livraisons: PointLivraison[];
        coursier?: number;
    };
    cheminIntersections: any[];
}

// Ajouter cette fonction avant le composant ItineraireManager
const deepCopy = <T,>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

interface GestionnaireItineraireProps {
    itineraires: any[];
    onChangementItineraires: (nouveauxItineraires: any[]) => void;
    itineraireSelectionne?: number;
    onSelectionItineraire: (index: number | undefined) => void;
    adressesLivraisonsAjoutees: Intersection[];
    adressesLivraisonsXml: Intersection[];
    setAdressesLivraisonsAjoutees: (adresses: Intersection[]) => void;
    setAdressesLivraisonsXml: (adresses: Intersection[]) => void;
    setLivraisonAjouteePourCoursier: (livraisonAjouteePourCoursier: livraisonAjouteePourCoursier) => void;
    livraisonAjouteePourCoursier: livraisonAjouteePourCoursier;
}

const GestionnaireItineraire: React.FC<GestionnaireItineraireProps> = ({ 
    itineraires, 
    onChangementItineraires,
    itineraireSelectionne,
    onSelectionItineraire,
    isTourneeCalculee,
    adressesLivraisonsAjoutees,
    adressesLivraisonsXml,
    setAdressesLivraisonsAjoutees,
    setAdressesLivraisonsXml,
    setLivraisonAjouteePourCoursier,
    livraisonAjouteePourCoursier
}) => {
    const [dialogueOuvert, setDialogueOuvert] = useState(false);
    const [livraisonSelectionnee, setLivraisonSelectionnee] = useState<any>(null);
    const [coursierSelectionne, setCoursierSelectionne] = useState<number>(0);
    const [historique, setHistorique] = useState<Itineraire[][]>([itineraires]);
    const [estModifie, setEstModifie] = useState(false);
    const [retourEnCours, setRetourEnCours] = useState(false);
    const [historiqueAnnule, setHistoriqueAnnule] = useState<Itineraire[][]>([]);


    //l'objet itinéraire est une liste de livraisons par coursier : itinéraire = [livraisonPourCoursier1, livraisonPourCoursier2, ...]
    //les livraisonsPourCoursier sont des objets avec les propriétés : cheminIntersections, livraisons
    //cheminIntersections est un tableau d'intersection qui correspond au chemin du coursier
    //livraisons est un objet qui contient le numéro du coursier (pas forcément utile car on peut le retrouver avec l'index de l'itinéraire) 
    //l'entrepot et l'heure de départ puis la listes des livraisons (= les intersections sur lesquelles le coursier doit s'arreter)
    //livraisons est un tableau de livraison

    //la structure n'est clairement pas optimale mais elle était en lien avec ce qu'il se passait dans le backend
    //vu que thomas vas changer le backend, il risque de falloir modifier ce code


    // const deplacerLivraison = (livraison: PointLivraison, indexSourceCoursier: number, indexDestinationCoursier: number) => {
    //     const nouveauxItineraires = [...itineraires];

    //     // Retirer la livraison de son itinéraire actuel
    //     const sourceLivraisons = nouveauxItineraires[indexSourceCoursier].livraisons.livraisons;
    //     const livraisonIndex = sourceLivraisons.findIndex(l => l.intersection.id === livraison.intersection.id);
    //     sourceLivraisons.splice(livraisonIndex, 1);

    //     // Ajouter la livraison au nouvel itinéraire
    //     nouveauxItineraires[indexDestinationCoursier].livraisons.livraisons.push(livraison);

    //     mettreAJourItineraires(nouveauxItineraires);
    // };

    const genererFichesRoutes = () => {
        console.log("genererFichesRoutes")
    }

    const gererModificationLivraison = (livraison: PointLivraison, indexCoursier: number) => {
        setLivraisonSelectionnee({ ...livraison, indexCoursier });
        setCoursierSelectionne(indexCoursier);
        setDialogueOuvert(true);
    };

    const sauvegarderModification = () => {
        const nouveauxItineraires = [...itineraires];

        // Retirer la livraison de son itinéraire actuel
        const oldItineraire = nouveauxItineraires[livraisonSelectionnee.indexCoursier];
        oldItineraire.livraisons.livraisons = oldItineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraisonSelectionnee.intersection.id
        );

        // Ajouter la livraison au nouvel itinéraire
        const newItineraire = nouveauxItineraires[coursierSelectionne];
        newItineraire.livraisons.livraisons.push(livraisonSelectionnee);

        onChangementItineraires(nouveauxItineraires);
        setDialogueOuvert(false);
    };

    const supprimerLivraison = (livraison: PointLivraison, indexCoursier: number) => {
        const nouveauxItineraires = [...itineraires];

        avantMiseAJourItineraires();
        

        onChangementItineraires(nouveauxItineraires);

        // Retirer la livraison de son itinéraire actuel
        const itineraire = nouveauxItineraires[indexCoursier];
        itineraire.livraisons.livraisons = itineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraison.intersection.id
        );
        
        supprimerDansXmlOuAjoutees(livraison);
        onChangementItineraires(nouveauxItineraires);
        miseAJourPlusCourtCheminAPI();
    };
    
    // Fonction pour supprimer une livraison dans les adresses ajoutées ou dans le XML (si elle y était)
    const supprimerDansXmlOuAjoutees = (livraison: PointLivraison) => {
        const indexXML = adressesLivraisonsXml.findIndex((adresse) => adresse.id === livraison.intersection.id);
        if (indexXML !== -1) {
            const nouvelleListeSansLivraison = [...adressesLivraisonsXml];
            nouvelleListeSansLivraison.splice(indexXML, 1);
            setAdressesLivraisonsXml(nouvelleListeSansLivraison);
        } else {
            const indexAjout = adressesLivraisonsAjoutees.findIndex((adresse) => adresse.id === livraison.intersection.id);
            if (indexAjout !== -1) {
                const nouvelleListeSansLivraison = [...adressesLivraisonsAjoutees];
                nouvelleListeSansLivraison.splice(indexAjout, 1);
                setAdressesLivraisonsAjoutees(nouvelleListeSansLivraison);
            }
        }
    }

    const annulerDerniereAction = () => {
        if (historique.length > 0) {
            const newHistory = [...historique];
            const actionAnnulee = newHistory.pop()!; // L'action qu'on annule
            // const previousState = newHistory[newHistory.length - 1];
            const previousState = deepCopy(itineraires);
            console.log("je push sur annule : ", deepCopy(previousState))
            setHistoriqueAnnule([...historiqueAnnule, deepCopy(previousState)]); // On la sauvegarde
            setHistorique(newHistory);
            onChangementItineraires(deepCopy(actionAnnulee));
            // console.log("histotique était :", historique);
            // console.log("histotique devient :", newHistory);
            // console.log("histotique pop :", deepCopy(actionAnnulee));
            setEstModifie(true);
        }
    };

    const retablirDerniereAction = () => {
        // setRetourEnCours(true);
        console.log("histo annule avant : ",historiqueAnnule)
        if (historiqueAnnule.length > 0) {
            setHistorique([...historique, itineraires]);
            const newHistoriqueAnnule = [...historiqueAnnule];
            const actionARetablir = newHistoriqueAnnule.pop()!;
            setHistoriqueAnnule(newHistoriqueAnnule);
            console.log("annule push",actionARetablir)
            // mettreAJourItineraires(deepCopy(actionARetablir))
            onChangementItineraires(deepCopy(actionARetablir));
            setEstModifie(true);
        }
    };

    const mettreAJourItineraires = (nouveauxItineraires: Itineraire[]) => {
        // const deepCopyItineraires = deepCopy(itineraires);
        // console.log("Je push sur l'historique :", deepCopyItineraires);
        // console.log("Historique mis à jour :", [...historique, deepCopyItineraires]);
        // setHistorique([...historique, deepCopyItineraires]);
        
        // setEstModifie(true);
        // setHistoriqueAnnule([]);
        // // onChangementItineraires(nouveauxItineraires);
    };

    const avantMiseAJourItineraires = () => {
        const deepCopyItineraires = deepCopy(itineraires);
        console.log("Je push sur l'historique :", deepCopyItineraires);
        console.log("Historique mis à jour :", [...historique, deepCopyItineraires]);
        setHistorique([...historique, deepCopyItineraires]);
        
        setEstModifie(true);
        setHistoriqueAnnule([]);
    }

    const miseAJourPlusCourtCheminAPI = () => {
        const itinerairesOrdonnes = {
            livraisons: itineraires.map(itineraire => ({
                cheminIntersections: itineraire.cheminIntersections || [],
                livraisons: {
                    entrepot: {
                        heureDepart: "08:00:00",
                        intersection: itineraire.livraisons.entrepot.intersection
                    },
                    livraisons: [
                        ...itineraire.livraisons.livraisons.map(livraison => ({
                            intersection: livraison.intersection
                        }))
                    ],
                    coursier: null
                }
            }))
        };
        calculerItineraireOrdonne(itinerairesOrdonnes)
            .then(response => {
                const itineraires: Itineraire[] = response.data.livraisons.map((itineraire: any) => ({
                    livraisons: {
                        entrepot: itineraire.livraisons.entrepot,
                        livraisons: itineraire.livraisons.livraisons,
                        coursier: itineraire.livraisons.coursier
                    },
                    cheminIntersections: itineraire.cheminIntersections
                }));
                onChangementItineraires(itineraires);
            })
            .catch(error => {
                console.error("Erreur lors du calcul de l'itinéraire :", error);
            });
        setEstModifie(false);
    };

    const gererSelectionItineraire = (index: number) => {
        if (itineraireSelectionne === index) {
            onSelectionItineraire(undefined);
        } else {
            onSelectionItineraire(index);
        }
    };

    function ajouterLivraison(indexCoursier: number, indexLivraison: number) {
        avantMiseAJourItineraires();
    
        toast(<p>Cliquez sur une intersection de la carte pour ajouter une livraison au <b>coursier n°{indexCoursier + 1}</b></p>, {
            icon: '📍',
            duration: 3000
        });
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        const livraisonAjouteePourCoursier = {
            numeroCoursier: indexCoursier,
            indexLivraison: indexLivraison,
            intersection: null // pour l'instant, on ne sait pas quelle intersection ajouter
        }

        setLivraisonAjouteePourCoursier(livraisonAjouteePourCoursier);
        
    }
    
    useEffect(() => {
        if (livraisonAjouteePourCoursier?.intersection){
            // ajouter la livraison à l'itinéraire (grâce à l'index de la livraison et du coursier)
            const nouveauxItineraires = [...itineraires];

            const intersectionSansVoisins = {
                id: livraisonAjouteePourCoursier.intersection.id,
                latitude: livraisonAjouteePourCoursier.intersection.latitude,
                longitude: livraisonAjouteePourCoursier.intersection.longitude,
                voisins: [],
                adresse: definirAdressesSelonVoisins(livraisonAjouteePourCoursier.intersection),
            }

            const livraiseAAjouter = {
                intersection: intersectionSansVoisins,
                estUneLivraison: true,
                distanceParcourue: 0,
                heureArrivee: "00:00:00",
            }
            
            // Récupération de l'itinéraire du coursier
            const itineraireCoursier = nouveauxItineraires[livraisonAjouteePourCoursier.numeroCoursier];
            itineraireCoursier.livraisons.livraisons.splice(livraisonAjouteePourCoursier.indexLivraison+1, 0, livraiseAAjouter);

            onChangementItineraires(nouveauxItineraires);
            miseAJourPlusCourtCheminAPI();
        }
    }, [livraisonAjouteePourCoursier]);

    useEffect(() => {
        if (itineraires.length > 0){
        // Récupérer toutes les adresses des itinéraires
        const adressesDesItineraires = new Set(
            itineraires.flatMap(itineraire =>
                itineraire.livraisons.livraisons
                    .map(livraison => livraison.intersection.id)
            )
        );
        //Trouve l'id de l'entrepôt
        const idEntrepot = adressesDesItineraires.values().next().value;

        // Mettre à jour adressesLivraisonsXml et ajouter les nouvelles adresses
        setAdressesLivraisonsXml(prev => {
            // Filtrer les adresses qui ne sont plus dans les itinéraires
            const adressesExistantes = prev.filter(adresse =>
                adressesDesItineraires.has(adresse.id)
            );

            // Récupérer toutes les nouvelles adresses des itinéraires
            const nouvellesAdresses = itineraires.flatMap(itineraire =>
                itineraire.livraisons.livraisons
                    .filter(livraison => !prev.some(addr => addr.id === livraison.intersection.id) && livraison.intersection.id !== idEntrepot)
                    .map(livraison => ({
                        id: livraison.intersection.id,
                        latitude: livraison.intersection.latitude,
                        longitude: livraison.intersection.longitude,
                        adresse: livraison.intersection.adresse,
                        voisins: []
                    }))
            );

            return [...adressesExistantes, ...nouvellesAdresses];
        });
        }
    }, [itineraires])
        
    return (
        <Box 
            sx={{ margin: 'auto', padding: 2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onSelectionItineraire(undefined);
                }
            }}
        >
            <Toaster />
            <Typography variant="h4" gutterBottom>
                Gestion des Itinéraires
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button 
                    onClick={annulerDerniereAction} 
                    disabled={historique.length <= 1} 
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    title="Annuler la dernière action"
                />

                <Button 
                    onClick={retablirDerniereAction} 
                    disabled={historiqueAnnule.length === 0} 
                    variant="outlined"
                    startIcon={<RedoIcon />}
                    title="Rétablir la dernière action"
                />

                <Button 
                    onClick={genererFichesRoutes} 
                    disabled={!estModifie} 
                    variant="contained"
                >
                    Générer les fiches de routes
                </Button>
            </Box>

            <Box sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2
            }}>
                {itineraires.map((itineraire, indexCoursier) => (
                    <Card key={indexCoursier} sx={{
                        minWidth: 300,
                        maxWidth: 350,
                        backgroundColor: 'background.default'
                    }}>
                        <CardContent 
                            onClick={() => gererSelectionItineraire(indexCoursier)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor: itineraireSelectionne === indexCoursier ? 'action.selected' : 'background.default',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            <Typography color="primary" variant="h6" gutterBottom>
                                Coursier {indexCoursier + 1}
                            </Typography>
                            <Typography color="text.secondary" gutterBottom>
                                {itineraire.livraisons.livraisons.length} livraisons
                            </Typography>

                            <List>
                            {itineraire.livraisons.livraisons.map((livraison, indexLivraison) => {
                                const estPremierEntrepot = indexLivraison === 0;
                                const estDernierEntrepot = indexLivraison === itineraire.livraisons.livraisons.length - 1;
                                return (
                                    <ListItem
                                        key={`${livraison.intersection.id}-${indexLivraison}`}
                                        sx={{
                                            my: 1,
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: 'white'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%'
                                        }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                {estPremierEntrepot || estDernierEntrepot ? (
                                                    <>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            Entrepôt <br/>
                                                            
                                                        </Typography>
                                                        {livraison.intersection.id && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                ID: {livraison.intersection.id} <br/>
                                                                <strong>{livraison.heureArrivee.slice(0, -3)}</strong>
                                                            </Typography>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Typography variant="body1">
                                                            {livraison.intersection.adresse ? livraison.intersection.adresse :  definirAdressesSelonVoisins(livraison.intersection)}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            ID: {livraison.intersection.id} <br/>
                                                            <strong>{livraison.heureArrivee.slice(0, -3)}</strong>
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {!estDernierEntrepot && !estPremierEntrepot &&(
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => supprimerLivraison(livraison, indexCoursier)}
                                                    >
                                                        <DeleteIcon color="error" />
                                                    </IconButton>
                                                )}
                                                {!estDernierEntrepot && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => ajouterLivraison(indexCoursier, indexLivraison)}
                                                    >
                                                        <AddIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>
                                    </ListItem>
                                );
                            })}
                        </List>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Dialog open={dialogueOuvert} onClose={() => setDialogueOuvert(false)}>
                <DialogTitle>Modifier la livraison</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Coursier</InputLabel>
                        <Select
                            value={coursierSelectionne}
                            onChange={(e) => setCoursierSelectionne(e.target.value as number)}
                        >
                            {itineraires.map((_, index) => (
                                <MenuItem key={index} value={index}>
                                    Coursier {index + 1}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogueOuvert(false)}>Annuler</Button>
                    <Button onClick={sauvegarderModification} variant="contained">
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GestionnaireItineraire;