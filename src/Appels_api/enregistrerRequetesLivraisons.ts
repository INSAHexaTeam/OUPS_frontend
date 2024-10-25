import toast from "react-hot-toast";

export async function enregistrerRequetesLivraisons(etat : string, file : File | null): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try {
            let cheminVersFichier : string;
            if(file && file.name){
                cheminVersFichier = file.name;
            }else{
                resolve({ message: "Fichier non trouvé", data: new Blob() });
            }
            const requestParams : string = `?cheminVersFichier=${cheminVersFichier}&etat=${etat}`;
            const req = await fetch(`http://localhost:8080/carte/livraisons${requestParams}`, {
                method: "POST"
            });
            
            
            if(req.status === 400) {
                const result = await req.json();
                let msgError = "Erreur lors de l'enregistrement de la requête";
                if(result.message == "Intersection non trouvée") {
                    msgError = "Les livraisons ne correspondent pas au plan chargé";
                }
                return reject(msgError);
            }
            
            // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
            if (!req.ok) {
                //const result = await req.json();
                console.log('error req : ',result.body);
                return reject(result);
            }

            // La réponse est un blob (CSV), donc on retourne le blob directement
            const resp = await req.json();
            resolve({ message: "Données téléchargées", data: resp });
        } catch (error: any) {
            // Gestion des erreurs
            reject(error);
        }
    });
}