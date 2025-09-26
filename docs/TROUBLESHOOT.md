# Troubleshoot

## Mes migrations ne sont pas rejouées dans les tests :(
Pas d'inquiétude, l'image docker pour la DB de test contient un volume.
Pour supprimer ce volume et rejouer les migrations depuis le début, simplement exécuter la commande suivante :

```
docker compose up --renew-anon-volumes -d pgtestdb 
```

## Je veux retrouver un job sur redis
Pas d'inquiétude, on a un cli pour ça

Créer un tunnel :
```bash
# Exemple pour la prod, sur la region secnumt
# SCALINGO_REDIS_URL peut être récupéré dans les variables d'env sur Scalingo
scalingo --region osc-secnum-fr1 -a pa-back-prod db-tunnel <SCALINGO_REDIS_URL>
```
Ensuite, se connecter via l'outil bull-repl, installé en tant que dépendance de dev dans ce projet
```bash
bull-repl
connect -u redis://username:password@localhost:10000 JobQueue
```
Exemple de requêtes :
```bash
delayed -q '[.root[] | select(.data.type | contains("MAJ_CODES_EVENEMENTS"))]'-e 6000
delayed -q '[.root[] | select(.data.type | contains("RENDEZVOUS") | not)]'-e 6000
active -q '[.root[] | select(.data.type | contains("NOTIFIER_BENEFICIAIRES"))]'
```
