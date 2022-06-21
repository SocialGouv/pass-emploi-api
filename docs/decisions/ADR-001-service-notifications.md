# [Harmonisation Domaine: Repository Service Factory]

* Statut : mergé
* Date : 2022-06-15

## Contexte et définition du problème

Les command handler portent dans certains cas trop de responsabilités. Ces classes devraient être des orchestrateurs de service et ne pas porter de logique métier lorsque celle-ci n'est pas directe (responsabilité du domaine). C'est le cas de l'envoi de notifications pour les manipulations de rendez-vous.

## Facteurs de Décision

* Rétablir de la cohérence concernant la responsabilité de la gestion des règles métiers
* Séparer les tests du handler et les tests des services orchestrés
* Obtenir un code plus générique / faciliter la réutilisation des services

## Résultat de la Décision

Le domaine porte la responsabilité à travers trois classes / interfaces :
- Domain.Repository : pour récupérer et persister les aggrégats
- Domain.Service : pour factoriser les règles métiers
- Domain.Factory : pour la création et le changement d'état des aggrégats

RendezVous.Service a la responsabilité de :
- porter les méthodes métiers sur l'envoi des notifications rendez-vous

Notification.Service a la responsabilité :
- notifier les jeunes pour l'envoi des notifications push
- notifier les conseillers par email

Notification.Factory a la responsabilité de :
- construire les notifications push à partir de données et templates

### Impacts Positifs

* Clarté de l'architecture : Les frontières des responsabilités sont mieux définies
* Générique : coût des modifications après refacto diminué
* Moins de redondance dans les tests
* Testabilité : Factory permet de tester le domaine sans prendre en compte le sql

### Impacts Négatifs

*La majorité des notifications sont simples, donc augmente la complexité de l'architecture pour quelques cas isolés

## Liens

* [Flux de l'envoi des notifications](https://excalidraw.com/#json=ddvUJrWdns_oJ6__GExXs,C0X_JaoaQI5lC0AunVrpBQ)
 