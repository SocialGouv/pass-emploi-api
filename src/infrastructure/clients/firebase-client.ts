import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import admin, { firestore } from 'firebase-admin'
import { getMessaging, TokenMessage } from 'firebase-admin/messaging'
import { ArchiveJeune } from '../../domain/archive-jeune'
import { Authentification } from '../../domain/authentification'
import {
  ChatGroupe,
  ChatIndividuel,
  MessageGroupe,
  MessageIndividuel
} from '../../domain/chat'
import { Jeune } from '../../domain/jeune/jeune'
import { ChatCryptoService } from '../../utils/chat-crypto-service'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'
import { getAPMInstance } from '../monitoring/apm.init'
import {
  FirebaseChat,
  FirebaseGroupeMessage,
  FirebaseMessage
} from './dto/firebase.dto'
import Timestamp = firestore.Timestamp
import UpdateData = firestore.UpdateData

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Utf8 = require('crypto-js/enc-utf8')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AES = require('crypto-js/aes')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Base64 = require('crypto-js/enc-base64')

export interface IFirebaseClient {
  send(tokenMessage: TokenMessage): Promise<void>

  initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void>

  getToken(utilisateur: Authentification.Utilisateur): Promise<string>
}

const FIREBASE_CHAT_PATH = 'chat'
const FIREBASE_GROUP_PATH = 'groupe'
const FIREBASE_MESSAGES_PATH = 'messages'
const SENT_BY_CONSEILLER = 'conseiller'

@Injectable()
export class FirebaseClient implements IFirebaseClient {
  private messaging
  private auth
  private readonly app: admin.app.App
  private firestore: FirebaseFirestore.Firestore
  private logger: Logger
  private apmService: APM.Agent

