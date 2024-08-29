# Pipeline analytics

La pipeline fonctionne en mode ELT (Extract, Load, Transform) et est composée de 4 jobs :
1. [0-dump-for-analytics.job.ts](..%2Fsrc%2Fapplication%2Fjobs%2Fanalytics%2F0-dump-for-analytics.job.ts)
2. [1-charger-les-evenements.job.ts](..%2Fsrc%2Fapplication%2Fjobs%2Fanalytics%2F1-charger-les-evenements.job.ts)
3. [2-enrichir-les-evenements.job.ts](..%2Fsrc%2Fapplication%2Fjobs%2Fanalytics%2F2-enrichir-les-evenements.job.ts)
4. [3-charger-les-vues.job.ts](..%2Fsrc%2Fapplication%2Fjobs%2Fanalytics%2F3-charger-les-vues.job.ts)

## Ordonnancement
- Le premier job de la pipeline est lancé via un **cron** dans le worker.
- A l'issue du job, un nouveau job est créé dans le worker pour l'étape charger les événements.
- A l'issue du job, un nouveau job est créé dans le worker pour l'étape enrichir les événements.
- Lorsque le jour de la semaine est un **lundi**, un nouveau job est créé dans le worker pour l'étape charger les vues.

## Que font les jobs ?
### 0-dump-for-analytics.job.ts
Basiquement un gros pg_dump pg_restore de la DB de prod vers celle d'analytics. En excluant les tables de logs et d'événements d'engagement.

### 1-charger-les-evenements.job.ts
Chargement des événements d'engagement de la prod qui ne sont pas présent dans analytics. En gros les événements de la journée.
Technique utilisée : COPY FROM / TO de postgresql en passant par un stream node

### 2-enrichir-les-evenements.job.ts
Afin de facilité l'exploratoire et le reporting, on enrichit les données ajoutées de la journée.
- mise à jour du schéma des événements d'engagement d'analytics pour ajouter les colonnes des champs enrichis. ATTENTION : il n'y a pas de système de migration, c'est un peu manuel et ça doit être idempotent.
- enrichissement des données ajoutées de la journée

Les champs rajoutés sont :
- semaine de l'événement - car quasi toutes les analyses sont faites à la semaines
- jour de l'événement - utilisé pour la notion d'utilisateur actif dans la vue engagement
- agence/département/région utilisés pour les et pour l'exploratoire

### 3-charger-les-vues.job.ts
Afin d'avoir des dashboards qui répondent vite, on fait des calculs d'indicateurs aggrégés par Semaine/Structure/Type d'utilisateur/Géographie
- mise à jour des schémas des tables pour l'analytics
- chargement des données de la semaine précédente 

**_analytics_fonctionnalites_**
Détaille l'utilisation des fonctionnalités aux mailles :
- categorie-action-nom-structure-type-utilisateur-semaine
- categorie-action-structure-type-utilisateur-semaine
- categorie-structure-type-utilisateur-semaine

Pour cette maille les indicateurs suivants sont calculés :
- nombre d'EE
- nombre d'utilisateurs

**_analytics_engagement_**
Détaille l'engagement des utilisateurs aux mailles :
- structure-type_utilisateur-semaine-departement-region

Pour cette maille les indicateurs suivants sont calculés :
- nombre d'utilisateurs ayant au moins un événement dans les deux derniers mois
- nombre d'utilisateurs ayant au moins 2 événements dans la semaine (**actif**)
- nombre d'utilisateurs ayant été actifs au moins 3 semaines sur les 6 dernières semaines
- nombre d'utilisateurs ayant été actifs au moins 4 semaines sur les 6 dernières semaines

**_analytics_engagement_national**
Détaille l'engagement des utilisateurs aux mailles :
- structure-type_utilisateur-semaine
Le retrait des niveaux departement-region permet d'avoir des chiffres exacts à l'échelle nationale.

Les indicateurs sont les mêmes que pour la table analytics_engagement
