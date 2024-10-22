import {Form} from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;

export async function enregistrerCarte(etat : string, file : File | null, filepath?: string): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("file", file);
            const formData = new FormData();
            formData.append("etat", etat);
            if (file) {
                formData.append("fichier", file);
            }
            if (filepath) {
                formData.append("cheminVersFichier", filepath);
            }
            
            const req = await fetch(`http://localhost:8080/carte/charger  `, {
                method: "POST",
                body : formData
            });

            // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
            if (!req.ok) {
                const result = await req.json();
                return reject(result);  // Typiquement ici on utilise return pour quitter l'exécution
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
