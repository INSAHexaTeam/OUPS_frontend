# OUPS_backend
Organisation Urbaine Pour les Services backend

## Description  

Cette application est conçue pour optimiser les itinéraires de livraison urbains à vélo, favorisant ainsi une mobilité plus durable dans les villes. Les utilisateurs téléchargent un fichier XML décrivant le plan de la ville, avec des informations sur les intersections et les segments de route. Les livreurs démarrent leurs tournées depuis l’entrepôt principal. 

L'application permet de gérer les demandes de livraison, de les attribuer à différents livreurs et de calculer l'itinéraire optimal, en tenant compte des délais de collecte et de livraison et d'une vitesse constante de 15 km/h. Les itinéraires sont optimisés pour réduire le temps total de retour à l’entrepôt. L'utilisateur peut visualiser les itinéraires sur une carte interactive et a la possibilité de sauvegarder ou de restaurer les itinéraires planifiés. 

## Algorithme 

L'application représente les différentes intersections de la ville sous forme d'un graphe afin de pouvoir calculer les itinéraires de livraison sous forme de sous-graphiques. Chaque intersection est modélisée comme un nœud et chaque segment de route comme un arc entre deux nœuds.   

Le calcul des itinéraires s'effectue en deux phases. Tout d’abord, le graphique des chemins les plus courts est généré à partir des points de collecte et de livraison et du plan de la ville. Ce graphique orienté comprend un nœud pour chaque point d'intérêt. Dans la deuxième phase, le problème du voyageur de commerce (TSP) est résolu, déterminant l'ordre optimal pour minimiser le temps total du parcours. Cet algorithme doit satisfaire aux contraintes de préséance entre les points de retrait et de livraison. Pour la résolution, des algorithmes exacts et heuristiques peuvent être utilisés, qui offrent des solutions approximatives avec une plus grande efficacité. 

## Technologies 

Le projet utilisera React pour le front-end, choisi pour sa fluidité, son routage dynamique et sa large communauté. Pour le back-end, le framework Java Spring Boot a été retenu pour sa compatibilité avec Java, ses serveurs web embarqués, et sa facilité d'intégration des dépendances. 

L'architecture générale repose sur une application web qui effectue des requêtes HTTP vers une API, laquelle récupère ses données depuis des fichiers XML. Cette approche garantit une indépendance totale entre les différents services, facilitant ainsi la collaboration et la maintenabilité du projet. 
