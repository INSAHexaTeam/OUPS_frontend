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
    Undo as UndoIcon,
    Redo as RedoIcon,
    Add as AddIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { calculerItineraireOrdonne } from '../Appels_api/calculerItineraireOrdonne.ts';
import { calculerItineraireOrdonneOpti } from '../Appels_api/calculerItineraireOrdonneOpti.ts';
import {definirAdressesSelonVoisins} from "../Utils/utils.ts";
import {Intersection} from "../Utils/points";
import {livraisonAjouteePourCoursier} from "../Utils/types";
import toast, {Toaster} from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

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
    adressesLivraisonsAjoutees: Intersection[];
    adressesLivraisonsXml: Intersection[];
    setAdressesLivraisonsAjoutees: (adresses: Intersection[]) => void;
    setAdressesLivraisonsXml: (adresses: Intersection[]) => void;
    setLivraisonAjouteePourCoursier: (livraisonAjouteePourCoursier: livraisonAjouteePourCoursier) => void;
    livraisonAjouteePourCoursier: livraisonAjouteePourCoursier;
    zoomerVersPoint: (latitude: number, longitude: number) => void;
}

const GestionnaireItineraire: React.FC<GestionnaireItineraireProps> = ({ 
    itineraires, 
    onChangementItineraires,
    itineraireSelectionne,
    onSelectionItineraire,
    adressesLivraisonsAjoutees,
    adressesLivraisonsXml,
    setAdressesLivraisonsAjoutees,
    setAdressesLivraisonsXml,
    setLivraisonAjouteePourCoursier,
    livraisonAjouteePourCoursier,
    zoomerVersPoint,
}) => {
  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const [livraisonSelectionnee] = useState<any>(null);
  const [coursierSelectionne, setCoursierSelectionne] = useState<number>(0);
  const [historique, setHistorique] = useState<Itineraire[][]>([itineraires]);
  const [estModifie, setEstModifie] = useState(false);
  const [historiqueAnnule, setHistoriqueAnnule] = useState<Itineraire[][]>([]);
  const [actionEnCours, setActionEnCours] = useState(false);
  const couleursItineraires = ['#FF0000', '#0000FF', '#808080', '#DE2AEE', '#008000'];
  const [donneesTournee, setDonneesTournee] = useState([]);
  const navigation = useNavigate();

    const sauvegarderModification = () => {
        const nouveauxItineraires = [...itineraires];

        // Retirer la livraison de son itinéraire actuel
        const oldItineraire = nouveauxItineraires[livraisonSelectionnee.indexCoursier];
        oldItineraire.livraisons.livraisons = oldItineraire.livraisons.livraisons.filter(
            l => l.intersection.id !== livraisonSelectionnee.intersection.id
        );
        
        // Ajouter la livraison au nouvel itinéraire
        const newItineraire = nouveauxItineraires[coursierSelectionne];
        newItineraire.livraisons.livraisons.push(livraisonSelectionnee);
        setDonneesTournee(nouveauxItineraires);
        onChangementItineraires(nouveauxItineraires);
        setDialogueOuvert(false);
    };

  const supprimerLivraison = async (livraison: PointLivraison, indexCoursier: number) => {
    setActionEnCours(true);
    const nouveauxItineraires = [...itineraires];
    avantMiseAJourItineraires();
    onChangementItineraires(nouveauxItineraires);

    // Retirer la livraison de son itinéraire actuel
    const itineraire = nouveauxItineraires[indexCoursier];
    itineraire.livraisons.livraisons = itineraire.livraisons.livraisons.filter(
      l => l.intersection.id !== livraison.intersection.id
    );

    supprimerDansXmlOuAjoutees(livraison);
    onChangementItineraires(nouveauxItineraires);
    setDonneesTournee(nouveauxItineraires);
    await miseAJourPlusCourtCheminAPI(indexCoursier);
    setActionEnCours(false);
  };

  const supprimerDansXmlOuAjoutees = (livraison: PointLivraison) => {
    const indexXML = adressesLivraisonsXml.findIndex((adresse) => adresse.id === livraison.intersection.id);
    if (indexXML !== -1) {
      const nouvelleListeSansLivraison = [...adressesLivraisonsXml];
      nouvelleListeSansLivraison.splice(indexXML, 1);
      setAdressesLivraisonsXml(nouvelleListeSansLivraison);
    } else {
      const indexAjout = adressesLivraisonsAjoutees.findIndex((adresse) => adresse.id === livraison.intersection.id);
      if (indexAjout !== -1) {
        const nouvelleListeSansLivraison = [...adressesLivraisonsAjoutees];
        nouvelleListeSansLivraison.splice(indexAjout, 1);
        setAdressesLivraisonsAjoutees(nouvelleListeSansLivraison);
      }
    }
  }


  const genererFichesRoutes = async () => {
    try {
      navigation('/export', { state: { donneesTournee } });
    } catch (error) {
      console.error("Erreur lors du téléchargement de la tournée:", error);
      toast.error("Erreur lors du téléchargement de la tournée");
    }
  };

      
  const annulerDerniereAction = () => {
    if (historique.length > 0) {
      const newHistory = [...historique];
      const actionAnnulee = newHistory.pop()!;
      const previousState = deepCopy(itineraires);
      setHistoriqueAnnule([...historiqueAnnule, deepCopy(previousState)]);
      setHistorique(newHistory);
      onChangementItineraires(deepCopy(actionAnnulee));
      setDonneesTournee(deepCopy(actionAnnulee));
      setEstModifie(true);
    }
  };

  const retablirDerniereAction = () => {
    if (historiqueAnnule.length > 0) {
      setHistorique([...historique, itineraires]);
      const newHistoriqueAnnule = [...historiqueAnnule];
      const actionARetablir = newHistoriqueAnnule.pop()!;
      setHistoriqueAnnule(newHistoriqueAnnule);
      onChangementItineraires(deepCopy(actionARetablir));
      setDonneesTournee(deepCopy(actionARetablir));
      setEstModifie(true);
    }
  };

  const avantMiseAJourItineraires = () => {
    const deepCopyItineraires = deepCopy(itineraires);
    setHistorique([...historique, deepCopyItineraires]);
    setEstModifie(true);
    setHistoriqueAnnule([]);
  }

    const miseAJourPlusCourtCheminAPI = async (coursierId:number, envoieItineraire = itineraires) => {
        try {
            const itinerairesOrdonnes = {
                livraisons: envoieItineraire.map(itineraire => ({
                    cheminIntersections: itineraire.cheminIntersections || [],
                    livraisons: {
                        entrepot: {
                            heureDepart: "08:00:00",
                            intersection: itineraire.livraisons.entrepot.intersection
                        },
                        livraisons: [
                            ...itineraire.livraisons.livraisons.map(livraison => ({
                                intersection: livraison.intersection
                            }))
                        ],
                        coursier: null
                    }
                }))
            };
            const response = await calculerItineraireOrdonneOpti(itinerairesOrdonnes, coursierId)
            const nouveauxItineraires = [...itineraires];
            nouveauxItineraires[coursierId] = response.data;
            onChangementItineraires(nouveauxItineraires);
            setDonneesTournee(nouveauxItineraires);
        } catch (error) {
            console.error("Erreur lors du calcul de l'itinéraire :", error);
        } finally {
            setEstModifie(false);
        }
    };

    const gererSelectionItineraire = (index: number) => {
        if (itineraireSelectionne === index) {
            onSelectionItineraire(undefined);
    } else {
      onSelectionItineraire(index);
    }
  };

  const ajouterLivraison = (indexCoursier: number, indexLivraison: number) => {
      setActionEnCours(true);
      avantMiseAJourItineraires();

    toast(<p>Cliquez sur une intersection de la carte pour ajouter une livraison au <b>coursier n°{indexCoursier + 1}</b></p>, {
      icon: '📍',
      duration: 3000
    });
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const livraisonAjouteePourCoursier = {
      numeroCoursier: indexCoursier,
      indexLivraison: indexLivraison,
      intersection: null
    }

    setLivraisonAjouteePourCoursier(livraisonAjouteePourCoursier);
  };

  const deplacerLivraison = async (indexCoursier: number, indexLivraison: number, direction: 'up' | 'down') => {
    setActionEnCours(true);
    const nouveauxItineraires = deepCopy(itineraires);
    const livraisons = nouveauxItineraires[indexCoursier].livraisons.livraisons;

    if (indexLivraison <= 0 || indexLivraison >= livraisons.length - 1) {
      setActionEnCours(false);
      return;
    }
    if ((direction === 'up' && indexLivraison <= 1) ||
      (direction === 'down' && indexLivraison >= livraisons.length - 2)) {
      setActionEnCours(false);
      return;
    }

    const nouvelIndex = direction === 'up' ? indexLivraison - 1 : indexLivraison + 1;
    avantMiseAJourItineraires();
    [livraisons[indexLivraison], livraisons[nouvelIndex]] =
      [livraisons[nouvelIndex], livraisons[indexLivraison]];

    await miseAJourPlusCourtCheminAPI(nouveauxItineraires);
    setActionEnCours(false);
  };

  useEffect(() => {
    if (livraisonAjouteePourCoursier?.intersection) {
      const nouveauxItineraires = [...itineraires];
      const intersectionSansVoisins = {
        id: livraisonAjouteePourCoursier.intersection.id,
        latitude: livraisonAjouteePourCoursier.intersection.latitude,
        longitude: livraisonAjouteePourCoursier.intersection.longitude,
        voisins: [],
        adresse: definirAdressesSelonVoisins(livraisonAjouteePourCoursier.intersection),
      }

      const livraiseAAjouter = {
        intersection: intersectionSansVoisins,
        estUneLivraison: true,
        distanceParcourue: 0,
        heureArrivee: "00:00:00",
      }

      const itineraireCoursier = nouveauxItineraires[livraisonAjouteePourCoursier.numeroCoursier];
      itineraireCoursier.livraisons.livraisons.splice(livraisonAjouteePourCoursier.indexLivraison + 1, 0, livraiseAAjouter);

      onChangementItineraires(nouveauxItineraires);
      setDonneesTournee(nouveauxItineraires);
      miseAJourPlusCourtCheminAPI(livraisonAjouteePourCoursier.numeroCoursier).finally(() => {
        setActionEnCours(false);
      });
    }
  }, [livraisonAjouteePourCoursier]);

  useEffect(() => {
    if (itineraires.length > 0) {
      const adressesDesItineraires = new Set(
        itineraires.flatMap(itineraire =>
          itineraire.livraisons.livraisons
            .map(livraison => livraison.intersection.id)
        )
      );
      const idEntrepot = adressesDesItineraires.values().next().value;

      setAdressesLivraisonsXml(prev => {
        const adressesExistantes = prev.filter(adresse =>
          adressesDesItineraires.has(adresse.id)
        );

        const nouvellesAdresses = itineraires.flatMap(itineraire =>
          itineraire.livraisons.livraisons
            .filter(livraison => !prev.some(addr => addr.id === livraison.intersection.id) && livraison.intersection.id !== idEntrepot)
            .map(livraison => ({
              id: livraison.intersection.id,
              latitude: livraison.intersection.latitude,
              longitude: livraison.intersection.longitude,
              adresse: livraison.intersection.adresse,
              voisins: []
            }))
        );

        return [...adressesExistantes, ...nouvellesAdresses];
      });
    }
  }, [itineraires])

  const gererClicLivraison = (livraison: any) => {
    zoomerVersPoint(livraison.intersection.latitude, livraison.intersection.longitude);
  };

  const genererClefUnique = (livraison: any, indexLivraison: number, nombreTotalLivraisons: number): string => {
    if (indexLivraison === 0) {
      return `entrepot-depart-${livraison.intersection.id}`;
    } else if (indexLivraison === nombreTotalLivraisons - 1) {
      return `entrepot-arrivee-${livraison.intersection.id}`;
    }
    return `livraison-${livraison.intersection.id}-${indexLivraison}`;
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
      <Toaster />
      <Typography variant="h4" gutterBottom>
        Gestion des Itinéraires
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          onClick={annulerDerniereAction}
          disabled={historique.length <= 1 || actionEnCours}
          variant="outlined"
          startIcon={<UndoIcon />}
          title="Annuler la dernière action"
        />

        <Button
          onClick={retablirDerniereAction}
          disabled={historiqueAnnule.length === 0 || actionEnCours}
          variant="outlined"
          startIcon={<RedoIcon />}
          title="Rétablir la dernière action"
        />

        <Button
          onClick={genererFichesRoutes}
          disabled={actionEnCours}
          variant="contained"
        >
          Générer les fiches de routes
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
            backgroundColor: 'background.default',
            border: 3,
            borderColor: couleursItineraires[indexCoursier % couleursItineraires.length],
            borderRadius: 2
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
              <Typography
                color={couleursItineraires[indexCoursier % couleursItineraires.length]}
                variant="h6"
                gutterBottom
                fontWeight="bold"
              >
                Coursier {indexCoursier + 1}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {itineraire.livraisons.livraisons.length - 2} livraison{itineraire.livraisons.livraisons.length > 3 ? 's' : ''}
              </Typography>

              <List>
                {itineraire.livraisons.livraisons.map((livraison, indexLivraison) => {
                  const estPremierEntrepot = indexLivraison === 0;
                  const estDernierEntrepot = indexLivraison === itineraire.livraisons.livraisons.length - 1;
                  return (
                    <ListItem
                      key={genererClefUnique(
                        livraison,
                        indexLivraison,
                        itineraire.livraisons.livraisons.length
                      )}
                      sx={{
                        my: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'white',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        }
                      }}
                      onClick={() => gererClicLivraison(livraison)}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 1
                      }}>
                        {/* Boutons de flèches à gauche */}
                        {!estPremierEntrepot && !estDernierEntrepot && (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0,
                            minWidth: '32px'
                          }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deplacerLivraison(indexCoursier, indexLivraison, 'up');
                              }}
                              disabled={indexLivraison <= 1 || actionEnCours}
                              sx={{ padding: '2px' }}
                            >
                              <ArrowUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deplacerLivraison(indexCoursier, indexLivraison, 'down');
                              }}
                              disabled={indexLivraison >= itineraire.livraisons.livraisons.length - 2 || actionEnCours}
                              sx={{ padding: '2px' }}
                            >
                              <ArrowDownIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}

                        {/* Contenu principal */}
                        <Box sx={{ flexGrow: 1 }}>
                          {estPremierEntrepot || estDernierEntrepot ? (
                            <>
                              <Typography variant="body1" fontWeight="bold">
                                Entrepôt
                              </Typography>
                              {livraison.intersection.id && (
                                <Typography variant="body2" color="text.secondary">
                                  ID: {livraison.intersection.id} <br />
                                  <strong>{livraison.heureArrivee.slice(0, -3)}</strong>
                                </Typography>
                              )}
                            </>
                          ) : (
                            <>
                              <Typography variant="body1">
                                {livraison.intersection.adresse ? livraison.intersection.adresse : definirAdressesSelonVoisins(livraison.intersection)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {livraison.intersection.id} <br />
                                <strong>{livraison.heureArrivee.slice(0, -3)}</strong>
                              </Typography>
                            </>
                          )}
                        </Box>

                        {/* Boutons d'action à droite */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!estPremierEntrepot && !estDernierEntrepot && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                supprimerLivraison(livraison, indexCoursier);
                              }}
                              disabled={actionEnCours}
                            >
                              <DeleteIcon color={!actionEnCours ? "error" : "disabled"} />
                            </IconButton>
                          )}
                          {!estDernierEntrepot && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                ajouterLivraison(indexCoursier, indexLivraison);
                              }}
                              disabled={actionEnCours}
                            >
                              <AddIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
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
              disabled={actionEnCours}
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
          <Button onClick={() => setDialogueOuvert(false)} disabled={actionEnCours}>Annuler</Button>
          <Button onClick={sauvegarderModification} variant="contained" disabled={actionEnCours}>
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionnaireItineraire;
