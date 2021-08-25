import json
import os

import firebase_admin
from firebase_admin import credentials, firestore


def initialise_chat_if_required(jeune_id, conseiller_id):
    firebase_secret_key = json.loads(os.environ.get('FIREBASE_SECRET_KEY'))
    cred = credentials.Certificate(firebase_secret_key)
    app = firebase_admin.initialize_app(cred)
    client = firestore.client(app)

    firebase_documents = client.collection('chat') \
        .where('jeuneId', '==', jeune_id) \
        .where('conseillerId', '==', conseiller_id) \
        .get()

    if not firebase_documents:
        new_document = {
            u'jeuneId': jeune_id,
            u'conseillerId': conseiller_id,
        }
        client.collection('chat').add(new_document)
