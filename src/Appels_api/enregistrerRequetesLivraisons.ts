import toast from "react-hot-toast";

export async function enregistrerRequetesLivraisons(etat : string, fichier : File | null): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try {
            let cheminVersFichier : string;
            if(fichier && fichier.name){
                cheminVersFichier = fichier.name;
            }else{
                resolve({ message: "Fichier non trouvé", data: new Blob() });
            }
            const parametresRequete : string = `?cheminVersFichier=${cheminVersFichier}&etat=${etat}`;
            const req = await fetch(`http://localhost:8080/carte/livraisons${parametresRequete}`, {
                method: "POST"
            });
            
            
            if(req.status === 400) {
                const resultat = await req.json();
                let msgErreur = "Erreur lors de l'enregistrement de la requête";
                if(resultat.message == "Intersection non trouvée") {
                    msgErreur = "Les livraisons ne correspondent pas au plan chargé";
                }
                return reject(msgErreur);
            }
            
            // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
            if (!req.ok) {
                //const resultat = await req.json();
                console.log('erreur req : ',resultat.body);
                return reject(resultat);
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