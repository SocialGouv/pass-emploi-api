import json
import os

import firebase_admin
from firebase_admin import credentials, firestore


class FirebaseChat:

    def __init__(self):
        firebase_secret_key = json.loads(os.environ.get('FIREBASE_SECRET_KEY'))
        cred = credentials.Certificate(firebase_secret_key)
        app = firebase_admin.initialize_app(cred)
        self.client = firestore.client(app)

    def initialise_chat_if_required(self, jeune_id, conseiller_id):
        firebase_documents = self.client.collection('chat') \
            .where('jeuneId', '==', jeune_id) \
            .where('conseillerId', '==', conseiller_id) \
            .get()

        if not firebase_documents:
            new_document = {
                u'jeuneId': jeune_id,
                u'conseillerId': conseiller_id,
            }
            self.client.collection('chat').add(new_document)
