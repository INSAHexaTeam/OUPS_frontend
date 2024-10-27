// ItineraireManager.tsx
import React, { useState } from 'react';
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
    EditLocation as EditLocationIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
    };
    cheminIntersections: any[];
}

interface ItineraireManagerProps {
    itineraires: Itineraire[];
    onItinerairesChange: (newItineraires: Itineraire[]) => void;
}

const ItineraireManager: React.FC<ItineraireManagerProps> = ({ itineraires, onItinerairesChange }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLivraison, setSelectedLivraison] = useState<any>(null);
    const [selectedCoursier, setSelectedCoursier] = useState<number>(0);

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

        onItinerairesChange(newItineraires);
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

    return (
        <Box sx={{ margin: 'auto', padding: 2 }}>
    <Typography variant="h4" gutterBottom>
    Gestion des Itinéraires
    </Typography>

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
                                                                    onClick={() => handleEditLivraison(livraison, index)}
                                                                >
                                                                    <EditLocationIcon />
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
        </Box>
);
};

export default ItineraireManager;