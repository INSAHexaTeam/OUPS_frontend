import React, { useState } from 'react';

export default function Accueil() {
    const [xmlCarte, setXmlCarte] = useState(null);
    const [xmlDemande, setXmlDemande] = useState(null);
    const [message, setMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [carteValid, setCarteValid] = useState(false); // État pour la validation de la carte

    // Fonction pour lire un fichier XML
    const handleFileRead = (file, isCarte = false) => {
        if (file && file.type === 'text/xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (isCarte) {
                    setXmlCarte({ name: file.name, content: e.target.result, file });
                } else {
                    setXmlDemande({ name: file.name, content: e.target.result, file });
                }
                setMessage(null);
                setErrorMessage(null);
            };
            reader.onerror = () => {
                setErrorMessage('Erreur de lecture du fichier');
            };
            reader.readAsText(file);
        } else {
            setErrorMessage('Veuillez télécharger un fichier XML valide');
        }
    };

    const handleFileSelect = (event, isCarte = false) => {
        const file = event.target.files[0];
        handleFileRead(file, isCarte);
    };

    const handleFileDrop = (event, isCarte = false) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        handleFileRead(file, isCarte);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDeleteCarte = () => {
        setXmlCarte(null);
        setMessage('Votre fichier de carte a été supprimé avec succès');
        setCarteValid(false); // Réinitialiser la validation de la carte
    };

    const handleDeleteDemande = () => {
        setXmlDemande(null);
        setMessage('Votre fichier de demande a été supprimé avec succès');
    };

    // Fonction pour valider la carte avec une API
    const handleValidateCarte = async () => {
        if (!xmlCarte) {
            setErrorMessage('Veuillez charger un fichier de carte XML.');
            return;
        }

        const formData = new FormData();
        formData.append('carte', xmlCarte.file); // Envoyer le fichier de carte pour validation

        try {
            const response = await fetch('http://localhost:3000/validate-carte', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la validation de la carte');
            }

            const data = await response.json();
            setMessage('Carte validée avec succès');
            setCarteValid(true); // La carte est validée
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    // Fonction pour calculer l'itinéraire
    const handleCalculateItinerary = async () => {
        if (!xmlDemande || !xmlCarte) {
            setErrorMessage('Veuillez charger à la fois un fichier de carte et un fichier de demande.');
            return;
        }

        const formData = new FormData();
        formData.append('demande', xmlDemande.file); // Ajout du fichier de demande
        formData.append('carte', xmlCarte.file); // Ajout du fichier de carte

        try {
            const response = await fetch('http://localhost:3000/calcul-itineraire', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi de la requête');
            }

            const data = await response.json();
            setMessage(`Itinéraire calculé avec succès: ${data.result}`);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    return (
        <div>
            <h1>Accueil</h1>

            {/* Charger le fichier XML de la carte en premier */}
            <h2>Charger une carte XML</h2>
            <div
                onDrop={(event) => handleFileDrop(event, true)}
                onDragOver={handleDragOver}
                style={{
                    width: '300px',
                    height: '150px',
                    border: '2px dashed #aaa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}
            >
                <p>Glissez et déposez votre fichier carte ici</p>
            </div>
            <input
                type="file"
                accept=".xml"
                onChange={(event) => handleFileSelect(event, true)}
                style={{ marginBottom: '20px' }}
            />
            {xmlCarte && (
                <div>
                    <p>Fichier de carte chargé: {xmlCarte.name}</p>
                    <button onClick={handleDeleteCarte}>Supprimer la carte</button>
                    <button onClick={handleValidateCarte} style={{ marginLeft: '10px' }}>
                        Valider la carte
                    </button>
                </div>
            )}

            {/* Si la carte est validée, permettre de charger la demande */}
            {carteValid && (
                <>
                    <h2>Charger une demande XML</h2>
                    <div
                        onDrop={(event) => handleFileDrop(event, false)}
                        onDragOver={handleDragOver}
                        style={{
                            width: '300px',
                            height: '150px',
                            border: '2px dashed #aaa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <p>Glissez et déposez votre fichier demande ici</p>
                    </div>
                    <input
                        type="file"
                        accept=".xml"
                        onChange={(event) => handleFileSelect(event, false)}
                        style={{ marginBottom: '20px' }}
                    />
                    {xmlDemande && (
                        <div>
                            <p>Fichier de demande chargé: {xmlDemande.name}</p>
                            <button onClick={handleDeleteDemande}>Supprimer la demande</button>
                        </div>
                    )}

                    {/* Bouton pour calculer l'itinéraire après avoir chargé demande et carte */}
                    <button onClick={handleCalculateItinerary} style={{ marginTop: '20px' }}>
                        Calculer l'itinéraire
                    </button>
                </>
            )}

            {/* Affichage des messages */}
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
}
