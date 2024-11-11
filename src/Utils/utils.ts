export const definirAdressesSelonVoisins = (point: any) => {
    let adresse;
    if (point.voisins.length >= 2) {
        const firstNonEmpty = point.voisins[0].nomRue !== '' ? point.voisins[0].nomRue : null;
        const secondNonEmpty = point.voisins[1].nomRue !== '' ? point.voisins[1].nomRue : null;
        if (firstNonEmpty && secondNonEmpty) {
            adresse = `${firstNonEmpty} - ${secondNonEmpty}`;
        } else if (firstNonEmpty) {
            adresse = firstNonEmpty;
        } else if (secondNonEmpty) {
            adresse = secondNonEmpty;
        } else {
            // Si les deux noms de rues sont vides on prend le premier voisin non vide après
            const nonEmptyVoisin = point.voisins.find((voisin: any) => voisin.nomRue !== '');
            adresse = nonEmptyVoisin ? nonEmptyVoisin.nomRue : 'pas définie';
        }
    } else if (point.voisins.length === 1) {
        adresse = point.voisins[0].nomRue !== '' ? point.voisins[0].nomRue : 'pas définie';
    } else {
        adresse = 'pas définie';
    }
    return adresse;
};