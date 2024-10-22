import {Intersection} from "../Utils/points";
import React, {useEffect} from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {Box} from "@mui/material";
import {DataGrid, GridActionsCellItem, GridColDef} from "@mui/x-data-grid";

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

    const [rows, setRows] = React.useState<Intersection[]>([]);
    // Fonction pour supprimer une livraison
    const handleSupprimerLivraison = (id: number) => () => {
        const newAdressesLivraisons = adressesLivraisonsAjoutees.filter((livraison) => livraison.id !== id);
        setAdresseLivraisons(newAdressesLivraisons);
    };

    // Define rows with pointDeRetrait first
    useEffect(() => {
        console.log("add :",pointDeRetrait);
        let rawRows = [];
        if (pointDeRetrait !== null) {
            rawRows = [
                {
                    ...pointDeRetrait,
                    adresse: pointDeRetrait.voisins.length > 0 ? pointDeRetrait.voisins[0].nomRue : 'adresse',
                    isRetrait: true
                },
                ...adressesLivraisonsAjoutees.map(livraison => ({...livraison, isRetrait: false}))
            ];
        }
        setRows(rows);
    }, []);

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'adresse',
            headerName: 'Adresse de livraison',
            width: 300,
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
        <Box>
            <DataGrid
                rows={rows}
                columns={columns}
                hideFooterPagination
            />
        </Box>
    );
}
