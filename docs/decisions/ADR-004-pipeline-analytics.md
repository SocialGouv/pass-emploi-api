# [Pipeline Analytics]

* Statut : brouillon
* Date : 2023-04-04

## Contexte

Pour analyser l'utilisation de l'application nous avons des traces d'événements d'engagement.
Afin de les analyser un dump total de la DB est fait tous les jours sur une base dédiée aux analytics.
Ensuite des dataviz sont faites avec metabase.

## Définition du problème
Le nombre d'événements d'engagement explose et génère :
- des dumps trop longs (plus de 20 minutes, ce qui ne tient pas dans une task)
- des requêtes SQL sur metabase qui sont trop longues et n'aboutissent pas dans beaucoup de cas

Comment faire en sorte de pouvoir s'assurer que dans un an ?
- la synchronisation entre la base de production et d'analytics soit toujours viable
- les dashboards s'affichent en moins d'une minute
- l'exploratoire est toujours possible avec des temps de réponse raisonnables

## Résultat de la Décision

Mettre en place une pipeline de type ELT qui va :
1. faire un dump de toutes les tables de la prod sauf les tables de logs et d'événements d'engagement
2. faire un chargement itératif des événements d'engagement
3. enrichir les événements d'engagement avec les pré-calculs sur les dates et la géographie
4. générer des tables de vues pour les dashboards qui vont être enrichies chaque semaine avec les données aggrégées de la précédente


### Impacts Positifs
- Le temps d'éxécution de la pipeline est grandement diminué et maitrisable dans le temps
- Les dashboards qui s'appuient sur les données aggrégés ont un temps de réponse idéal

### Impacts Négatifs
- complexité de la pipeline à maintenir
- les requêtes pour les vues sont complexes et leur connaissance doit être partagée par les développeurs et les analyseurs

