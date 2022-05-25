# [Harmonisation Domaine: Repository Service Factory]

## Context and Problem Statement

Les command handler portent dans certains cas trop de responsabilités. Ces classes devraient être des orchestrateurs de service et ne pas porter de logique métier lorsque celle-ci n'est pas directe (responsabilité du domaine). C'est le cas de l'envoi de notifications pour les manipulations de rendez-vous.

## Decision Drivers

* Rétablir de la cohérence concernant la responsabilité de la gestion des règles métiers
* Séparer les tests du handler et les tests des services orchestrés
* Obtenir un code plus générique / faciliter la réutilisation des services

## Decision Outcome

Le domaine porte la responsabilité à travers trois classes / interfaces :
- Domain.Repository : pour manipuler les données
- Domain.Service : pour tous les traitements connexes
- Domain.Factory : pour la création d'objets

RendezVous.Service a la responsabilité de :
- porter les méthodes métiers pour le choix du type de notification à envoyer
- notifier les jeunes pour l'envoi des notifications push
- notifier les conseillers par email

Notification.Factory a la responsabilité de :
- construire les notifications push à partir de données et templates

Mail.Factory : idem pour les mails

### Positive Consequences

* Clarté de l'architecture : Les frontières des responsabilités sont mieux définies
* Générique : coût des modifications après refacto diminué

### Negative Consequences

*La majorité des notifications sont simples, donc augmente la complexité de l'architecture pour quelques cas isolés

## Links

* [Flux de l'envoi des notifications](https://excalidraw.com/#json=ddvUJrWdns_oJ6__GExXs,C0X_JaoaQI5lC0AunVrpBQ)
 