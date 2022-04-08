import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import admin, { firestore } from 'firebase-admin'
import { getMessaging, TokenMessage } from 'firebase-admin/messaging'
import { Authentification } from '../../domain/authentification'
import { getAPMInstance } from '../monitoring/apm.init'
import Type = Authentification.Type
import Timestamp = firestore.Timestamp

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
        `Impossible d'envoyer de notification sur le token ${tokenMessage.token}`,
        e
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
    return this.auth.createCustomToken(utilisateur.id, customClaims)
  }

  async transfererChat(
    conseillerCibleId: string,
    jeuneIds: string[]
  ): Promise<void> {
    try {
      await this.firestore.runTransaction(async t => {
        const conversations = this.firestore.collection(FIREBASE_CHAT_PATH)

        const jeunesIdsPar10: string[][] = chunk(jeuneIds)

        for (const ids of jeunesIdsPar10) {
          const conversationsCibles = await conversations
            .where('jeuneId', 'in', ids)
            .get()

          for (const conversationCible of conversationsCibles.docs) {
            t.update(conversations.doc(conversationCible.id), {
              conseillerId: conseillerCibleId
            })
            t.set(
              conversations
                .doc(conversationCible.id)
                .collection('messages')
                .doc(),
              {
                sentBy: 'conseiller',
                type: 'NOUVEAU_CONSEILLER',
                creationDate: Timestamp.fromDate(new Date())
              }
            )
          }
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

  async supprimerChat(idJeune: string): Promise<void> {
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chatsASupprimer = await collection
      .where('jeuneId', '==', idJeune)
      .get()

    if (!chatsASupprimer.empty) {
      for (const chat of chatsASupprimer.docs) {
        await collection.doc(chat.id).delete()
      }
    }
  }
}

function chunk(tableau: string[]): string[][] {
  const chunkSize = 10
  const resultat: string[][] = []

  for (let i = 0, len = tableau.length; i < len; i += chunkSize) {
    resultat.push(tableau.slice(i, i + chunkSize))
  }

  return resultat
}
