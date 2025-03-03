## Lancer l'app

### Pré-requis <a name="pré-requis"></a>

- Node 22.14.0
- Docker et docker compose
- Lancer `yarn`

### Récupérer les variables d'environnement

Le fichier d'env est chiffré et versionné

1. Créer un fichier `.environment` en copiant le `.environment.template`
2. Mettre la valeur `DOTVAULT_KEY` indiquée sur **Dashlane**
3. Exécuter `dotvault decrypt`
4. **Ajouter/Modifier** les vars d'env : `dotvault encrypt`

### Lancer l'application

- `yarn watch`

### METTRE EN PROD develop sur master

Depuis le local directement (**non recommandé**) : `yarn release:<level: patch | minor | major>:push`

Depuis `develop` :

1. Se positionner sur la branche `develop` et pull
2. Faire une nouvelle release `yarn release:<level: patch | minor | major>`
3. `git push --tags`
4. `git push origin develop`
5. OPTIONNEL : Créer la PR depuis `develop` sur `master` (pour vérifier les changements)
6. Se positionner sur `master` et pull
7. `git merge develop` sur `master`
8. `git push` sur `master`

Mettre en PROD un **HOTFIX** : faire une nouvelle version (`yarn release`) et un `cherry-pick`

## DATA MIGRATIONS

- En PROD : `scalingo -a pa-back-prod run 'DATABASE_URL=${DATABASE_URL} node scripts/data-migrations/<nom_migration.js>'`
- En LOCAL : `DATABASE_URL=postgresql://<user>:<mdp>@localhost:55432/passemploidb node scripts/data-migrations/<nom_migration.js>`

**EN détail :** voir [le CONTRIBUTING](docs/CONTRIBUTING.md)

## Liens utiles

- [Troubleshoot](docs/TROUBLESHOOT.md)
- [Guide Support Tech & Planning](https://www.notion.so/fabnummas/Support-tech-c71a6222c7c54f8490060413c96471db)
- [Swagger Staging](https://api.pass-emploi.incubateur.net/documentation/)
- [Swagger Prod](https://api.pass-emploi.beta.gouv.fr/documentation/)

## Flux d'authentification JEUNE

Le flux Milo a été revu sur à l'[ADR-002](docs/decisions/ADR-002-keycloak-creation-jeune-milo.md).

<img src="docs/diagrammes/authentification-flux-milo.svg">
<img src="docs/diagrammes/authentification-flux-pe.svg">
