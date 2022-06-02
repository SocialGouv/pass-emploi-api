# CONTRIBUTING

## Tests
Tout le code doit être testé pour pouvoir être mergé.
Le runner de test est mocha, avec chai pour les assertions et sinon pour les mocks/stubs

### Controllers
On utilise l'utilitaire ***TestingModuleBuilder*** de NestJS pour monter l'application afin de tester les routes.

### Intégration avec la base de données
- Lors du lancement des tests avec les bases de données PostgreSql et Redis, des images docker sont lancées.
- Après chaque test, les données sont remises à 0
- Afin d'avoir accès aux DB durant les tests, il faut nommer le fichier de test `*.db.test.ts`

*Les tests sans base de données sont lancés en parallèle pour aller plus vite, ceux ayant une adherence avec la base de données en série*