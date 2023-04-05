## Tester les API Pôle Emploi
- Identifiants Postman du compte partagé sur Dashlane
- Se positionner sur Postman dans le workspace Pass Emploi au dossier 2. Pôle Emploi
- Ajouter les API sur l'espace recette dans l'onglet En espace libre (url production on verra après pour ajouter)
- Ajouter les scopes s'il y en a de nouveaux à ajouter de l'API en question sur Keycloak Staging dans l'onglet Identity Provider > pe-jeune
- Pour les développements ils seront à ajouter sur Terraform

## Générer un access token PE jeune
- Sur postman, dans le workspaces "pass emploi" on se situe dans le dossier 2. Pôle Emploi > PE connect
- Récupérer le bearer en se connectant avec le jeune PE de recette sur l'API staging (PE connect Jeune)
- Si l'ajout du scope a bien fonctionné on a un consentement à valider
- Se positionnner sur la route POST Exchange token et remplacer dans le champ subject_token dans le body de la requête par le bearer
- Envoyer la requête et récupérer l'access token du jeune. 

On peut maintenant tester les API avec un token Pôle Emploi valide.