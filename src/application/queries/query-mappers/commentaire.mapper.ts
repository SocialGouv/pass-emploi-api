import { Action } from '../../../domain/action/action'
import { CommentaireActionQueryModel } from '../query-models/actions.query-model'

export function toCommentaireQueryModel(
  commentaire: Action.Commentaire
): CommentaireActionQueryModel {
  return {
    ...commentaire,
    date: commentaire.date.toISO()
  }
}
