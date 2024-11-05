import { Intersection } from "../Utils/points";
// @ts-ignore
import React from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { Box } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

interface ListeRequetesLivraisonAjoutManuelProps {
    adressesLivraisonsXml: Intersection[];
    adressesLivraisonsAjoutees: Intersection[];
    setAdresseLivraisonsXml: (adressesLivraisons: Intersection[]) => void;
    setAdresseLivraisonsAjoutees: (adressesLivraisons: Intersection[]) => void;
    pointDeRetrait: Intersection; // correspond à l'entrepôt
    setPointDeRetrait: (pointDeRetrait: Intersection) => void;
    zoomerVersPoint: (latitude: number, longitude: number) => void;
}

export default function ListeRequetesLivraisonAjoutManuel({
                                                              adressesLivraisonsXml,
                                                              setAdresseLivraisonsXml,
                                                              adressesLivraisonsAjoutees,
                                                              setAdresseLivraisonsAjoutees,
                                                              pointDeRetrait,
                                                              setPointDeRetrait,
                                                              zoomerVersPoint
                                                          }: ListeRequetesLivraisonAjoutManuelProps) {

    // Fonction pour supprimer une livraison
    const gererSuppressionLivraison = (id: number) => () => {
        // Verifier dans quelle liste se trouve l'adresse à supprimer (xml ou ajoutées)
        const isAdresseXml = adressesLivraisonsXml.some((livraison) => livraison.id === id);
        
        if(isAdresseXml) {
          // Supprimer l'adresse de la liste des adresses xml
            const newAdressesLivraisons = adressesLivraisonsXml.filter((livraison) => livraison.id !== id);
            setAdresseLivraisonsXml(newAdressesLivraisons);
        }else {
            // Supprimer l'adresse de la liste des adresses ajoutées
            const newAdressesLivraisons = adressesLivraisonsAjoutees.filter((livraison) => livraison.id !== id);
            setAdresseLivraisonsAjoutees(newAdressesLivraisons);
        }
    };

    const gererClicLigne = (params) => {
        const { latitude, longitude } = params.row;
        zoomerVersPoint(latitude, longitude);
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
                if (row.isRetrait) return [];
                return [
                    <GridActionsCellItem
                        icon={<DeleteRoundedIcon />}
                        onClick={gererSuppressionLivraison(id)}
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
                onRowClick={gererClicLigne}
                getRowClassName={(params) => params.indexRelativeToCurrentPage === 0 ? 'first-row' : ''}
                sx={{
                    '& .MuiDataGrid-root': {
                        minHeight: 'unset',
                    },
                    '& .first-row': {
                        backgroundColor: 'lightblue', // Change this to your desired color
                    },
                }}
            />
        </Box>
    );
}