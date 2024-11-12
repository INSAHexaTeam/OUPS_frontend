import {Intersection} from "./points";

// 0 pour ajouter, 1 pour supprimer, intersection pour l'adresse à ajouter ou supprimer, isEntrepot pour savoir si l'adresse est un entrepôt
export type Action = { type: 0 | 1, intersection: Intersection, isEntrepot: boolean };