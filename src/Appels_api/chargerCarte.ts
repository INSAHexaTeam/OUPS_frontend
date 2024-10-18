const apiUrl = process.env.REACT_APP_API_URL;

export async function charger_carte(filePath : string): Promise<{ message: string, data: Blob }> {
    return new Promise(async (resolve, reject) => {
        try {
            const req = await fetch(`http://localhost:8080/plan/charger?cheminFichier=${filePath}`, {
                method: "GET",
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
