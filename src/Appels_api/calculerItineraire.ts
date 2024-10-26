import {Intersection, Livraisons} from "../Utils/points";

const apiUrl = process.env.REACT_APP_API_URL;

export async function calculerItineraire(listeLivraisons : Livraisons): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try { //http://localhost:8080/carte/calculerItineraireCluster
            //http://localhost:8080/carte/calculerItineraireClusterOptimal
            const req = await fetch(`http://localhost:8080/carte/calculerItineraireClusterOptimal  `, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(listeLivraisons)
            });
           
            
            // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
            if (!req.ok) {
                const result = await req.json();
               
                return reject(result);  // Typiquement ici on utilise return pour quitter l'exécution
            }

            // La réponse est un blob (CSV), donc on retourne le blob directement
            const resp = await req.json();
            console.log("reqTournee", resp);
            resolve({ message: "Données téléchargées", data: resp });

        } catch (error: any) {
            // Gestion des erreurs
            reject(error.message);
        }
    });
}
