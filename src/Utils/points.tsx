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
    voisins: Voisin[];
}