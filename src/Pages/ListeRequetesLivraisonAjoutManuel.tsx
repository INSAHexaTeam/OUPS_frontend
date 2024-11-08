import React from "react";
import { Intersection } from "../Utils/points";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {Box, Button} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import {Action} from "../Utils/types";
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

interface ListeRequetesLivraisonAjoutManuelProps {
    ajoutActionStack: (action: Action) => void;
    rollbackDerniereAction: () => void;
    isRollbackDesactive: boolean;
    adressesLivraisonsXml: Intersection[];
    adressesLivraisonsAjoutees: Intersection[];
    setAdresseLivraisonsXml: (adressesLivraisons: Intersection[]) => void;
    setAdresseLivraisonsAjoutees: (adressesLivraisons: Intersection[]) => void;
    pointDeRetrait: Intersection; // correspond à l'entrepôt
    setPointDeRetrait: (pointDeRetrait: Intersection) => void;
    zoomerVersPoint: (latitude: number, longitude: number) => void;
}

export default function ListeRequetesLivraisonAjoutManuel({
                                                              ajoutActionStack,
                                                              rollbackDerniereAction,
                                                              isRollbackDesactive,
                                                              adressesLivraisonsXml,
                                                              setAdresseLivraisonsXml,
                                                              adressesLivraisonsAjoutees,
                                                              setAdresseLivraisonsAjoutees,
                                                              pointDeRetrait,
                                                              setPointDeRetrait,
                                                              zoomerVersPoint
                                                          }: ListeRequetesLivraisonAjoutManuelProps) {
    
    const gererSuppressionLivraison = (id: number) => () => {
        
        const livraisonASupprimer = adressesLivraisonsXml.find((livraison) => livraison.id === id)
            || adressesLivraisonsAjoutees.find((livraison) => livraison.id === id);
        
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
        ajoutActionStack({ type: 1, intersection: { ...livraisonASupprimer } });
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
        <Box>
            <Box>
                <Button
                    onClick={() => rollbackDerniereAction()}
                    disabled={isRollbackDesactive}
                    sx={{ marginBottom: 1 }}
                    startIcon={<ArrowBackRoundedIcon sx={{ color: isRollbackDesactive ? 'grey' : 'black' }} />}
                />
            </Box>
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
        </Box>
    );
}