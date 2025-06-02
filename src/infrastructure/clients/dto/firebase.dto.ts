import { firestore } from 'firebase-admin'
import Timestamp = firestore.Timestamp
import { Chat } from '../../../domain/chat'

export interface FirebaseChat {
  newConseillerMessageCount: number
  lastMessageContent: string
  lastMessageSentAt: Timestamp
  lastMessageSentBy: string
  lastMessageIv: string
  seenByConseiller: boolean
}

export interface FirebaseMessage {
  content: string
  iv: string
  conseillerId?: string
  sentBy: 'conseiller' | 'jeune'
  creationDate: Timestamp
  type: Chat.TypeMessage
  piecesJointes?: Array<{
    id: string
    nom: string
    statut?: string
  }>
  sessionMilo?: { id: string; titre: string }
}

export interface FirebaseGroupeMessage extends FirebaseMessage {
  idsBeneficiaires: string[]
}
