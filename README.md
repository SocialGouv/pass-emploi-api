# Initialiser le poste de dev
1. Ouvrir le projet dans PyCharm
2. Créer l'environnement virtuel Python : `$ python3 -m venv pass-emploi-venv`
3. Activer l'environnement : `$ source pass-emploi-venv/bin/activate`
4. Configurer l'interprêteur Python dans PyCharm : Interpreter Settings > Show all > "+" et ajouter l'environnement qu'
   on vient de créer
5. Installer les librairies du projet : `$ pip install -r requirements.txt`
6. Pour lancer le projet directement depuis l'IDE, il peut être nécessaire de spécifier le `working directory`:
   `Run > Edit Configurations > Working Directory: /pass-emploi-api`

NB: Pour rajouter une nouvelle librairie pour le projet il suffit de la rajouter dans le fichier `requirements.txt` 

# Ouvrir un poste de dev sur le net
1. L'app tourne en local sur le port <PORT> => vérifier avec http://localhost:<PORT>
2. Lancer / configurer ngrok https://ngrok.com/download
3. `$ ngrok http <PORT>` => ex : https://e648dfa0639d.ngrok.io


# Lancer l'application dans un contexte de développement
Pour lancer l'application dans un contexte de développement, il faut créer un fichier `.env` à la racine, où on rajoute
les variables d'environnement nécessaires à l'application. Les variables d'environnement à mettre dans ce fichier sont 
les suivantes :

`ENV` = `developement`

`FIREBASE_SECRET_KEY` = `clé privée: voir dans la section suivante comment la récupérer`

NB: Ce fichier est bien dans le .gitignore, mais garder attention à ne pas le rajouter car il contient des clés privées.

# Utiliser le chat de Firebase 
1. Aller sur la page Firebase du projet Pass Emploi > Paramètres du Projet > Comptes de service
2. Générer une clé privée
3. Rajouter cette clé dans le fichier `.env` dans la variable `FIREBASE_SECRET_KEY`. NB: Faire attention à bien in-liner
la clé afin qu'elle puisse être parsée et lue.
