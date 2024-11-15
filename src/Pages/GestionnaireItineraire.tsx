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
import { definirAdressesSelonVoisins } from "../Utils/utils.ts";
import { Intersection } from "../Utils/points";
import { livraisonAjouteePourCoursier } from "../Utils/types";
import toast, { Toaster } from "react-hot-toast";

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
  genererFichesRoutes: () => void;
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
  genererFichesRoutes,
  zoomerVersPoint,
}) => {
  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const [livraisonSelectionnee] = useState<any>(null);
  const [coursierSelectionne, setCoursierSelectionne] = useState<number>(0);
  const [historique, setHistorique] = useState<Itineraire[][]>([itineraires]);
  const [estModifie, setEstModifie] = useState(false);
  const [historiqueAnnule, setHistoriqueAnnule] = useState<Itineraire[][]>([]);
  const couleursItineraires = ['#FF0000', '#0000FF', '#808080', '#DE2AEE', '#008000'];


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

    onChangementItineraires(nouveauxItineraires);
    setDialogueOuvert(false);
  };

  const supprimerLivraison = (livraison: PointLivraison, indexCoursier: number) => {
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
    miseAJourPlusCourtCheminAPI();
  };

  // Fonction pour supprimer une livraison dans les adresses ajoutées ou dans le XML (si elle y était)
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

  const annulerDerniereAction = () => {
    if (historique.length > 0) {
      const newHistory = [...historique];
      const actionAnnulee = newHistory.pop()!; // L'action qu'on annule
      const previousState = deepCopy(itineraires);
      console.log("je push sur annule : ", deepCopy(previousState))
      setHistoriqueAnnule([...historiqueAnnule, deepCopy(previousState)]); // On la sauvegarde
      setHistorique(newHistory);
      onChangementItineraires(deepCopy(actionAnnulee));
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
      setEstModifie(true);
    }
  };

  const avantMiseAJourItineraires = () => {
    const deepCopyItineraires = deepCopy(itineraires);
    setHistorique([...historique, deepCopyItineraires]);

    setEstModifie(true);
    setHistoriqueAnnule([]);
  }

  const miseAJourPlusCourtCheminAPI = (nouveauxItineraires = itineraires) => {
    const itinerairesOrdonnes = {
      livraisons: nouveauxItineraires.map(itineraire => ({
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
    calculerItineraireOrdonne(itinerairesOrdonnes)
      .then(response => {
        const itineraires: Itineraire[] = response.data.livraisons.map((itineraire: any) => ({
          livraisons: {
            entrepot: itineraire.livraisons.entrepot,
            livraisons: itineraire.livraisons.livraisons,
            coursier: itineraire.livraisons.coursier
          },
          cheminIntersections: itineraire.cheminIntersections
        }));
        onChangementItineraires(itineraires);
      })
      .catch(error => {
        console.error("Erreur lors du calcul de l'itinéraire :", error);
      });
    setEstModifie(false);
  };

  const gererSelectionItineraire = (index: number) => {
    if (itineraireSelectionne === index) {
      onSelectionItineraire(undefined);
    } else {
      onSelectionItineraire(index);
    }
  };

  function ajouterLivraison(indexCoursier: number, indexLivraison: number) {
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
      intersection: null // pour l'instant, on ne sait pas quelle intersection ajouter
    }

    setLivraisonAjouteePourCoursier(livraisonAjouteePourCoursier);
  }

  useEffect(() => {
    if (livraisonAjouteePourCoursier?.intersection) {
      // ajouter la livraison à l'itinéraire (grâce à l'index de la livraison et du coursier)
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

      // Récupération de l'itinéraire du coursier
      const itineraireCoursier = nouveauxItineraires[livraisonAjouteePourCoursier.numeroCoursier];
      itineraireCoursier.livraisons.livraisons.splice(livraisonAjouteePourCoursier.indexLivraison + 1, 0, livraiseAAjouter);

      onChangementItineraires(nouveauxItineraires);
      miseAJourPlusCourtCheminAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livraisonAjouteePourCoursier]);

  useEffect(() => {
    if (itineraires.length > 0) {
      // Récupérer toutes les adresses des itinéraires
      const adressesDesItineraires = new Set(
        itineraires.flatMap(itineraire =>
          itineraire.livraisons.livraisons
            .map(livraison => livraison.intersection.id)
        )
      );
      //Trouve l'id de l'entrepôt
      const idEntrepot = adressesDesItineraires.values().next().value;

      // Mettre à jour adressesLivraisonsXml et ajouter les nouvelles adresses
      setAdressesLivraisonsXml(prev => {
        // Filtrer les adresses qui ne sont plus dans les itinéraires
        const adressesExistantes = prev.filter(adresse =>
          adressesDesItineraires.has(adresse.id)
        );

        // Récupérer toutes les nouvelles adresses des itinéraires
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraires])

  const gererClicLivraison = (livraison: any) => {
    // Zoomer vers la position de la livraison
    zoomerVersPoint(livraison.intersection.latitude, livraison.intersection.longitude);
  };

  const deplacerLivraison = (indexCoursier: number, indexLivraison: number, direction: 'up' | 'down') => {
    const nouveauxItineraires = deepCopy(itineraires);
    const livraisons = nouveauxItineraires[indexCoursier].livraisons.livraisons;

    // Ne pas déplacer l'entrepôt ou si on essaie de sortir des limites
    if (indexLivraison <= 0 || indexLivraison >= livraisons.length - 1) return;
    if ((direction === 'up' && indexLivraison <= 1) ||
      (direction === 'down' && indexLivraison >= livraisons.length - 2)) return;

    const nouvelIndex = direction === 'up' ? indexLivraison - 1 : indexLivraison + 1;

    // Sauvegarder l'état actuel dans l'historique
    avantMiseAJourItineraires();

    // Échanger les positions
    [livraisons[indexLivraison], livraisons[nouvelIndex]] =
      [livraisons[nouvelIndex], livraisons[indexLivraison]];

    // Mettre à jour directement via l'API plutôt que de passer par onChangementItineraires
    miseAJourPlusCourtCheminAPI(nouveauxItineraires);
  };

  // fonction permettant de créer une clé unique pour chaque livraison
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
          onClick={genererFichesRoutes}
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
                              disabled={indexLivraison <= 1}
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
                              disabled={indexLivraison >= itineraire.livraisons.livraisons.length - 2}
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
                            >
                              <DeleteIcon color="error" />
                            </IconButton>
                          )}
                          {!estDernierEntrepot && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                ajouterLivraison(indexCoursier, indexLivraison);
                              }}
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
    </Box>
  );
};

export default GestionnaireItineraire;
