import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import admin, { firestore } from 'firebase-admin'
import { getMessaging, TokenMessage } from 'firebase-admin/messaging'
import { DateTime } from 'luxon'
import { ArchiveJeune } from '../../domain/archive-jeune'
import { Authentification } from '../../domain/authentification'
import {
  ChatGroupe,
  ChatIndividuel,
  MessageGroupe,
  MessageIndividuel,
  MessageRecherche
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
import CollectionReference = firestore.CollectionReference
import DocumentReference = firestore.DocumentReference
import Timestamp = firestore.Timestamp
import UpdateData = firestore.UpdateData
import DocumentData = firestore.DocumentData
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Utf8 = require('crypto-js/enc-utf8')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AES = require('crypto-js/aes')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Base64 = require('crypto-js/enc-base64')

const FIREBASE_CHAT_PATH = 'chat'
const FIREBASE_GROUP_PATH = 'groupe'
const FIREBASE_MESSAGES_PATH = 'messages'
const FIREBASE_MESSAGES_HISTORY_PATH = 'history'
const SENT_BY_CONSEILLER = 'conseiller'
const SENT_BY_JEUNE = 'jeune'

@Injectable()
export class FirebaseClient {
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

  async recupereMessagesConversation(
    idBeneficiaire: string
  ): Promise<MessageRecherche[]> {
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chats = await collection.where('jeuneId', '==', idBeneficiaire).get()
    if (chats.empty) return []

    const messages = await getMessagesRef(chats.docs[0].ref).get()
    return messages.docs.map(doc =>
      this.messageSnapshotToMessageIndividuelDechiffre(doc)
    )
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
    message: MessageIndividuel,
    { sentByBeneficiaire }: { sentByBeneficiaire: boolean }
  ): Promise<void> {
    const maintenant = this.dateService.now()
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chat = collection.doc(idChat)
    const newConseillerMessageCount = (
      (await chat.get()).data() as FirebaseChat
    ).newConseillerMessageCount
    const sentBy = sentByBeneficiaire ? SENT_BY_JEUNE : SENT_BY_CONSEILLER

    const updatedFirebaseChat: UpdateData<FirebaseChat> = {
      lastMessageContent: message.message,
      lastMessageIv: message.iv,
      lastMessageSentAt: Timestamp.fromMillis(maintenant.toMillis()),
      lastMessageSentBy: sentBy,
      newConseillerMessageCount: newConseillerMessageCount + 1
    }
    const firebaseMessage: FirebaseMessage = {
      content: message.message,
      iv: message.iv,
      conseillerId: message.idConseiller,
      sentBy,
      creationDate: Timestamp.fromMillis(maintenant.toMillis()),
      type: message.type
    }

    if (message.infoPieceJointe) {
      firebaseMessage.piecesJointes = [message.infoPieceJointe]
    }

    if (message.infoSession) {
      firebaseMessage.sessionMilo = message.infoSession
    }

    await getMessagesRef(chat).add(firebaseMessage)
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

    await getMessagesRef<FirebaseGroupeMessage>(groupe).add(firebaseMessage)
    await groupe.update(updatedFirebaseChat)
  }

  async getNombreDeConversationsNonLues(conseillerId: string): Promise<number> {
    const chat = await this.firestore
      .collection(FIREBASE_CHAT_PATH)
      .where('conseillerId', '==', conseillerId)
      .where('seenByConseiller', '==', false)
      .get()

    let actifDansLes48h = false
    const ilYa48h = this.dateService.now().minus({ days: 2 })

    for (const message of chat.docs) {
      const derniereLectureConseiller = message.data().lastConseillerReading
      if (
        derniereLectureConseiller &&
        DateTime.fromJSDate(derniereLectureConseiller.toDate()) > ilYa48h
      ) {
        actifDansLes48h = true
        break
      }
    }

    return actifDansLes48h ? 0 : chat.size
  }

  async getToken(utilisateur: Authentification.Utilisateur): Promise<string> {
    const customClaims = {
      jeuneId: Authentification.estJeune(utilisateur.type)
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
          t.set(getMessagesRef(conversations.doc(conversationCible.id)).doc(), {
            sentBy: SENT_BY_CONSEILLER,
            conseillerId: jeune.conseiller?.id,
            type: Jeune.estSuiviTemporairement(jeune)
              ? 'NOUVEAU_CONSEILLER_TEMPORAIRE'
              : 'NOUVEAU_CONSEILLER',
            content: encryptedText,
            iv: iv,
            creationDate: firestore.Timestamp.fromDate(new Date())
          })
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

  async getChatAArchiver(idJeune: string): Promise<ArchiveJeune.Message[]> {
    const collection = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chats = await collection.where('jeuneId', '==', idJeune).get()

    const messagesArchive = []
    if (!chats.empty) {
      const messagesChiffres = await getMessagesRef(chats.docs[0].ref).get()

      for (const messageChiffre of messagesChiffres.docs) {
        const messageAArchiver = await this.fromMessageChiffreToMessageArchive(
          messageChiffre
        )
        messagesArchive.push(messageAArchiver)
      }
    }

    return messagesArchive
  }

  async envoyerStatutAnalysePJ(
    idJeune: string,
    idMessage: string,
    statut: string
  ): Promise<void> {
    const collectionChats = this.firestore.collection(FIREBASE_CHAT_PATH)
    const chats = await collectionChats.where('jeuneId', '==', idJeune).get()
    if (chats.empty) {
      this.logger.error(`Conversation avec ${idJeune} non trouvée`)
      return
    }
    const chat = chats.docs[0]

    const messageRef = getMessagesRef(chat.ref).doc(idMessage)
    const message = await messageRef.get()
    if (!message.exists) {
      this.logger.error(`Message ${idMessage} avec ${idJeune} non trouvée`)
      return
    }
    const data = message.data()!

    if (!data.piecesJointes) {
      this.logger.error(`PJ non trouvée`)
      return
    }
    const [pj, ...other] = data.piecesJointes

    await messageRef.update({ piecesJointes: [{ ...pj, statut }, ...other] })
  }

  private messageSnapshotToMessageIndividuelDechiffre(
    docSnapshot: QueryDocumentSnapshot<DocumentData, DocumentData>
  ): MessageRecherche {
    const firebaseMessage = docSnapshot.data()
    const message: MessageRecherche = {
      id: docSnapshot.id,
      content: firebaseMessage.content,
      iv: firebaseMessage.iv,
      idConversation: docSnapshot.ref.parent.parent!.id,
      rawMessage: firebaseMessage
    }

    if (firebaseMessage.type === 'MESSAGE_PJ') {
      message.piecesJointes = firebaseMessage.piecesJointes ?? []
    }

    return this.dechiffrerMessage(message)
  }

  private dechiffrerMessage(message: MessageRecherche): MessageRecherche {
    const iv = message.iv
    if (!iv) return message

    const decryptedMessage: {
      content: string
      piecesJointes?: Array<{ nom: string }>
    } = {
      content: this.chatCryptoService.decrypt(iv, message.content),
      piecesJointes: message.piecesJointes
        ? message.piecesJointes.map(pj => {
            return {
              nom: this.chatCryptoService.decrypt(iv, pj.nom)
            }
          })
        : undefined
    }

    return {
      ...message,
      content: decryptedMessage.content,
      piecesJointes: decryptedMessage.piecesJointes
    }
  }

  private async fromMessageChiffreToMessageArchive(
    message: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ): Promise<ArchiveJeune.Message> {
    const messageFirebase = message.data()
    const key = Utf8.parse(this.configService.get('firebase').encryptionKey)
    const iv = Base64.parse(messageFirebase.iv)

    const contenu = AES.decrypt(messageFirebase.content, key, { iv }).toString(
      Utf8
    )
    const date = new Date(
      parseInt(messageFirebase.creationDate._seconds) * 1000
    ).toISOString()
    const messageArchive: ArchiveJeune.Message = {
      contenu,
      date,
      envoyePar: messageFirebase.sentBy,
      type: messageFirebase.type
    }

    try {
      const historique = await message.ref
        .collection(FIREBASE_MESSAGES_HISTORY_PATH)
        .get()
      if (!historique.empty)
        messageArchive.historique = historique.docs.map(doc =>
          this.fromHistoriqueChiffreToHistoriqueArchive(doc, key, iv)
        )
    } catch (e) {
      this.logger.error(
        buildError(
          `Échec de la récupération de l’historique du message ${message.id}`,
          e
        )
      )
    }

    return messageArchive
  }

  private fromHistoriqueChiffreToHistoriqueArchive(
    doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
    key: unknown,
    iv: unknown
  ): ArchiveJeune.EntreeHistoriqueMessage {
    const entreeHistorique = doc.data()
    const contenuPrecedent = AES.decrypt(
      entreeHistorique.previousContent,
      key,
      { iv }
    ).toString(Utf8)
    const date = new Date(
      parseInt(entreeHistorique.date._seconds) * 1000
    ).toISOString()

    return { date, contenuPrecedent }
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

function getMessagesRef<T extends FirebaseMessage>(
  chatRef: DocumentReference
): CollectionReference<T> {
  return chatRef.collection(FIREBASE_MESSAGES_PATH).withConverter({
    toFirestore: (data: T) => data,
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
      snap.data() as T
  })
}
