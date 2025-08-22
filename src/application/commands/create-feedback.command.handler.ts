import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { FeedbackSqlModel } from '../../infrastructure/sequelize/models/feedback.sql-model'
import { Authentification } from '../../domain/authentification'

export interface CreateFeedbackCommand extends Command {
  tag: string
  note: number
  commentaire?: string
}

@Injectable()
export class CreateFeedbackCommandHandler extends CommandHandler<
  CreateFeedbackCommand,
  void
> {
  constructor(private readonly dateService: DateService) {
    super('CreateFeedbackCommandHandler')
  }

  async handle(
    command: CreateFeedbackCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    await FeedbackSqlModel.create({
      idUtilisateur: utilisateur.id,
      dateCreation: this.dateService.nowJs(),
      structure: utilisateur.structure,
      tag: command.tag,
      note: command.note,
      commentaire: command.commentaire
    })
    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {}
}
