# Troubleshoot

## Mes migrations ne sont pas rejouées dans les tests :(
Pas d'inquiétude, l'image docker pour la DB de test contient un volume.
Pour supprimer ce volume et rejouer les migrations depuis le début, simplement exécuter la commande suivante :

```
docker-compose up --renew-anon-volumes -d pgtestdb 
```