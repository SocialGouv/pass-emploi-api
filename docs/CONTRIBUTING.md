# pass-emploi-api

1. [Le contexte](#le-contexte)
   1. [Composants](#composants)
   2. [Services externes](#services-externes)
2. [Configurer l'environnement dev.](#config-dev-env)
   1. [Pré-requis](#pré-requis)
   2. [Récupérer les variables d'environnement](#pull-variables-environnement)
   3. [Mettre à jour les variables d'environnement](#push-variables-environnement)
   4. [Mettre à jour les dépendances](#dépendances)
   5. [Base de données, seeding et migrations](#database)
3. [L'architecture](#archi)
   1. [Flux des Commands / Queries](#CQS)
   2. [Flux des notifications](#notifications)
   3. [Les jobs et les crons](#jobs-cron)
   4. [Tests](#archi-tests)
4. [Développement de l'API](#API-develop)
   1. [Mode watch](#watch)
   2. [Présentation de la CI/CD staging](#cicd)
   3. [Tests unitaires et d'intégration automatisés](#unit-integration)
   4. [Tests fonctionnels et e2e non automatisés](#e2e)
   5. [Commits](#commits)
   6. [Pairing & Reviews](#reviews)
   7. [Rebasing](#rebasing)
5. [Déploiement de l'API](#API-deploy)
   1. [Configuration du compte scalingo](#scalingo-user) 
   2. [Environnement de staging](#staging)
   3. [Environnement de production](#production)
   4. [Rollback](#rollback)
   5. [Lancer des tasks sur les environnements déployés](#tasks)
6. [Style guide](#style-guide) 
7. [Troubleshoot](#troubleshoot)

## Le contexte <a name="le-contexte"></a>

<img src="diagrammes/pass-emploi.svg">

### Composants <a name="composants"></a>
- pass-emploi-auth : Keycloak
### Services externes <a name="services-externes"></a>
- SendInBlue (SIB) : Templates & Envois d'emails
- pole-emploi.io : avoir les accès dashlane
- api milo ? a-t-on besoin de quelque chose?
- firebase ?


## Configurer l'environnement dev. <a name="config-dev-env"></a>

### Pré-requis <a name="pré-requis"></a>
- Node 16.13.2
- Docker et docker-compose

### Récupérer les variables d'environnement <a name="pull-variables-environnement"></a>
1. Créer un fichier ```.environment``` en copiant le .environment.template
2. Mettre la valeur DOTVAULT_KEY indiquée sur Dashlane
3. Exécuter ```dotvault decrypt```

### Mettre à jour les variables d'environnement <a name="push-variables-environnement"></a>
1. Mettre à jour les variables désirées dans ```.environment``` entre les balises // BEGIN VAULT et //END VAULT
2. Exécuter ```dotvault encrypt```
3. Pousser sur git

### Mettre à jour les dépendances <a name="dépendances"></a>
```bash
yarn
```

### Base de données, seeding et migrations <a name="database"></a>
- Lancer les seeds :
```bash
yarn seed
```
**_Pour ajouter des seeds, il faut aller dans le dossier src/infrastructure/sequelize/seeders_**

- Créer une migration :
```bash
npx sequelize-cli migration:generate --name nom-de-la-migration
```
- Lancer les migrations
```bash
    npx sequelize-cli db:migrate
```
- Rollback la dernière migration
```bash
    npx sequelize-cli db:migrate:undo
```

## L'architecture <a name="archi"></a>

L'historique des décisions est consultable dans le dossier ```decisions```

### Flux des Commands / Queries <a name="CQS"></a>
- Clean archi / CQS sur [Excalidraw](https://excalidraw.com/#room=4db4fbe10b9b7d9d667b,tov9yp9Oz56KUMegq1LiAw)

### Flux des notifications push <a name="notifications"></a>
[Excalidraw](https://excalidraw.com/#json=ddvUJrWdns_oJ6__GExXs,C0X_JaoaQI5lC0AunVrpBQ)

### Les jobs et les crons <a name="jobs-cron"></a>
[Excalidraw](https://mattermost.incubateur.net/spie/pl/e3whbqramjfxtmp6d1nht4ddda)

Ne pas oublier, une fois la fonctionnalité merged, de lancer la task yarn `initialiser-les-crons` (à faire en recette et en prod)

### Tests <a name="archi-tests"></a>
Le runner de test est mocha, avec chai pour les assertions et sinon pour les mocks/stubs
- Controllers
  - On utilise l'utilitaire ***TestingModuleBuilder*** de NestJS pour monter l'application afin de tester les routes.
- Intégration avec la base de données
    - Lors du lancement des tests avec les bases de données PostgreSql et Redis, des images docker sont lancées.
    - Après chaque test, les données sont remises à 0
    - Afin d'avoir accès aux DB durant les tests, il faut nommer le fichier de test `*.db.test.ts`

*Les tests sans base de données sont lancés en parallèle pour aller plus vite, ceux ayant une adherence avec la base de données en série*


## Développement de l'API <a name="API-develop"></a>

### Mode watch <a name="watch"></a>
- Lancement en mode watch :
```bash
yarn watch
```
Consultez l'api sur : [http://localhost:5000/documentation](http://localhost:5000/documentation)

Le mode permet de lancer l'API swagger en mode observation. On peut coder les fonctionnalités et requêter les modifications faites à l'API sans avoir à relancer l'application.

### Présentation de la CI/CD staging <a name="cicd"></a>

Tout le code doit être testé pour pouvoir être mergé.
- hooks pre-commit
- lint
- tests
- sécurité
- review app

### Tests unitaires et d'intégration automatisés <a name="unit-integration"></a>

```bash
yarn test
```
- Tests avec l'IDE :

Pour lancer les tests avec votre IDE favori, il est nécessaire de lancer d'abord une base de données via le docker-compose.

```bash
yarn start:db:test
```

Ensuite on il faut exporter la variable DATABASE_URL.

```bash
export DATABASE_URL=postgresql://test:test@localhost:56432/test
```

Enfin on peut lancer les tests avec le script ci (qui ne lance pas de DB)

```bash
yarn test:ci
```

### Tests fonctionnels et e2e non automatisés <a name="e2e"></a>

- Staging Web, test des fonctionnalités conseiller :
    - [Page conseiller](https://web.pass-emploi.incubateur.net/)
    - Avoir les identifiants partagés sur dashlane

- Staging App, test des fonctionnalités jeune :
    - Télécharger CEJ-staging sur firebase
    - création d'un compte jeune sur la BDD staging

- Tests notifications push / email :
  - Reporter son pushToken de notre jeune staging sur un jeune de la bdd locale
  - Reporter son mail sur un conseiller de la bdd locale
  
### Commits <a name="commits"></a>
### Pairing & Reviews <a name="reviews"></a>
### Rebasing <a name="rebasing"></a>

## Déploiement de l'API <a name="API-deploy"></a>

Nous utilisons actuellement Scalingo comme hébergeur sur l'application Web. Il existe deux environnements : Staging & Prod

### Configuration du compte scalingo <a name="scalingo-user"></a>

Seul un email beta.gouv est compatible avec la prod et la région secnum !
1. Installer le cli scalingo
2. Ajouter sa clé ssh sur scalingo
    1. User settings > pa-back-prod droits
3. ajouter son compte à la région outscale-secnum (demande au chat support scalingo)
4. (pour support prod) ajouter sur intellij les informations de connexion à la base de données

### Environnement de staging <a name="staging"></a>

L'environnement de staging front correspond à l'application scalingo front `pa-back-staging`.

Cette application est branchée sur la branche `develop` du repo.
À chaque nouveau commit sur cette branche, un déploiement automatique sera lancé sur l'application.

Il est également possible de déployer manuellement en allant sur `pa-back-staging > Deploy > Manual deployments > Trigger deployment`

Les review apps sont activés sur cet environnement. Donc, à chaque nouvelle PR sur develop, une application temporaire au nom `pa-back-staging-pr[numéro de la PR sur github]` sera automatiquement créée. Cette application sera automatiquement détruite au merge de la PR.
Pour plus d'informations sur les review apps, vous pouvez voir [la doc scalingo](https://doc.scalingo.com/platform/app/review-apps)

### Environnement de production <a name="production"></a>

L'environnement de prod front correspond à l'application scalingo back `pa-back-prod`.

Cette application est branchée sur la branche `master` du repo.
Le déploiement automatique est désactivé : il faut alors aller sur scalingo et suivre les étapes suivantes `pa-back-prod > Deploy > Manual deployments > Trigger deployment`

Les review apps ne sont pas activées sur la prod.

#### Processus de release
1. Tagger la version sur le commit de develop que l'on veut déployer
2. Faire une MR de develop vers master et merger
3. Aller sur scalingo et déployer la version de master

### Rollback <a name="rollback"></a>

Il est possible de rollback une application Scalingo sur un tag donné (de la branche rattachée à l'application).

    git remote add scalingo git@ssh.${MA_REGION}.scalingo.com:${MON_APPLICATION}.git
    git push --force ${ID_COMMIT}:refs/heads/master

### Lancer des tasks sur les environnements déployés <a name="tasks"></a>

    scalingo --region ${MA_REGION} -a ${MON_APPLICATION} run yarn tasks

## Style guide <a name="style-guide"></a>

## Troubleshoot <a name="troubleshoot"></a>

Voir le fichier `TROUBLESHOOT.md` du même dossier.
