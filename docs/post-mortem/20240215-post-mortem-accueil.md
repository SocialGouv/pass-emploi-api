## POST MORTEM

APP - Page d'accueil KO (PE et MILO)


### Date
13 Fev 2024

### Résumé
- Erreurs accueil Apps Milo PE
- Pas de logs sur Elastic
- Remonté uniquement par le support

### Impacts
Accueil KO

### Résolution
MEP du back

### Détection
- Support
- Logs crashlytics
- Les développeurs se sont rappelés que la MEP du BACK n'a pas été faite

### Actions
| Action | Type     | Owner | Statut | Priorité |
|--------|----------|-------|--------|------|
| Paramétrer Firebase pour alerter       | detect   |   DEVS    | TO DO  | NICE |
| Reflexe pour s'assurer que le BACK est en Prod avant de MEP Mobile/Web       | mitigate  |   DEVS et POs    |  TO DO   | MUST |
| Non reg en prod sur testflight     | mitigate  |   DEVS ou POs    |  TO DO   | MUST |

