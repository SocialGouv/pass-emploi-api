## POST MORTEM

### Date
23 Mai 2022

### Auteurs 
Joseph Robert

### Status
Réparé

### Résumé
Les jobs ne tournaient plus sur les workers depuis le vendredi 20 mai suite à une boucle infinie.

### Impacts
- Pas de recherches de nouvelles offres du vendredi 20 au lundi 23
- Pas d'envoi de mail de rappel aux conseillers le vendredi 20
- Pas d'envoi de notifications de rappel de rendez vous aux jeunes du vendredi 20 au lundi 23
- Pas de mise à jour des mailings liste conseiller vendredi 20 au lundi 23
- Lors du redémarrage des workers, tous les jobs en retard se sont lancés (envoi des notifications de rappel de rendez vous, mais en retard)

### Root Causes
La commande ***HandleJobNotifierNouveauxServicesCiviqueCommandHandler*** contenait une condition de sortie d'une boucle while mal placée.
Lorsqu'une offre n'avait pas de localisation on restait en boucle dans ce while. Les 2 workers ont fini par être dans cette boucle infinie et ne pas pouvoir dépiler autre chose.

### Trigger
On a eu plusieurs jours de suite des offres sans localisation.

### Résolution
Afin de relancer les workers 2 actions ont été entreprises :
- 11:08 : redémarrage des workers afin de débloquer les jobs
- 11:27 : déploiement d'un fix qui permet de sortir de la boucle while lorsqu'il n'y a pas de localisation (c7728481)

### Détection
- Le dashboard des jobs et crons montrait que rien ne s'était passé depuis vendredi 20
- Les logs des containers ne montraient qu'une seule opération concernant le ***HandleJobNotifierNouveauxServicesCiviqueCommandHandler***

### Actions
| Action                                               | Type    | Owner           | Statut |
|------------------------------------------------------|---------|-----------------|--------|
| [Créer une alerte lorsque les jobs ne sont pas lancés](https://trello.com/c/H2LfRszb) | detect  | Joseph          | TO DO  |
| Fixer la boucle infinie                              | prevent | Joseph & Adrien | DONE   |
|                                                      |         |                 |        |
