# [titre du problème résolu et de sa solution]

* Statut: proposé
* Décideurs: team back
* Date: 2022-06-20

Ticket Trello / Notion:
- [Créer un deuxième compte jeune Milo avec le même sub id](https://www.notion.so/fabnummas/N-recr-e-un-deuxi-me-compte-jeune-milo-avec-le-m-me-sub-ID-f6b04167d1a94a14913342cad9949fff)
- [Modification de la création de jeune i-milo](https://www.notion.so/fabnummas/Modification-de-la-cr-ation-de-jeune-i-milo-a69e0cca67a54ab1a65e9beddc47a9fc)

## Contexte et Définition du Problème

- Découverte du problème
Citer des tickets support avec capture d'écran
1. Conseiller ML : Je ne peux pas Recréer un compte CEJ pour un jeune après l'avoir supprimé
   - pb support : page cej créa jeune : idDossier déjà associé à un compte
2. Jeune ML : Je n'arrive pas à faire ma première connexion à l'appli si le conseiller a modifié mon email i-milo
   - pb support : page keycloak jeune : utilisateur non trouvé ? ou compte non existant ?
Flux authent puml pur chaque problème

- Origine du problème
1. erreur mal gérée compte jeune déjà associé
2. source de vérité => mauvais mapping avec l'update

## Résultat de la Décision

Solution retenue:
- Branchement conditionnel pour le traitement de l'erreur "idDossier déjà associé à un compte jeune"
- Modification de la source de vérité à la première connexion email -> id-keycloak

### Impacts Positifs

* Décharge du support pour les tickets sur la double suppression CEJ / keycloak i-milo
* Documentation du flux sur une zone d'ombre pour une partie de l'équipe et le support

## Liens

<img src="../diagrammes/authentification-flux.svg">