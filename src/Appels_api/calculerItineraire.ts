import { Livraisons } from "../Utils/points";

export async function calculerItineraire(listeLivraisons: Livraisons): Promise<{ message: string, data: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      const req = await fetch("http://localhost:8080/carte/graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(listeLivraisons)
      });


      // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
      if (!req.ok) {
        const result = await req.json();
        return reject(result);
      }

      const resp = await req.json();
      resolve({ message: "Données téléchargées", data: resp });

    } catch (error: any) {
      reject(error.message);
    }
  });
}
