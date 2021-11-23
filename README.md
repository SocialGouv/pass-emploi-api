## Pré-requis
- Node 16.13.0
- Docker et docker-compose

## Configuration

Créez un nouveau fichier à la racine du projet et nommez le `.environment`. Copiez ensuite le contenu du fichier `.environment.template` et collez le dans votre nouveau fichier.

Allez sur l'application scalingo et choississez `pa-back-staging > Environment > switch to bulk edit`. Copiez tout les variables nécessaires dans `.environment`

## Lancement

Installez d'abord les dépendances:

```bash
yarn
```

Ensuite, lancez le serveur de dev:

```bash
yarn watch
```

Voilà! Ouvrez [http://localhost:5000/documentation](http://localhost:5000/documentation) sur votre navigateur.

## Tests

Lancer les tests

```bash
yarn test
```

## Tests avec l'IDE

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

## Lancer les seeds

```bash
yarn seed
```

## Créer une migration
    npx sequelize-cli migration:generate --name nom-de-la-migration

## Lancer les migrations
    npx sequelize-cli db:migrate

## Rollback la dernière migration
    npx sequelize-cli db:migrate:undo

***Pour ajouter des seeds, il faut aller dans le dossier src/infrastructure/sequelize/seeders***

## Déploiement

Nous utilisons actuellement Scalingo comme hébergeur sur l'application Web. Il existe deux environnements : Staging & Prod

### Environnement de staging

L'environnement de staging front correspond à l'application scalingo front `pa-back-staging`.

Cette application est branchée sur la branche `develop` du repo.
À chaque nouveau commit sur cette branche, un déploiement automatique sera lancé sur l'application.

Il est également possible de déployer manuellement en allant sur `pa-back-staging > Deploy > Manual deployments > Trigger deployment`

Les review apps sont activés sur cet environnement. Donc, à chaque nouvelle PR sur develop, une application temporaire au nom `pa-back-staging-pr[numéro de la PR sur github]` sera automatiquement créée. Cette application sera automatiquement détruite au merge de la PR.
Pour plus d'informations sur les review apps, vous pouvez voir [la doc scalingo](https://doc.scalingo.com/platform/app/review-apps)

### Environnement de prod

L'environnement de prod front correspond à l'application scalingo back `pa-back-prod`.

Cette application est branchée sur la branche `master` du repo.
À chaque nouveau commit sur cette branche, un déploiement automatique sera lancé sur l'application.

Il est également possible de déployer manuellement en allant sur `pa-back-prod > Deploy > Manual deployments > Trigger deployment`

Les review apps ne sont pas activés sur la prod.