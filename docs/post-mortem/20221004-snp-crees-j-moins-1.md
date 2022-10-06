## POST MORTEM

### Date
10 Octobre 2022

### Auteurs
Joseph ROBERT

### Status
Brouillon

### Résumé
Un conseiller a remonté au support que les SNP étaient crées en J-1. Cela pose problème pour les SNP crées le lundi qui sont comptées sur la semaine précédente. 

### Impacts
Les heures des jeunes ne sont pas comptées sur la bonne semaine.

### Root Causes
Le calcul de la date de début de la semaine est fait en fonction de la date de début d'action. Or, lorsque l'on qualifie une action le front envoie une date à minuit avec l'offset.

Exemple :
- Date de début d'action : 2022-10-10T00:00:00+02:00

Ensuite pour créer une SNP on appelle une API Milo avec une date qui ne contient pas l'offset. Celle-ci est composée de AAAA-MM-DD.
Lorsque l'on formatte la date, on utilise la timezone du serveur.

Le serveur étant en UTC la date est considérée comme : 2022-10-09T22:00:00+00:00

En formattant la date on envoyait à MILO 2022-10-09 au lieu de 2022-10-10.

### Trigger
Lors de la transformation des payload d'api pour les dates on utilise un transformer qui fait :

```javascript
  new Date(isoString)
```

Cette méthode enlève l'offset de la date pour la transformer en date locale du serveur.

### Résolution
Afin de résoudre le problème plusieurs actions ont été effectués :
- Modification des transformers pour utiliser Luxon avec le paramètre setZone à true
- Refacto du domaine Action pour utiliser DateTime de luxon au lieu de DateJS
- Refacto des tests et des fixtures pour enlever les UTC qui enlevaient la notion d'offset 

### Détection
Remontée du support

### Actions
| Action                                                | Type     | Owner | Statut |
|-------------------------------------------------------|----------|-------|--------|
| Refacto des transformers et du domain action          | fix      | JORO  | DONE   |
| Rédiger un ADR pour standardiser la gestion des dates | mitigate | JORO  | DONE   |