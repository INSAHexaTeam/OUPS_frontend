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
    DragHandle as DragHandleIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

interface Livraison {
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
        livraisons: Livraison[];
        coursier?: number;
    };
    cheminIntersections: any[];
}

// Ajouter cette fonction avant le composant ItineraireManager
const deepCopy = <T,>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

interface ItineraireManagerProps {
    isTourneeCalculee: boolean;
    itineraires: Itineraire[];
    onItinerairesChange: (newItineraires: Itineraire[]) => void;
}

const ItineraireManager: React.FC<ItineraireManagerProps> = ({ itineraires, onItinerairesChange }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLivraison, setSelectedLivraison] = useState<any>(null);
    const [selectedCoursier, setSelectedCoursier] = useState<number>(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [livraisonToDelete, setLivraisonToDelete] = useState<{ livraison: Livraison, coursierIndex: number } | null>(null);
    const [history, setHistory] = useState<Itineraire[][]>([itineraires]);
    const [isModified, setIsModified] = useState(false);


    //l'objet itinéraire est une liste de livraisons par coursier : itinéraire = [livraisonPourCoursier1, livraisonPourCoursier2, ...]
    //les livraisonsPourCoursier sont des objets avec les propriétés : cheminIntersections, livraisons
    //cheminIntersections est un tableau d'intersection qui correspond au chemin du coursier
    //livraisons est un objet qui contient le numéro du coursier (pas forcément utile car on peut le retrouver avec l'index de l'itinéraire) 
    //l'entrepot et l'heure de départ puis la listes des livraisons (= les intersections sur lesquelles le coursier doit s'arreter)
    //livraisons est un tableau de livraison

    //la structure n'est clairement pas optimale mais elle était en lien avec ce qu'il se passait dans le backend
    //vu que thomas vas changer le backend, il risque de falloir modifier ce code

    useEffect(() => {
        const deepCopyItineraires = deepCopy(itineraires);
        console.log("itinéraires", itineraires);
        console.log("history retard 1", history);
        console.log("history a jour", [...history, deepCopyItineraires]);
        setHistory([...history, deepCopyItineraires]);
    }, [itineraires]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const newItineraires = [...itineraires];

        // Si le déplacement est dans le même itinéraire
        if (source.droppableId === destination.droppableId) {
            const itineraireIndex = parseInt(source.droppableId);
            const livraisons = [...newItineraires[itineraireIndex].livraisons.livraisons];
            const [removed] = livraisons.splice(source.index, 1);
            livraisons.splice(destination.index, 0, removed);
            newItineraires[itineraireIndex].livraisons.livraisons = livraisons;
        } else {
            // Si le déplacement est entre différents itinéraires
            const sourceItineraireIndex = parseInt(source.droppableId);
            const destItineraireIndex = parseInt(destination.droppableId);

            const sourceLivraisons = [...newItineraires[sourceItineraireIndex].livraisons.livraisons];
            const destLivraisons = [...newItineraires[destItineraireIndex].livraisons.livraisons];

            const [removed] = sourceLivraisons.splice(source.index, 1);
            destLivraisons.splice(destination.index, 0, removed);

            newItineraires[sourceItineraireIndex].livraisons.livraisons = sourceLivraisons;
            newItineraires[destItineraireIndex].livraisons.livraisons = destLivraisons;
        }

        updateItineraires(newItineraires);
    };

    const handleEditLivraison = (livraison: Livraison, coursierIndex: number) => {
        setSelectedLivraison({ ...livraison, coursierIndex });
        setSelectedCoursier(coursierIndex);
        setIsDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!selectedLivraison) return;

        const newItineraires = [...itineraires];

        // Retirer la livraison de son itinéraire actuel
        const oldItineraire = newItineraires[selectedLivraison.coursierIndex];
        oldItineraire.livraisons.livraisons = oldItineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== selectedLivraison.intersection.id
        );

        // Ajouter la livraison au nouvel itinéraire
        const newItineraire = newItineraires[selectedCoursier];
        newItineraire.livraisons.livraisons.push(selectedLivraison);

        onItinerairesChange(newItineraires);
        setIsDialogOpen(false);
    };

    const handleDeleteLivraison = () => {
        if (!livraisonToDelete) return;

        const newItineraires = [...itineraires];
        const { livraison, coursierIndex } = livraisonToDelete;

        // Retirer la livraison de son itinéraire actuel
        const itineraire = newItineraires[coursierIndex];
        itineraire.livraisons.livraisons = itineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraison.intersection.id
        );

        updateItineraires(newItineraires);
        setIsDeleteDialogOpen(false);
    };

    const handleUndo = () => {
        if (history.length > 1) {
            console.log("history", history);
            const newHistory = [...history];
            newHistory.pop();
            const previousState = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            onItinerairesChange(deepCopy(previousState));
            setIsModified(true);
        }
    };

    const updateItineraires = (newItineraires: Itineraire[]) => {

        // setHistory([...history, newItineraires]);
        onItinerairesChange(newItineraires);
        setIsModified(true);
    };

    const handleApiCall = () => {
        console.log("Appel API effectué avec les itinéraires mis à jour");
        setIsModified(false);
    };

    return (
        <Box sx={{ margin: 'auto', padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                Gestion des Itinéraires
            </Typography>

            <Button onClick={handleUndo} disabled={history.length <= 1} variant="outlined" sx={{ mb: 2 }}>
                Annuler la dernière action
            </Button>

            <Button onClick={handleApiCall} disabled={!isModified} variant="contained" sx={{ mb: 2, ml: 2 }}>
                Envoyer les modifications
            </Button>

            <DragDropContext onDragEnd={handleDragEnd}>
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
                                                                        setLivraisonToDelete({ livraison, coursierIndex: index });
                                                                        setIsDeleteDialogOpen(true);
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

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Modifier la livraison</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Coursier</InputLabel>
                        <Select
                            value={selectedCoursier}
                            onChange={(e) => setSelectedCoursier(e.target.value as number)}
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
                    <Button onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveEdit} variant="contained">
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>Êtes-vous sûr de vouloir supprimer cette livraison ?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleDeleteLivraison} variant="contained" color="error">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ItineraireManager;