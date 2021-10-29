import json
import os

import firebase_admin
from firebase_admin import credentials, firestore

SECRET_KEY = os.environ.get('FIREBASE_SECRET_KEY')


class FirebaseChat:

    def __init__(self):
        client = None

        if SECRET_KEY:
            firebase_secret_key = json.loads(SECRET_KEY)
            cred = credentials.Certificate(firebase_secret_key)
            app = firebase_admin.initialize_app(cred)
            client = firestore.client(app)

        self.client = client

    def initialise_chat_if_required(self, jeune_id, conseiller_id) -> None:
        firebase_env = os.environ.get('FIREBASE_ENVIRONMENT_PREFIX')
        chat_collection_path = firebase_env + '-chat'
        firebase_documents = self.client.collection(chat_collection_path) \
            .where('jeuneId', '==', jeune_id) \
            .where('conseillerId', '==', conseiller_id) \
            .get()

        if not firebase_documents:
            new_document = {
                u'jeuneId': jeune_id,
                u'conseillerId': conseiller_id,
            }
            self.client.collection(chat_collection_path).add(new_document)
