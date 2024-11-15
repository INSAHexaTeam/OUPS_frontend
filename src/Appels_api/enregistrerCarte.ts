export async function enregistrerCarte(etat: string, fichier: File | null): Promise<{ message: string, data: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      let cheminVersFichier: string;
      if (fichier && fichier.name) {
        cheminVersFichier = fichier.name;
      } else {
        resolve({ message: "Fichier non trouvé", data: new Blob() });
      }
      const parametresRequete: string = `?cheminVersFichier=${cheminVersFichier}&etat=${etat}`;
      const req = await fetch(`http://localhost:8080/carte/charger${parametresRequete}`, {
        method: "POST"
      });

      // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
      if (!req.ok) {
        const resultat = await req.json();
        return reject(resultat);
      }

      const resp = await req.json();
      if (resp.intersections.length === 0) {
        reject("Veuillez charger un fichier valide");
      }
      resolve({ message: "Données téléchargées", data: resp });
    } catch (error: any) {
      reject(error.message);
    }
  });
}
