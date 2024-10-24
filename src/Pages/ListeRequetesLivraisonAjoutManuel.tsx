import { Intersection } from "../Utils/points";
import React from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { Box } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

interface ListeRequetesLivraisonAjoutManuelProps {
    adressesLivraisonsAjoutees: Intersection[];
    setAdresseLivraisons: (adressesLivraisons: Intersection[]) => void;
    pointDeRetrait: Intersection; // correspond à l'entrepôt
    setPointDeRetrait: (pointDeRetrait: Intersection) => void;
}

export default function ListeRequetesLivraisonAjoutManuel({
                                                              adressesLivraisonsAjoutees,
                                                              setAdresseLivraisons,
                                                              pointDeRetrait,
                                                              setPointDeRetrait
                                                          }: ListeRequetesLivraisonAjoutManuelProps) {

    // Fonction pour supprimer une livraison
    const handleSupprimerLivraison = (id: number) => () => {
        const newAdressesLivraisons = adressesLivraisonsAjoutees.filter((livraison) => livraison.id !== id);
        setAdresseLivraisons(newAdressesLivraisons);
    };

    // Define rows with pointDeRetrait first
    let rows = [];
    if (adressesLivraisonsAjoutees !== null && adressesLivraisonsAjoutees.length > 0) {
        rows = adressesLivraisonsAjoutees.map(livraison => ({
            ...livraison,
            isRetrait: false
        }));
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'adresse',
            headerName: 'Adresse de livraison',
            width: 250,
            editable: false,
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Suppression",
            width: 70,
            getActions: ({ id, row }) => {
                if (row.isRetrait) return [];
                return [
                    <GridActionsCellItem
                        icon={<DeleteRoundedIcon />}
                        onClick={handleSupprimerLivraison(id)}
                        color="error"
                    />,
                ];
            },
        },
    ];

    return (
        <Box sx={{ height: 'auto', maxHeight: 400, width: '100%' }}> {/* Max height for 6 rows */}
            <DataGrid
                rows={rows}
                columns={columns}
                autoHeight // Automatically adjusts height to fit rows
                hideFooterPagination
                disableSelectionOnClick
                sx={{
                    '& .MuiDataGrid-root': {
                        minHeight: 'unset',
                    },
                }}
            />
        </Box>
    );
}
