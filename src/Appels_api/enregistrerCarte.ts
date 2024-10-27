export async function enregistrerCarte(etat : string, file : File | null): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try {
            let cheminVersFichier : string;
            if(file && file.name){
                cheminVersFichier = file.name;
            }else{
                resolve({ message: "Fichier non trouvé", data: new Blob() });
            }
            const requestParams : string = `?cheminVersFichier=${cheminVersFichier}&etat=${etat}`;
            const req = await fetch(`http://localhost:8080/carte/charger${requestParams}`, {
                method: "POST"
            });

            // Si la réponse n'est pas OK, on gère les erreurs (s'il y a des erreurs)
            if (!req.ok) {
                const result = await req.json();
                return reject(result);
            }

            // La réponse est un blob (CSV), donc on retourne le blob directement
            const resp = await req.json();
            console.log("resp", resp);
            if (resp.intersections.length === 0) {
                reject("Veuillez charger un fichier valide");
            }
            resolve({ message: "Données téléchargées", data: resp });
        } catch (error: any) {
            // Gestion des erreurs
            console?.log("error", error);
            reject(error.message);
        }
    });
}