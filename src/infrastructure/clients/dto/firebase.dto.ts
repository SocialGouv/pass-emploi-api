import { firestore } from 'firebase-admin'
import Timestamp = firestore.Timestamp
import { Chat } from '../../../domain/chat'

export interface FirebaseChat {
  seenByConseiller?: boolean | undefined
  flaggedByConseiller?: boolean | undefined
  newConseillerMessageCount: number
  lastMessageContent?: string | undefined
  lastMessageSentAt?: string | undefined
  lastMessageSentBy?: string | undefined
  lastConseillerReading?: Timestamp | undefined
  lastJeuneReading?: Timestamp | undefined
  lastMessageIv?: string | undefined
}

export interface FirebaseMessage {
  content: string
  iv: string
  conseillerId: string
  sentBy: 'conseiller'
  creationDate: Timestamp
  type: Chat.TypeMessage
  piecesJointes?: Array<{
    id: string
    nom: string
  }>
}
