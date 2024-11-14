export async function enregistrerLivraisons(etat: string, fichier: File | null, cheminFichier?: string): Promise<{ message: string, data: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("etat", etat);
      if (fichier) {
        formData.append("fichier", fichier);
      }
      if (cheminFichier) {
        formData.append("cheminVersFichier", cheminFichier);
      }

      const req = await fetch(`http://localhost:8080/carte/livraisons`, {
        method: "POST",
        body: formData
      });

      // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
      if (!req.ok) {
        const resultat = await req.json();
        return reject(resultat);
      }

      const resp = await req.json();
      resolve({ message: "Données téléchargées", data: resp });

    } catch (error: any) {
      reject(error.message);
    }
  });
}
