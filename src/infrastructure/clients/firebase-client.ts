import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import admin from 'firebase-admin'
import { getMessaging, TokenMessage } from 'firebase-admin/messaging'
import { Authentification } from '../../domain/authentification'
import { getAPMInstance } from '../monitoring/apm.init'
import Type = Authentification.Type

export interface IFirebaseClient {
  send(tokenMessage: TokenMessage): Promise<void>

  initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void>

  getToken(utilisateur: Authentification.Utilisateur): Promise<string>
}

const FIREBASE_CHAT_PATH = 'chat'

@Injectable()
export class FirebaseClient implements IFirebaseClient {
  private messaging
  private auth
  private readonly app: admin.app.App
  private firestore: FirebaseFirestore.Firestore
  private logger: Logger
  private apmService: APM.Agent

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
    this.auth = admin.auth(this.app)
    this.apmService = getAPMInstance()
  }

  private static getApp(firebase: string): admin.app.App {
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(firebase))
    })
  }

  async send(tokenMessage: TokenMessage): Promise<void> {
    try {
      await this.messaging.send(tokenMessage)
    } catch (e) {
      this.logger.error(
        `Impossible d'envoyer de notification sur le token ${tokenMessage.token}`
      )
      this.apmService.captureError(e)
    }
  }

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    const collectionPath = FIREBASE_CHAT_PATH
    const chat = await this.firestore
      .collection(collectionPath)
      .where('jeuneId', '==', jeuneId)
      .where('conseillerId', '==', conseillerId)
      .get()

    if (chat.empty) {
      const newChat = {
        jeuneId,
        conseillerId
      }
      await this.firestore.collection(collectionPath).add(newChat)
    }
  }

  async getNombreDeConversationsNonLues(conseillerId: string): Promise<number> {
    const chat = await this.firestore
      .collection(FIREBASE_CHAT_PATH)
      .where('conseillerId', '==', conseillerId)
      .where('seenByConseiller', '==', false)
      .get()

    return chat.size
  }

  async getToken(utilisateur: Authentification.Utilisateur): Promise<string> {
    const customClaims = {
      jeuneId: utilisateur.type === Type.JEUNE ? utilisateur.id : null,
      conseillerId: utilisateur.type === Type.CONSEILLER ? utilisateur.id : null
    }
    return await this.auth.createCustomToken(utilisateur.id, customClaims)
  }

  async transfererChat(
    conseillerCibleId: string,
    jeuneIds: string[]
  ): Promise<void> {
    try {
      await this.firestore.runTransaction(async t => {
        const conversations = await this.firestore.collection(
          FIREBASE_CHAT_PATH
        )
        const conversationsCibles = await conversations
          .where('jeuneId', 'in', jeuneIds)
          .get()

        for (const conversationCible of conversationsCibles.docs) {
          await t.update(conversations.doc(conversationCible.id), {
            conseillerId: conseillerCibleId
          })
        }
      })
      this.logger.log(
        `Transfert du chat des jeunes au conseiller ${conseillerCibleId} réalisé avec succès`
      )
    } catch (e) {
      this.logger.error(
        `Echec du transfert du chat des jeunes au conseiller ${conseillerCibleId} :`,
        e
      )
      throw e
    }
  }
}
