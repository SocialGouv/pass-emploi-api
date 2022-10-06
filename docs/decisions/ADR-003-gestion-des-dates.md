# [Gestion des Dates]

* Statut : mergé
* Date : 2022-10-05

## Contexte et définition du problème

Nous avions plusieurs manières de gérer les dates : luxon et DateJS
- La gestion des offset était perdue avec l'utilisation des DateJS et posaient problème sur les calculs de dates et comparaisons.
- Des fixtures étaient partagées et mutées par plusieurs tests
- Cela a impliqué un bug en production sur la création de SNP


## Facteurs de Décision

* Harmoniser la gestion des dates
* Clarifier le fonctionnement des TZ et Offsets

## Résultat de la Décision

#### Ne pas utiliser de transformer avec new Date() pour les payloads et query params
- Lui préférer la méthode de luxon DateTime.fromISO(isoDate, { setZone: true })
- Ceci va générer une date qui maintient l'offset et la timezone

Exemple sur un serveur en UTC :
```javascript
const dateAvecOffset = DateTime.fromISO('2022-10-10T00:00:00+02:00', { setZone: true })
dateAvecOffset.format('yyyy-MM-dd') // 2022-10-10

const dateSansOffset = DateTime.fromISO('2022-10-10T00:00:00+02:00')
dateSansOffset.format('yyyy-MM-dd') // 2022-10-09

const dateJs = new Date('2022-10-10T00:00:00+02:00')
DateTime.fromJSDate(dateJs).format('yyyy-MM-dd') // 2022-10-09
```

#### Pour les tests
- Utiliser des fixtures en mode fonction pour éviter les effets de bord
- Utiliser uneDatetimeAvecOffset() pour la transformation dans les controllers
- Utiliser uneDatetimeLocale() lorsqu'on ne veut pas que la TZ du serveur ait une influence

#### Utilisation du .UTC()
- Lorsque nous voulons comparer deux dates avec des TZ différentes
- JAMAIS pour formatter une date, sauf si le contrat d'api partenaire le stipule
- JAMAIS pour se simplifier la vie lors des tests

#### Quel type utiliser
- DateTime de Luxon pour le domaine


### Impacts Positifs
- Eviter les bugs
- Maintenir la timezone client lors des calculs

### Impacts Négatifs

- BSR nécessaire pour le reste du code

