# Besoin

Chaque début de mois l'UNML communique à l'équipe déploiement un fichier contenant la liste des structures Mission Locale ainsi que le nombre de conseillers référencés pour chaque structure.

Ils nous demandent d'obtenir le nombre de conseillers utilisateurs de l'application de CEJ au cours des deux derniers mois.

# Solution

1. Convertir le fichier de l'UNML en Json et créer le fichier `referentiel_unml.json`
2. Récupérer les résultats de la requête Metabase et créer le fichier `structures_cej_avec_conseillers_utilisateurs.json`
   - https://stats.pass-emploi.beta.gouv.fr/question/407-nb-de-conseillers-milo-utilisateurs-dernier-ae-2-mois-par-structure
3. Exécuter le script
4. Convertir les résultats au format xlsx et l'envoyer à l'équipe déploiement
