## Pré-requis

- Docker et docker-compose

## Configuration

### Récupérer les variables d'environnement
1. Créer un fichier ```.environment``` en copiant le .environment.template
2. Mettre la valeur VAULT_ENV_VAULT_KEY indiquée sur Dashlane
3. Exécuter ```vault decrypt```

### Mettre à jour les variables d'environnement
1. Mettre à jour les variables désirées dans ```.vault/local.secret```
2. Exécuter ```vault decrypt```
3. Pousser sur git

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

**_Pour ajouter des seeds, il faut aller dans le dossier src/infrastructure/sequelize/seeders_**

## Lancer des tasks sur les environnements déployés

    scalingo --region ${MA_REGION} -a ${MON_APPLICATION} run yarn tasks

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

### Rollback

Il est possible de rollback une application Scalingo sur un commit donné (de la branche rattachée à l'application).

    git remote add scalingo git@ssh.${MA_REGION}.scalingo.com:${MON_APPLICATION}.git
    git push --force ${ID_COMMIT}:refs/heads/master
