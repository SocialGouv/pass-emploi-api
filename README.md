# Initialiser le poste de dev

1. Ouvrir le projet dans PyCharm 
2. Créer l'environnement virtuel Python : `$ python3 -m venv pass-emploi-venv`
3. Activer l'environnement : `$ source pass-emploi-venv/bin/activate`
4. Configurer l'interprêteur Python dans PyCharm : Interpreter Settings > Show all > "+" et ajouter l'environnement qu'on vient de créer
5. Installer les librairies du projet : `$ python setup.py install` 

# Ouvrir un poste de dev sur le net
1. L'app tourne en local sur le port <PORT> => vérifier avec http://localhost:<PORT>
2. Lancer / configurer ngrok https://ngrok.com/download
3. `$ ngrok http <PORT>` => ex : https://e648dfa0639d.ngrok.io
