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

# Utiliser le chat de Firebase 
1. Aller sur la page Firebase du projet Pass Emploi > Paramètres du Projet > Comptes de service
2. Générer une clé privée
3. Utiliser le fichier qui stocke cette clé dans le code du chat `firebase_chat` 
NB: Attention: Ne jamais commiter ou rajouter cette clé dans le répertoire git, ni la partager de manière non sécurisée
