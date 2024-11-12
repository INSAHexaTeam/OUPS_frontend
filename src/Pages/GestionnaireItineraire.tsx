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
    ExpandMore as ExpandMoreIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { calculerItineraireOrdonne } from '../Appels_api/calculerItineraireOrdonne.ts';
import { ItineraireOrdonne } from '../Utils/points.tsx';

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
    
}

const GestionnaireItineraire: React.FC<GestionnaireItineraireProps> = ({ 
    itineraires, 
    onChangementItineraires,
    itineraireSelectionne,
    onSelectionItineraire,
    isTourneeCalculee
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

    // useEffect(() => {
    //     setHistorique([])
    //     setHistoriqueAnnule([])
    // }, [isTourneeCalculee]);

    const deplacerLivraison = (livraison: PointLivraison, indexSourceCoursier: number, indexDestinationCoursier: number) => {
        const nouveauxItineraires = [...itineraires];

        // Retirer la livraison de son itinéraire actuel
        const sourceLivraisons = nouveauxItineraires[indexSourceCoursier].livraisons.livraisons;
        const livraisonIndex = sourceLivraisons.findIndex(l => l.intersection.id === livraison.intersection.id);
        sourceLivraisons.splice(livraisonIndex, 1);

        // Ajouter la livraison au nouvel itinéraire
        nouveauxItineraires[indexDestinationCoursier].livraisons.livraisons.push(livraison);

        mettreAJourItineraires(nouveauxItineraires);
    };

    const gererModificationLivraison = (livraison: PointLivraison, indexCoursier: number) => {
        setLivraisonSelectionnee({ ...livraison, indexCoursier });
        setCoursierSelectionne(indexCoursier);
        setDialogueOuvert(true);
    };

    const sauvegarderModification = () => {
        if (!livraisonSelectionnee) return;

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

        

        mettreAJourItineraires(nouveauxItineraires);

        // Retirer la livraison de son itinéraire actuel
        const itineraire = nouveauxItineraires[indexCoursier];
        itineraire.livraisons.livraisons = itineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraison.intersection.id
        );
    };

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
        const deepCopyItineraires = deepCopy(itineraires);
        console.log("Je push sur l'historique :", deepCopyItineraires);
        console.log("Historique mis à jour :", [...historique, deepCopyItineraires]);
        setHistorique([...historique, deepCopyItineraires]);
        
        setEstModifie(true);
        setHistoriqueAnnule([]);
        // onChangementItineraires(nouveauxItineraires);
    };

    const appelerAPI = () => {
        console.log("Appel API effectué avec les itinéraires mis à jour");
        
        const itinerairesOrdonnes = {
            livraisons: itineraires.map(itineraire => ({
                cheminIntersections: itineraire.cheminIntersections || [],
                livraisons: {
                    entrepot: {
                        heureDepart: "08:00:00",
                        intersection: itineraire.livraisons.entrepot.intersection
                    },
                    livraisons: [
                        {
                            intersection: itineraire.livraisons.entrepot.intersection,
                            estUneLivraison: false
                        },
                        ...itineraire.livraisons.livraisons.map(livraison => ({
                            intersection: livraison.intersection,
                            estUneLivraison: false
                        }))
                    ],
                    coursier: null
                }
            }))
        };

        console.log(itinerairesOrdonnes);
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
                mettreAJourItineraires(itineraires);
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

    return (
        <Box 
            sx={{ margin: 'auto', padding: 2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onSelectionItineraire(undefined);
                }
            }}
        >
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
                    onClick={appelerAPI} 
                    disabled={!estModifie} 
                    variant="contained"
                >
                    Envoyer les modifications
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

                            <List sx={{
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                minHeight: 400,
                                maxHeight: 'calc(100vh - 250px)',
                                overflowY: 'auto'
                            }}>
                                {itineraire.livraisons.livraisons.map((livraison, livraisonIndex) => (
                                    <ListItem
                                        key={livraison.intersection.id}
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
                                                <Typography variant="body1">
                                                    Livraison {livraisonIndex + 1}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {livraison.intersection.id}
                                                </Typography>
                                                {livraison.intersection.adresse && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {livraison.intersection.adresse}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Select
                                                    size="small"
                                                    value={indexCoursier}
                                                    onChange={(e) => deplacerLivraison(
                                                        livraison,
                                                        indexCoursier,
                                                        e.target.value as number
                                                    )}
                                                    sx={{ minWidth: 120 }}
                                                >
                                                    {itineraires.map((_, index) => (
                                                        <MenuItem 
                                                            key={index} 
                                                            value={index}
                                                            disabled={index === indexCoursier}
                                                        >
                                                            Coursier {index + 1}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => supprimerLivraison(livraison, indexCoursier)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </ListItem>
                                ))}
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