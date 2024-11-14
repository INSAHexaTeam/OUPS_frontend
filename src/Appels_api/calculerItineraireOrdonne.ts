import { ItineraireOrdonne } from "../Utils/points";

export async function calculerItineraireOrdonne(itineraires: ItineraireOrdonne[]): Promise<{ message: string, data: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      const req = await fetch("http://localhost:8080/carte/calculerItineraireOrdonne", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(itineraires)
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