  constructor(
    private configService: ConfigService,
    private readonly chatCryptoService: ChatCryptoService,
    private dateService: DateService
  ) {
    const firebase = this.configService.get('firebase.key')
    this.app = FirebaseClient.getApp(firebase)
    this.logger = new Logger('FirebaseClient')
    this.logger.log('Connexion à firebase en cours')
    this.app
      .remoteConfig()
      .listVersions()
      .then(() => this.logger.log('Connexion à firebase OK'))
      .catch(e => this.logger.error(buildError('Connexion à firebase KO', e)))
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
      this.logger.log(tokenMessage)
    } catch (e) {
      this.logger.error(
        buildError(
          `Impossible d'envoyer de notification sur le token ${tokenMessage.token}`,
          e
        )
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
        conseillerId,
        newConseillerMessageCount: 0
      }
      await this.firestore.collection(collectionPath).add(newChat)
    }
  }

  async initializeGroupIfNotExists(
    conseillerId: string,
    groupeId: string
  ): Promise<void> {
    const collectionPath = FIREBASE_GROUP_PATH
    const chat = await this.firestore
      .collection(collectionPath)
      .where('conseillerId', '==', conseillerId)
      .where('groupeId', '==', groupeId)
      .get()

    if (chat.empty) {
      const newGroup = {
        conseillerId,
        groupeId
      }
      await this.firestore.collection(collectionPath).add(newGroup)
    }
  }

  async recupererChatIndividuel(
    idBeneficiaire: string
  ): Promise<ChatIndividuel | undefined> {
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chats = await collection.where('jeuneId', '==', idBeneficiaire).get()

    if (!chats.empty) {
      return { id: chats.docs[0].id, idBeneficiaire: idBeneficiaire }
    }

    return undefined
  }

  async recupererChatGroupe(
    idListeDeDiffusion: string
  ): Promise<ChatGroupe | undefined> {
    const collection = this.firestore.collection(FIREBASE_GROUP_PATH)
    const groupes = await collection
      .where('groupeId', '==', idListeDeDiffusion)
      .get()

    if (!groupes.empty) {
      return { id: groupes.docs[0].id }
    }

    return undefined
  }

  async envoyerMessageIndividuel(
    idChat: string,
    message: MessageIndividuel
  ): Promise<void> {
    const maintenant = this.dateService.now()
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chat = collection.doc(idChat)
    const newConseillerMessageCount = (
      (await chat.get()).data() as FirebaseChat
    ).newConseillerMessageCount
    const updatedFirebaseChat: UpdateData<FirebaseChat> = {
      lastMessageContent: message.message,
      lastMessageIv: message.iv,
      lastMessageSentAt: Timestamp.fromMillis(maintenant.toMillis()),
      lastMessageSentBy: SENT_BY_CONSEILLER,
      newConseillerMessageCount: newConseillerMessageCount + 1
    }
    const firebaseMessage: FirebaseMessage = {
      content: message.message,
      iv: message.iv,
      conseillerId: message.idConseiller,
      sentBy: SENT_BY_CONSEILLER,
      creationDate: Timestamp.fromMillis(maintenant.toMillis()),
      type: message.type
    }

    if (message.infoPieceJointe) {
      firebaseMessage.piecesJointes = [message.infoPieceJointe]
    }

    await chat.collection(FIREBASE_MESSAGES_PATH).add(firebaseMessage)
    await chat.update(updatedFirebaseChat)
  }

  async envoyerMessageGroupe(
    idGroupe: string,
    message: MessageGroupe
  ): Promise<void> {
    const maintenant = this.dateService.now()
    const collection = this.firestore.collection(FIREBASE_GROUP_PATH)
    const groupe = collection.doc(idGroupe)
    const updatedFirebaseChat: UpdateData<FirebaseChat> = {
      lastMessageContent: message.message,
      lastMessageIv: message.iv,
      lastMessageSentAt: Timestamp.fromMillis(maintenant.toMillis())
    }
    const firebaseMessage: FirebaseGroupeMessage = {
      content: message.message,
      iv: message.iv,
      conseillerId: message.idConseiller,
      sentBy: SENT_BY_CONSEILLER,
      creationDate: Timestamp.fromMillis(maintenant.toMillis()),
      type: message.type,
      idsBeneficiaires: message.idsBeneficiaires
    }

    if (message.infoPieceJointe) {
      firebaseMessage.piecesJointes = [message.infoPieceJointe]
    }

    await groupe.collection(FIREBASE_MESSAGES_PATH).add(firebaseMessage)
    await groupe.update(updatedFirebaseChat)
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
      jeuneId:
        utilisateur.type === Authentification.Type.JEUNE
          ? utilisateur.id
          : null,
      conseillerId:
        utilisateur.type === Authentification.Type.CONSEILLER
          ? utilisateur.id
          : null
    }
    return this.auth.createCustomToken(utilisateur.id, customClaims)
  }

  async transfererChat(
    conseillerCibleId: string,
    idsJeunes: string[]
  ): Promise<void> {
    try {
      await this.firestore.runTransaction(async t => {
        const conversations = this.firestore.collection(FIREBASE_CHAT_PATH)

        const jeunesIdsPar10: string[][] = chunkify(idsJeunes)

        for (const ids of jeunesIdsPar10) {
          const conversationsCibles = await conversations
            .where('jeuneId', 'in', ids)
            .get()

          for (const conversationCible of conversationsCibles.docs) {
            t.update(conversations.doc(conversationCible.id), {
              conseillerId: conseillerCibleId
            })
          }
        }
      })
      this.logger.log(
        `Transfert du chat des jeunes au conseiller ${conseillerCibleId} réalisé avec succès`
      )
    } catch (e) {
      this.logger.error(
        buildError(
          `Echec du transfert du chat des jeunes au conseiller ${conseillerCibleId} :`,
          e
        )
      )
      throw e
    }
  }

  async envoyerMessageTransfertJeune(jeune: Jeune): Promise<void> {
    const messageTransfertChat = 'Vous échangez avec votre nouveau conseiller.'
    const { encryptedText, iv } =
      this.chatCryptoService.encrypt(messageTransfertChat)

    try {
      await this.firestore.runTransaction(async t => {
        const conversations = this.firestore.collection(FIREBASE_CHAT_PATH)

        const conversationsCibles = await conversations
          .where('jeuneId', '==', jeune.id)
          .get()

        for (const conversationCible of conversationsCibles.docs) {
          t.set(
            conversations
              .doc(conversationCible.id)
              .collection(FIREBASE_MESSAGES_PATH)
              .doc(),
            {
              sentBy: SENT_BY_CONSEILLER,
              conseillerId: jeune.conseiller?.id,
              type: Jeune.estSuiviTemporairement(jeune)
                ? 'NOUVEAU_CONSEILLER_TEMPORAIRE'
                : 'NOUVEAU_CONSEILLER',
              content: encryptedText,
              iv: iv,
              creationDate: firestore.Timestamp.fromDate(new Date())
            }
          )
        }
      })
      this.logger.log(
        `Message de transfert du chat des jeunes au conseiller ${jeune.conseiller?.id} envoyé avec succès`
      )
    } catch (e) {
      this.logger.error(
        buildError(
          `Echec de l'envoi des messages transfert du chat des jeunes au conseiller ${jeune.conseiller?.id} :`,
          e
        )
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
        await this.firestore.recursiveDelete(chat.ref)
      }
    }
  }

  async supprimerGroup(idListe: string): Promise<void> {
    const collection = this.firestore.collection(FIREBASE_GROUP_PATH)
    const listeASupprimer = await collection
      .where('groupeId', '==', idListe)
      .get()

    if (!listeASupprimer.empty) {
      for (const liste of listeASupprimer.docs) {
        await this.firestore.recursiveDelete(liste.ref)
      }
    }
  }

  async getChat(idJeune: string): Promise<ArchiveJeune.Message[]> {
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chats = await collection.where('jeuneId', '==', idJeune).get()

    if (!chats.empty) {
      const messagesChiffres = await chats.docs[0].ref
        .collection(FIREBASE_MESSAGES_PATH)
        .get()
      return messagesChiffres.docs.map(
        this.fromMessageChiffreToMessageArchive.bind(this)
      )
    }
    return []
  }

  private fromMessageChiffreToMessageArchive(
    message: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ): ArchiveJeune.Message {
    const messageFirebase = message.data()
    const key = Utf8.parse(this.configService.get('firebase').encryptionKey)

    const contenu = AES.decrypt(messageFirebase.content, key, {
      iv: Base64.parse(messageFirebase.iv)
    }).toString(Utf8)
    const date = new Date(
      parseInt(messageFirebase.creationDate._seconds) * 1000
    ).toISOString()

    return {
      contenu,
      date,
      envoyePar: messageFirebase.sentBy,
      type: messageFirebase.type
    }
  }
}

function chunkify<T>(tableau: T[]): T[][] {
  const chunkSize = 10
  const resultat: T[][] = []

  for (let i = 0, len = tableau.length; i < len; i += chunkSize) {
    resultat.push(tableau.slice(i, i + chunkSize))
  }

  return resultat
}
