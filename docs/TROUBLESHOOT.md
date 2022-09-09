# Troubleshoot

## Mes migrations ne sont pas rejouées dans les tests :(
Pas d'inquiétude, l'image docker pour la DB de test contient un volume.
Pour supprimer ce volume et rejouer les migrations depuis le début, simplement exécuter la commande suivante :

```
docker-compose up --renew-anon-volumes -d pgtestdb 
```

## Je veux retrouver un job sur redis
Pas d'inquiétude, on a un cli pour ça

```
bull-repl
connect -u redis://username:password@localhost:10000 JobQueue
delayed -q '[.root[] | select(.data.type | contains("MAJ_CODES_EVENEMENTS"))]'-e 6000
```