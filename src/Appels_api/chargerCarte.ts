export async function charger_carte(cheminFichier: string): Promise<{ message: string, data: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      const req = await fetch(`http://localhost:8080/carte/charger?cheminVersFichier=${cheminFichier}&etat=CHARGEMENT  `, {
        method: "POST",
      });

      // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
      if (!req.ok) {
        const resultat = await req.json();
        return reject(resultat);  // Typiquement ici on utilise return pour quitter l'exécution
      }

      // La réponse est un blob (CSV), donc on retourne le blob directement
      const resp = await req.json();
      resolve({ message: "Données téléchargées", data: resp });

    } catch (error: any) {
      // Gestion des erreurs
      reject(error.message);
    }
  });
}
