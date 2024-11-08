// ItineraireManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
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
    DragHandle as DragHandleIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Undo as UndoIcon,
    Redo as RedoIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

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
    itineraires: Itineraire[];
    onChangementItineraires: (nouveauxItineraires: Itineraire[]) => void;
}

const GestionnaireItineraire: React.FC<GestionnaireItineraireProps> = ({ itineraires, onChangementItineraires }) => {
    const [dialogueOuvert, setDialogueOuvert] = useState(false);
    const [livraisonSelectionnee, setLivraisonSelectionnee] = useState<any>(null);
    const [coursierSelectionne, setCoursierSelectionne] = useState<number>(0);
    const [dialogueSuppressionOuvert, setDialogueSuppressionOuvert] = useState(false);
    const [livraisonASupprimer, setLivraisonASupprimer] = useState<{ livraison: PointLivraison, indexCoursier: number } | null>(null);
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

    useEffect(() => {
        if (!retourEnCours) {
            const deepCopyItineraires = deepCopy(itineraires);
            console.log("history retard 1", historique);
            console.log("history a jour", [...historique, deepCopyItineraires]);
            setHistorique([...historique, deepCopyItineraires]);
        }
        else {
            setRetourEnCours(false);
        }
    }, [itineraires]);

    const gererFinGlisserDeposer = (resultat: any) => {
        if (!resultat.destination) return;

        const { source, destination } = resultat;
        const nouveauxItineraires = [...itineraires];

        // Si le déplacement est dans le même itinéraire
        if (source.droppableId === destination.droppableId) {
            const itineraireIndex = parseInt(source.droppableId);
            const livraisons = [...nouveauxItineraires[itineraireIndex].livraisons.livraisons];
            const [removed] = livraisons.splice(source.index, 1);
            livraisons.splice(destination.index, 0, removed);
            nouveauxItineraires[itineraireIndex].livraisons.livraisons = livraisons;
        } else {
            // Si le déplacement est entre différents itinéraires
            const sourceItineraireIndex = parseInt(source.droppableId);
            const destItineraireIndex = parseInt(destination.droppableId);

            const sourceLivraisons = [...nouveauxItineraires[sourceItineraireIndex].livraisons.livraisons];
            const destLivraisons = [...nouveauxItineraires[destItineraireIndex].livraisons.livraisons];

            const [removed] = sourceLivraisons.splice(source.index, 1);
            destLivraisons.splice(destination.index, 0, removed);

            nouveauxItineraires[sourceItineraireIndex].livraisons.livraisons = sourceLivraisons;
            nouveauxItineraires[destItineraireIndex].livraisons.livraisons = destLivraisons;
        }

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

    const supprimerLivraison = () => {
        if (!livraisonASupprimer) return;

        const nouveauxItineraires = [...itineraires];
        const { livraison, indexCoursier } = livraisonASupprimer;

        // Retirer la livraison de son itinéraire actuel
        const itineraire = nouveauxItineraires[indexCoursier];
        itineraire.livraisons.livraisons = itineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraison.intersection.id
        );

        mettreAJourItineraires(nouveauxItineraires);
        setDialogueSuppressionOuvert(false);
    };

    const annulerDerniereAction = () => {
        setRetourEnCours(true);
        if (historique.length > 1) {
            const newHistory = [...historique];
            const actionAnnulee = newHistory.pop()!; // L'action qu'on annule
            setHistoriqueAnnule([...historiqueAnnule, actionAnnulee]); // On la sauvegarde
            const previousState = newHistory[newHistory.length - 1];
            setHistorique(newHistory);
            onChangementItineraires(deepCopy(previousState));
            setEstModifie(true);
        }
    };

    const retablirDerniereAction = () => {
        setRetourEnCours(true);
        if (historiqueAnnule.length > 0) {
            const newHistoriqueAnnule = [...historiqueAnnule];
            const actionARetablir = newHistoriqueAnnule.pop()!;
            setHistoriqueAnnule(newHistoriqueAnnule);
            setHistorique([...historique, actionARetablir]);
            onChangementItineraires(deepCopy(actionARetablir));
            setEstModifie(true);
        }
    };

    const mettreAJourItineraires = (nouveauxItineraires: Itineraire[]) => {
        onChangementItineraires(nouveauxItineraires);
        setEstModifie(true);
        setHistoriqueAnnule([]);
    };

    const appelerAPI = () => {
        console.log("Appel API effectué avec les itinéraires mis à jour");
        setEstModifie(false);
    };

    return (
        <Box sx={{ margin: 'auto', padding: 2 }}>
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

            <DragDropContext onDragEnd={gererFinGlisserDeposer}>
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 2 // padding bottom pour la scrollbar
                }}>
                    {itineraires.map((itineraire, index) => (
                        <Card key={index} sx={{
                            minWidth: 300,
                            maxWidth: 350,
                            backgroundColor: 'background.default'
                        }}>
                            <CardContent>
                                <Typography color="primary" variant="h6" gutterBottom>
                                    Coursier {index + 1}
                                </Typography>
                                <Typography color="text.secondary" gutterBottom>
                                    {itineraire.livraisons.livraisons.length} livraisons
                                </Typography>

                                <Droppable droppableId={index.toString()}>
                                    {(provided: DroppableProvided) => (
                                        <List
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                bgcolor: 'background.paper',
                                                borderRadius: 1,
                                                minHeight: 400, // hauteur minimale pour faciliter le drag & drop
                                                maxHeight: 'calc(100vh - 250px)', // hauteur maximum avec scroll
                                                overflowY: 'auto'
                                            }}
                                        >
                                            {itineraire.livraisons.livraisons.map((livraison, livraisonIndex) => (
                                                <Draggable
                                                    key={livraison.intersection.id.toString()}
                                                    draggableId={livraison.intersection.id.toString()}
                                                    index={livraisonIndex}
                                                >
                                                    {(provided: DraggableProvided) => (
                                                        <ListItem
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
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
                                                                <DragHandleIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setLivraisonASupprimer({ livraison: livraison, indexCoursier: index });
                                                                        setDialogueSuppressionOuvert(true);
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </ListItem>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </List>
                                    )}
                                </Droppable>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </DragDropContext>

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

            <Dialog open={dialogueSuppressionOuvert} onClose={() => setDialogueSuppressionOuvert(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>Êtes-vous sûr de vouloir supprimer cette livraison ?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogueSuppressionOuvert(false)}>Annuler</Button>
                    <Button onClick={supprimerLivraison} variant="contained" color="error">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GestionnaireItineraire;