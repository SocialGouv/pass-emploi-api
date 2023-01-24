## POST MORTEM

### Date
24 Janvier 2023

### Auteurs
Joseph Robert   

### Status
Brouillon

### Résumé
Le 23 janvier nous avons noté entre 17h15 et 17h30 :
- de nombreuses erreurs 500 sur toutes sortes d'endpoints avec souvent en erreur _ConnectionAcquireTimeoutError_
- des requêtes sql qui mettent plusieurs minutes à s'exécuter

Ce problème avait été vu le 19 janvier et nous avions augmenté la mémoire de la DB.

### Impacts
Pendant 5 minutes (17h15-17h20) :
- le temps de réponse moyen était de 6 secondes, ce qui a eu un impact sur l'expérience utilisateur.
- 20% des requêtes ont échoué.
- A 17h16 nous avons eu 50% de requêtes qui ont échoué
- Au total 270 sur 1620 requêtes ont échoué durant le pic

Durant 10 minutes (17h20-17h30) :
- le temps de réponse moyen était de 2 secondes, ce qui a eu un impact sur l'expérience utilisateur.
- la page des jeunes du conseiller pouvait mettre jusqu'à 2 minutes à s'afficher

### Root Causes
Durant le pic nous avons joué certaines des requêtes en DB pour récupérer les jeunes d'un conseiller.
Résultat :
- quand on fait une jointure sur les événements d'engagement : 1 minute
- quand on ne fait pas la jointure : 0.5 secondes

Ce que nous pressentons :
- il y a 13 millions d'événements d'engagement en DB
- il y a 5 index sur la table
- cela veut dire que lors des pics d'utilisation il y a une concurrence forte écriture/lecture sur la table
- les recalculs des index sont très longs et bloquent la mémoire du PG

### Trigger
Un pic d'utilisation de l'application

### Résolution
Le problème s'est autorésolu lorsque postgre a retrouvé de la ressource. Cependant nous avons pris des actions pour limiter l'apparition de ces pics.

- on a modifié la requête de la liste des jeunes pour utiliser la date d'actualisation du token plutôt que le dernier événement d'engagement
- on a modifié la requête pour les indicateurs du jeune :
  - sur la page détail du jeune on ne prend pas les indicateurs liés aux événements d'engagement (offres recherchées, partagées et favoris)
  - sur la page détaillée des indicateurs on les maintient

Cela permet de ne plus dépendre en lecture de la table événement d'engagement dans la très grande majorité des cas.

### Détection
L'alerting mattermost

### Actions
**Action 1 (mitigate): Pour rendre l'utilisation des événements d'engagement plus robuste**
- créer une table evenement_engagement_hebdomadaire qui contient uniquement les événements d'engagement des 7 derniers jours
- créer un index sur cette table sur l'id utilisateur uniquement
- supprimer les index de la table evenement_engagement qui coutent de la ram

Statut : to do

**Action 2 (detect) : se rendre compte de l'utilisation de la ram du postgre**
Proposition :
- créer un script qui dump la DB de prod anonymisée
- la déployer hebdomadairement sur une review app
- lancer des tirs de perfs avec gatling pour simuler un pic d'utilisation
- mesurer temps de réponse, taux d'échecs et consommation de ram du postgres

Statut : to debatre