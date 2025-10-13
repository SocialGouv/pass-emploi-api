# Architecture pass-emploi-api

> Ce document n’a pas vocation à être exhaustif ni parfaitement à jour.  
> Il sert surtout de support pour comprendre certaines parties clés de pass-emploi-api.
    
---  
## Vue d’ensemble

Le dépôt **pass-emploi-api** est le **backend**/**API** de l’application Pass Emploi/CEJ, à destination  
du [frontend](https://github.com/France-Travail/pass-emploi-web)  
et de l'[application mobile](https://github.com/France-Travail/pass_emploi_app).

Rappel de l'architecture globale :

[![Architecture applicative globale](./diagrammes/archi-globale.svg)](https://www.tldraw.com/f/ViYN1onXLAK_V8ICbOpUX?d=v-856.-785.3344.1944.-mfGc0_3IOGzO2P-Y1Hwh)

### Composants principaux
#### Composant applicatifs
| Nom composant      | Technos                         | Lien repo                                          |  
|--------------------|---------------------------------|----------------------------------------------------|  
| Backend (API)      | Node.js / Typescript / NestJS   | https://github.com/France-Travail/pass-emploi-api  |  
| Worker             | Node.js / Typescript / Bull     | https://github.com/France-Travail/pass-emploi-api  |  
| Frontend (App web) | React.js / Typescript / Next.js | https://github.com/France-Travail/pass-emploi-web  |  
| Auth               | Node.js / Typescript / NestJS   | https://github.com/France-Travail/pass-emploi-auth |  
| App mobile         | Flutter / Dart                  | https://github.com/France-Travail/pass_emploi_app  |  

todo: https://github.com/France-Travail/pass-emploi-connect ?

#### Composants techniques
| Nom composant                                          | Technos / Plateforme | Rôle                                                                     |  
|--------------------------------------------------------|----------------------|--------------------------------------------------------------------------|  
| Base de données SQL                                    | PostgreSQL           | Stockage données métiers                                                 |  
| Base de données NoSQL                                  | Redis                | [Gestion des jobs](./CONTRIBUTING.md/)                                   |  
| S3                                                     | OVH                  | Stockage des pièces-jointes                                              |  
| API Antivirus                                          | Jecliqueoupas        | Antivirus                                                                |  
| APIs partenaires externes (France Travail, MILO, etc.) |                      | Récupération/création de dossier, etc.                                   |  
| Cloud Firestore, Cloud Messaging                       | Firebase             | Envoi de notifications app mobile, stockage de données pour l'app mobile |  
  
--- 

## Architecture applicative API

Pour décrire une application utilisant **architecture hexagonale**, **CQS** (Command Query Separation) et **DDD** (Domain-Driven Design) dans un README, voici une structure claire et concise :

---

## Architecture
L'API **pass-emploi-api** est construite selon les principes suivants :

### 🏛️ Architecture Hexagonale (Ports & Adapters)
L'[architecture hexagonale](https://alistair.cockburn.us/hexagonal-architecture) permet d'isoler la logique métier des détails techniques (bases de données, APIs externes, frameworks).

[Architecture applicative du backend (API)](./diagrammes/archi-code.png)

### ⚡ CQS - Command Query Separation
Les opérations sont strictement séparées en deux catégories :

- **Commands** : Modifient l'état du système (créer, modifier, supprimer)
    - Exécutées par des `CommandHandlers`
    - Ne retournent généralement pas de données métier
    - Exemple : `NotifierNouvellesImmersionsCommandHandler`, `DeleteRechercheCommandHandler`

- **Queries** : Lisent l'état sans le modifier
    - Exécutées par des `QueryHandlers`
    - Retournent des données
    - Exemple : `GetJeunesByConseillerQuery`, `GetDetailRendezVousJeuneQueryHandler`

### 📚 DDD - Domain-Driven Design
Le code est organisé autour du **domaine métier** :

#### Ubiquitous Language
Le code utilise le vocabulaire métier (Jeune, Conseiller, Rendez-vous, Action, etc.), partagé entre développeurs et experts métier.

#### Bounded Contexts
Les différents contextes métier sont clairement délimités :
- Gestion des jeunes et conseillers
- Gestion des rendez-vous
- Gestion des actions
- Notifications
- Authentification

### 📂 Organisation du code
```
src/
├── application/                # Couche Application (Cas d'usage)
│   ├── authorizers/              # Autorisation et contrôle d'accès
│   ├── commands/                 # Commands - Modification d'état
│   ├── jobs/                     # Jobs asynchrones (traités par le Worker)
│   ├── queries/                  # Queries - Lecture seule
│   ├── tasks/                    # Tâches ponctuelles (migrations, corrections)
│   ├── task.service.ts           # Service de gestion des tasks
│   └── worker.service.db.ts      # Service de gestion du worker (Bull/Redis)
├── building-blocks/            # Utilitaires transverses
├── config/                     # Configuration application
├── domain/                     # Cœur métier (Entities, Value Objects, Services)
├── fixtures/                   # Données de test
├── infrastructure/             # Adapters secondaires (SQL, APIs externes)
└── utils/                      # Utilitaires (DateService, etc.)
```

## Focus API : Jobs & Queues Asynchrones

Les jobs sont des tâches asynchrones exécutées en arrière-plan, indépendamment des requêtes HTTP de l'API. Ils permettent de :
- ⏰ Exécuter des traitements planifiés (cron jobs)
- 📬 Envoyer des notifications de rappel aux bénéficiaires
- 🧹 Nettoyer des données obsolètes
- 📊 Calculer des indicateurs métier
- ⚡ Déporter des traitements longs pour ne pas bloquer l'API

Exemples de jobs :
- NotifierRappelActionJob : Rappelle aux jeunes leurs actions à faire
- NettoyerPiecesJointesJob : Supprime les fichiers temporaires expirés
- CalculerIndicateursJob : Agrège les statistiques métier

### 🏗️ Architecture des jobs
Le code des jobs se trouve dans le même dépôt que l'API (`src/application/jobs/`), mais leur exécution est assurée par un composant séparé : le **Worker**.
```
┌─────────────────────────────────────────────────────────┐
│                    pass-emploi-api (repo)               │
│                                                         │
│  ┌────────────────┐              ┌──────────────────┐  │
│  │   API (NestJS) │              │  Worker (Bull)   │  │
│  │                │              │                  │  │
│  │  - Controllers │              │ - JobHandlers    │  │
│  │  - Commands    │              │ - Cron scheduler │  │
│  │  - Queries     │              │                  │  │
│  └────────┬───────┘              └────────┬─────────┘  │
│           │                               │            │
└───────────┼───────────────────────────────┼────────────┘
            │                               │
            │       ┌──────────────┐        │
            └──────►│ Redis (Bull) │◄───────┘
                    │   Job Queue  │
                    └──────────────┘
```
Composants :
- **API** : Crée et planifie les jobs (enqueue)
- **Redis + Bull** : Gère la file d'attente des jobs
- **Worker** : Récupère et exécute les jobs

### 🔄 Cycle de vie d'un job
#### 1. Création du job (depuis le backend)
```typescript
// Exemple : créer un job depuis un CommandHandler
await this.planificateurService.creerJob({
  type: 'NOTIFIER_RAPPEL_ACTION',
  contenu: { idJeune: '123', idAction: '456' },
  dateExecution: DateTime.now().plus({ hours: 24 })
})
```

#### 2. Stockage dans Redis
Bull enregistre le job dans Redis avec :
- Son type (ex: NOTIFIER_RAPPEL_ACTION)
- Ses données (contenu)
- Sa planification (dateExecution)
- Son statut (waiting, active, completed, failed)

#### 3. Récupération par le Worker
Le Worker interroge régulièrement Redis pour récupérer les jobs en attente.

#### 4. Exécution du job
Le Worker trouve le JobHandler correspondant au type de job et l'exécute.
```typescript
// Exemple de JobHandler
@Injectable()
export class NotifierRappelActionJobHandler {
  async handle(job: Job<NotifierRappelActionJobData>): Promise<void> {
    const { idJeune, idAction } = job.data
    // Logique : envoyer une notification push
  }
}
```

#### 5. Mise à jour du statut
Le Worker met à jour le statut du job dans Redis :
✅ completed si succès
❌ failed si erreur (avec retry automatique si configuré)

### Comment ajouter un nouveau job ?
#### Étape 1 : Créer le JobHandler
Créez un fichier dans `src/application/jobs/`
```typescript
// src/application/jobs/mon-nouveau-job.job-handler.ts
import { Injectable } from '@nestjs/common'
import { Job } from 'bull'

export interface MonNouveauJobData {
  idUtilisateur: string
  parametreX: string
}

@Injectable()
export class MonNouveauJobHandler {
  constructor(
    // Injecter les dépendances nécessaires
    private readonly monService: MonService
  ) {}

  async handle(job: Job<MonNouveauJobData>): Promise<void> {
    const { idUtilisateur, parametreX } = job.data
    
    // Logique du job
    await this.monService.faireQuelqueChose(idUtilisateur, parametreX)
  }
}
```

#### Étape 2 : Enregistrer le JobHandler
Ajoutez le handler au service Worker (`src/application/worker.service.db.ts`) :
```typescript
// ... existing code ...

this.jobQueue.process('MON_NOUVEAU_JOB', async (job) => {
  await this.monNouveauJobHandler.handle(job)
})

// ... existing code ...
```

#### Étape 3 : Créer le job depuis le backend
Utilisez le PlanificateurService pour créer le job :
```typescript
// Dans un CommandHandler ou un service
await this.planificateurService.creerJob({
  type: 'MON_NOUVEAU_JOB',
  contenu: {
    idUtilisateur: '123',
    parametreX: 'valeur'
  },
  dateExecution: DateTime.now().plus({ hours: 1 }) // Optionnel
})
```

#### Étape 4 : (Optionnel) Planifier un cron
Si le job doit s'exécuter **régulièrement** (ex : tous les jours à 9h) :
Ajoutez la configuration dans `src/domain/planificateur.ts` :
``` typescript
export const CRONS = {
  MON_NOUVEAU_JOB: {
    expression: '0 9 * * *', // Tous les jours à 9h (format cron)
    type: 'MON_NOUVEAU_JOB',
    contenu: {}
  }
}
```

Après déploiement, initialisez les crons sur chaque environnement :
``` bash
# Staging
scalingo --region osc-secnum-fr1 -a pa-back-staging run yarn tasks
# Choisir : initialiser-les-crons

# Production
scalingo --region osc-secnum-fr1 -a pa-back-prod run yarn tasks
# Choisir : initialiser-les-crons
```

### 🔍 Monitoring et debugging
Voir les jobs en cours
Les jobs sont visibles dans Redis. Vous pouvez utiliser un client Redis ou consulter les logs du Worker.

#### Logs du Worker
Les logs du Worker sont séparés de ceux de l'API sur Scalingo :
``` bash
scalingo --region osc-secnum-fr1 -a pa-back-staging logs --filter worker
```

#### Retry automatique
Bull gère automatiquement les tentatives de retry en cas d'erreur (configurable).

#### Suivi en base
Le domaine `suivi-job.ts` peut être utilisé pour tracer l'exécution des jobs critiques en base de données.
 
### 📚 Ressources
Documentation Bull : https://github.com/OptimalBits/bull
Format cron : https://crontab.guru/

---
## Flux de données

*(Description simple de comment les données circulent entre les briques principales.)*
---    
## Points d’attention

- Parties critiques à connaître pour contribuer sans tout casser.
- Choix techniques importants (ex: pourquoi tel broker de messages).
- Limites connues.

---    
## Aller plus loin

- [README.md](../README.md) pour l’installation et le démarrage.
- [CONTRIBUTING.md](../CONTRIBUTING.md) pour les bonnes pratiques de contribution.
- Documentation externe (si applicable).