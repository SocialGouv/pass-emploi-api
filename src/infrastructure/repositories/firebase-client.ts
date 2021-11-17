import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import admin from 'firebase-admin'
import { getMessaging, TokenMessage } from 'firebase-admin/messaging'

@Injectable()
export class FirebaseClient {
  private messaging
  private readonly app: admin.app.App
  private firestore: FirebaseFirestore.Firestore
  private logger: Logger

  constructor(private configService: ConfigService) {
    const firebase = this.configService.get('firebase.key')
    this.app = FirebaseClient.getApp(firebase)
    this.logger = new Logger('FirebaseClient')
    this.logger.log('Connexion à firebase en cours')
    this.app
      .remoteConfig()
      .listVersions()
      .then(() => this.logger.log('Connexion à firebase OK'))
      .catch(e => this.logger.error('Connexion à firebase KO', e))
    this.messaging = getMessaging(this.app)
    this.firestore = admin.firestore(this.app)
  }

  private static getApp(firebase: string): admin.app.App {
    return admin.apps.length > 0
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(firebase))
        })
  }

  async send(tokenMessage: TokenMessage): Promise<void> {
    try {
      await this.messaging.send(tokenMessage)
    } catch (e) {
      this.logger.warn(
        `Impossible d'envoyer de notification sur le token ${tokenMessage.token}`
      )
    }
  }

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    const firebaseConfig = this.configService.get('firebase.environmentPrefix')
    const collectionPath = `${firebaseConfig}-chat`
    const chat = await this.firestore
      .collection(collectionPath)
      .where('jeuneId', '==', jeuneId)
      .where('conseillerId', '==', conseillerId)
      .get()

    if (chat.empty) {
      const newChat = { jeuneId, conseillerId }
      await this.firestore.collection(collectionPath).add(newChat)
    }
  }
}
