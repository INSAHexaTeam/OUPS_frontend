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
        <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
    <Typography variant="h4" gutterBottom>
    Gestion des Itinéraires
    </Typography>

    <DragDropContext onDragEnd={handleDragEnd}>
    {itineraires.map((itineraire, index) => (
            <Accordion key={index} defaultExpanded>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography color="primary" variant="h6">
        Coursier {index + 1} ({itineraire.livraisons.livraisons.length} livraisons)
    </Typography>
    </AccordionSummary>
    <AccordionDetails>
    <Droppable droppableId={index.toString()}>
        {(provided) => (
        <List
            ref={provided.innerRef}
    {...provided.droppableProps}
>
    {itineraire.livraisons.livraisons.map((livraison, livraisonIndex) => (
        <Draggable
            key={`${livraison.intersection.id}`}
        draggableId={`${livraison.intersection.id}`}
        index={livraisonIndex}
            >
            {(provided) => (
        <ListItem
            ref={provided.innerRef}
        {...provided.draggableProps}
        sx={{
        bgcolor: 'background.paper',
            mb: 1,
            borderRadius: 1,
            boxShadow: 1
    }}
    >
        <IconButton {...provided.dragHandleProps}>
        <DragHandleIcon />
        </IconButton>
        <ListItemText
        primary={`Livraison ${livraisonIndex + 1}`}
        secondary={`ID: ${livraison.intersection.id}${livraison.intersection.adresse ? ` - ${livraison.intersection.adresse}` : ''}`}
        />
        <IconButton onClick={() => handleEditLivraison(livraison, index)}>
        <EditLocationIcon />
        </IconButton>
        </ListItem>
    )}
        </Draggable>
    ))}
    {provided.placeholder}
    </List>
)}
    </Droppable>
    </AccordionDetails>
    </Accordion>
))}
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