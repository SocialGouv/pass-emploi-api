import firebase_admin
from firebase_admin import credentials, firestore


def initialise_chat(jeune_id, conseiller_id):
    cred = credentials.Certificate("./pass_emploi_secret_key.json")
    app = firebase_admin.initialize_app(cred, name='__main__')
    db = firestore.client(app)

    firebase_documents = db.collection('chat').where('jeuneId', '==', jeune_id).where('conseillerId', '==',
                                                                                      conseiller_id).get()

    if not firebase_documents:
        new_document = {
            u'jeuneId': jeune_id,
            u'conseillerId': conseiller_id,
        }
        db.collection('chat').add(new_document)
