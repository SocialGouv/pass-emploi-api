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
- mise à jour du schéma des événements d'engagement d'analytics pour ajouter des champs précalculés
- enrichissement des données ajoutées de la journée

### 3-charger-les-vues.job.ts
Afin d'avoir des dashboards qui répondent vite, on fait des calculs d'indicateurs aggrégés par Semaine/Structure/Type d'utilisateur/Géographie
- mise à jour des schémas des tables pour l'analytics
- chargement des données de la semaine précédente 