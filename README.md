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

# Utiliser le chat de Firebase 
1. Aller sur la page Firebase du projet Pass Emploi > Paramètres du Projet > Comptes de service
2. Générer une clé privée
3. Nommer le fichier `pass_emploi_secret_key.json`, et le déplace dans le répertoire `firebase`. NB: Ce fichier est dans
   le .gitignore, mais garder attention à ne pas ajouter cette clé dans le répertoire git, ni la partager de manière non
   sécurisée.

# Lancer l'application dans un contexte de développement
Par défaut l'application tourne dans un contexte de prod, pour la lancer en mode développement il faut aller au fichier
app.py à la racine et mettre `debug=True` dans la dernière ligne qui lance l'application.
