# Initialiser le poste de dev

1. Ouvrir le projet dans PyCharm
2. Importer le formateur `pass_emploi_python_code_style.xml` à la racine du
   projet : `Preferences > Code style > Import scheme…`
3. Créer l'environnement virtuel Python : `$ python3 -m venv pass-emploi-venv`
4. Activer l'environnement : `$ source pass-emploi-venv/bin/activate`
5. Configurer l'interprêteur Python dans PyCharm : Interpreter Settings > Show all > "+" et ajouter l'environnement que
   l'on vient de créer
6. Installer les librairies du projet : `$ pip install -r requirements.txt`
7. Pour lancer le projet directement depuis l'IDE, il peut être nécessaire de spécifier le `working directory`:
   `Run > Edit Configurations > Working Directory: /pass-emploi-api`

NB: Pour rajouter une nouvelle librairie pour le projet il suffit de la rajouter dans le fichier `requirements.txt`

## Initialisation de la base avec docker :

```shell script
docker run -d -p 5432:5432 --name PASSEMPLOI-POSTGRES -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=PASSEMPLOIDB postgres 
docker exec -it PASSEMPLOI-POSTGRES bash
psql -U postgres``
CREATE DATABASE passemploidbdev;
\q
exit
```

## Utilisation de la sandbox :

Afin de pouvoir tester nos développements en local, on fait appel à un script qui permet de peupler la sandbox avec des 

données à chaque lancement du backend. Le script enn question se trouve dans ``` sandbox/create_sandbox.py ``` . On peut
 
l'alimenter si on a besoin d'autres données pour de nouveaux usecases.


## Accéder aux bases de données SCALINGO à distance

1. Au préalable, il faut bien avoir installer le CLI Scalingo sur sa machine [https://cli.scalingo.com].
2. Pour la base de staging, dans un terminal, lancer la commande
   suivante : `$ scalingo -a pa-back-staging pgsql-console`
3. Pour la base de prod, dans un terminal, lancer la commande suivante : `$ scalingo -a pa-back-prod pgsql-console`

Pour purger les données, vous pouvez effectuer les commandes suivantes (en rajoutant un conseiller dans l'état actuelle
de l'application) :

```sql
TRUNCATE TABLE jeune CASCADE;
TRUNCATE TABLE conseiller CASCADE;
INSERT INTO conseiller (id, first_name, last_name)
VALUES (1, 'Nils', 'Willis');
```

## Installation de l'outil pour les migrations de base

1. `$ pip install alambic`
2. `$ source pass-emploi-venv/bin/activate`

## Ajouter une migration à la base

1. `$ alembic revision -m "intitulé de la migration"`
2. Insérer les éléments de la migration dans le fichier nouvellement créé dans le répertoire `alambic/versions`
3. L'upgrade se fait directement au prochain lancement du backend

# Ouvrir un poste de dev sur le net

1. L'app tourne en local sur le port <PORT> => vérifier avec http://localhost:<PORT>
2. Lancer / configurer ngrok https://ngrok.com/download
3. `$ ngrok http <PORT>` => ex : https://e648dfa0639d.ngrok.io

# Renseigner les variables d'environnement

Pour renseigner les variables d'environnement nécessaires à l'application, il faut créer un fichier `.env` à la racine,
où on les spécifie. Le fichier `.env.template` donne une idée des variables à renseigner.

NB: Ce fichier est bien dans le .gitignore, mais garder attention à ne pas le rajouter car il contient des clés privées.

# Utiliser le chat de Firebase

1. Aller sur la page Firebase du projet Pass Emploi > Paramètres du Projet > Comptes de service
2. Générer une clé privée
3. Rajouter cette clé dans le fichier `.env` dans la variable `FIREBASE_SECRET_KEY`. NB: Faire attention à bien in-liner
   la clé afin qu'elle puisse être parsée et lue.

# Lancer les tests

Pour lancer tous les tests on peut soit utiliser l'IDE, soit exécuter la commande suivante à la racine du projet:

`$ pytest tests`

Pour lancer un test en particulier, on peut soit utiliser l'IDE soit exécuter la commande suivante à la racine du projet

`pytest tests/test_quon_veut_lancer`
