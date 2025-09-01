import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Result, emptySuccess } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'

import { QueryTypes, Sequelize } from 'sequelize'
import {
  FeatureFlipSqlModel,
  FeatureFlipTag
} from '../../../infrastructure/sequelize/models/feature-flip.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

export interface UpdateFeatureFlipCommand extends Command {
  emailsConseillersAjout?: string[]
  emailsConseillersSuppression?: string[]
  supprimerExistants?: boolean
  tagFeature: FeatureFlipTag
}

@Injectable()
export class UpdateFeatureFlipCommandHandler extends CommandHandler<
  UpdateFeatureFlipCommand,
  void
> {
  constructor(
    private supportAuthorizer: SupportAuthorizer,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('UpdateFeatureFlipCommandHandler')
  }

  async authorize(
    _command: UpdateFeatureFlipCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }
  async monitor(): Promise<void> {
    return
  }

  async handle(command: UpdateFeatureFlipCommand): Promise<Result<void>> {
    if (command.supprimerExistants) {
      await FeatureFlipSqlModel.destroy({
        where: { featureTag: command.tagFeature }
      })
    }

    if (command.emailsConseillersAjout?.length) {
      const jeunesToAdd: Array<{ id: string }> = await this.sequelize.query(
        `
        SELECT j.id
        FROM jeune j
        JOIN conseiller c ON j.id_conseiller = c.id
        WHERE c.email IN (:emailsConseillersAjout)
      `,
        {
          replacements: {
            emailsConseillersAjout: command.emailsConseillersAjout
          },
          type: QueryTypes.SELECT
        }
      )
      const featureFlipsToCreate = jeunesToAdd.map(jeune => ({
        idJeune: jeune.id,
        featureTag: command.tagFeature
      }))
      await FeatureFlipSqlModel.bulkCreate(featureFlipsToCreate, {
        ignoreDuplicates: true
      })
    }

    if (command.emailsConseillersSuppression?.length) {
      const jeunesToRemove: Array<{ id: string }> = await this.sequelize.query(
        `
        SELECT j.id
        FROM jeune j
        JOIN conseiller c ON j.id_conseiller = c.id
        WHERE c.email IN (:emailsConseillersSuppression)
      `,
        {
          replacements: {
            emailsConseillersSuppression: command.emailsConseillersSuppression
          },
          type: QueryTypes.SELECT
        }
      )
      await FeatureFlipSqlModel.destroy({
        where: {
          idJeune: jeunesToRemove.map(j => j.id),
          featureTag: command.tagFeature
        }
      })
    }

    return emptySuccess()
  }
}
