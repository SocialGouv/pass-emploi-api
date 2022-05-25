# pass-emploi-api

## Overview

2e C du C4 model pour faire apparaitre le lien entre les services externes et les différents composants du projet.

## L'API

- [Swagger Staging](https://api.pass-emploi.incubateur.net/documentation/)
- [Swagger Prod](https://api.pass-emploi.beta.gouv.fr/documentation/)

[Suivi des routes](https://docs.google.com/spreadsheets/d/1B_wcz8itdTZFzeOxE3u8MEcTb95Vc-75PwiiuzbkREs/edit#gid=2092898073)

## Flux des commands / Queries

CQS sur [Excalidraw](https://excalidraw.com/#room=4db4fbe10b9b7d9d667b,tov9yp9Oz56KUMegq1LiAw)

## Flux des notifications push

[Excalidraw](https://excalidraw.com/#json=ddvUJrWdns_oJ6__GExXs,C0X_JaoaQI5lC0AunVrpBQ)
- Responsabilité : CommandHandler .handle
  - commandes directes : src/application/command (domaine.Service après refacto : voir adr service notif)
  - commandes planifiées : src/commands/jobs

- Quasiment identique pour l'envoi des mails.

## Clients
- SendInBlue (SIB) : API key sur scalingo
- pole-emploi.io : avoir les accès dashlane
- api milo ? a-t-on besoin de quelque chose?
- firebase ?

# Outils de tests
## Tests sur le Web
- [Page conseiller](https://web.pass-emploi.incubateur.net/)
- Avoir les identifiants partgés sur dashlane
## Tests sur l'App
- Télécharger CEJ-staging sur firebase
- création d'un compte jeune sur la BDD staging
# MEP

scalingo : Mail beta.gouv si on veut la prod et la région secnum !
- ajouter à la région outscale-secnum
  merge master iso à dev
  Onglet "Deploy" : Trigger deployment

- Gen clé privée et ajouter à scalingo
- firebase ?

# Support Prod

[Guide Notion & Planning](https://www.notion.so/fabnummas/Support-tech-c71a6222c7c54f8490060413c96471db)

## Ajouter la prod sur intellij
scalingo cli install

cle ssh, ajouter sur scalingo
- User settings
- pa back prod droits
- scalingo -> environment ajouter sur intellij

