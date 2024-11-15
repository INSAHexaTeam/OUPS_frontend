export interface Point {
    id: number;
    long: number;
    lat: number;
}
export interface Voisin {
    nomRue: string;
    longueur: number;
}
export interface Intersection {
    id: number;
    latitude: number;
    longitude: number;
    adresse: string;
    voisins: Voisin[];
}

export interface Entrepot {
    heureDepart: string
    intersection: Intersection
}

export interface Livraisons {
    entrepot: Entrepot;
    livraisons: Intersection[];
    coursier: number;
}

export interface Itineraire {
    coursier: string;
    livraisons: Livraisons[];
    couleur?: string;
}

export interface ItineraireOrdonne {
    livraisons: {
        cheminIntersections: Intersection[];
        livraisons: Livraisons[];
    }
}