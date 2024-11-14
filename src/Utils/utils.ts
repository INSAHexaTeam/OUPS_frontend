export const definirAdressesSelonVoisins = (point: any) => {
  let adresse;
  if (point.voisins.length >= 2) {
    const premierNonVide = point.voisins[0].nomRue !== '' ? point.voisins[0].nomRue : null;
    const deuxiemeNonVide = point.voisins[1].nomRue !== '' ? point.voisins[1].nomRue : null;
    if (premierNonVide && deuxiemeNonVide) {
      adresse = `${premierNonVide} - ${deuxiemeNonVide}`;
    } else if (premierNonVide) {
      adresse = premierNonVide;
    } else if (deuxiemeNonVide) {
      adresse = deuxiemeNonVide;
    } else {
      // Si les deux noms de rues sont vides on prend le premier voisin non vide après
      const voisinNonVide = point.voisins.find((voisin: any) => voisin.nomRue !== '');
      adresse = voisinNonVide ? voisinNonVide.nomRue : 'pas définie';
    }
  } else if (point.voisins.length === 1) {
    adresse = point.voisins[0].nomRue !== '' ? point.voisins[0].nomRue : 'pas définie';
  } else {
    adresse = 'pas définie';
  }
  return adresse;
};
