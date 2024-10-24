import { Intersection } from "../Utils/points";
// @ts-ignore
import React from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { Box } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

interface ListeRequetesLivraisonAjoutManuelProps {
    adressesLivraisonsXml: Intersection[];
    adressesLivraisonsAjoutees: Intersection[];
    setAdresseLivraisonsAjoutees: (adressesLivraisons: Intersection[]) => void;
    pointDeRetrait: Intersection; // correspond à l'entrepôt
    setPointDeRetrait: (pointDeRetrait: Intersection) => void;
}

export default function ListeRequetesLivraisonAjoutManuel({
                                                              adressesLivraisonsXml,
                                                              adressesLivraisonsAjoutees,
                                                              setAdresseLivraisonsAjoutees,
                                                              pointDeRetrait,
                                                              setPointDeRetrait
                                                          }: ListeRequetesLivraisonAjoutManuelProps) {

    // Fonction pour supprimer une livraison
    const handleSupprimerLivraison = (id: number) => () => {
        const newAdressesLivraisons = adressesLivraisonsAjoutees.filter((livraison) => livraison.id !== id);
        setAdresseLivraisonsAjoutees(newAdressesLivraisons);
    };

    // L'entrepôt est affiché en premier dans la liste puis les adresses de livraison xml
    let rows = [];
    if (pointDeRetrait) {
        rows.push({
            ...pointDeRetrait,
            adresse: `${pointDeRetrait.adresse} (entrepôt)`,
            isRetrait: true
        });
    }
    if(adressesLivraisonsXml !== null && adressesLivraisonsXml.length > 0) {
        rows = rows.concat(adressesLivraisonsXml.map(livraison => ({
            ...livraison,
            isLivraisonXml: true
        })));
    }
    if (adressesLivraisonsAjoutees !== null && adressesLivraisonsAjoutees.length > 0) {
        rows = rows.concat(adressesLivraisonsAjoutees.map(livraison => ({
            ...livraison,
            isRetrait: false
        })));
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
            width: 100,
            getActions: ({ id, row }) => {
                if (row.isRetrait || row.isLivraisonXml) return [];
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