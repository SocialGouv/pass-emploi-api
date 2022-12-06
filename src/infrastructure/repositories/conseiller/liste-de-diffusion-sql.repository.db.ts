import { Conseiller } from '../../../domain/conseiller/conseiller'
import {
  ListeDeDiffusionDto,
  ListeDeDiffusionSqlModel
} from '../../sequelize/models/liste-de-diffusion.sql-model'
import { AsSql } from '../../sequelize/types'
import { Inject } from '@nestjs/common'
import { SequelizeInjectionToken } from '../../sequelize/providers'
import { Sequelize } from 'sequelize'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { DateTime } from 'luxon'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

export class ListeDeDiffusionSqlRepository
  implements Conseiller.ListeDeDiffusion.Repository
{
  constructor(
    @Inject(SequelizeInjectionToken)
    private readonly sequelize: Sequelize
  ) {}

  async save(listeDeDiffusion: Conseiller.ListeDeDiffusion): Promise<void> {
    await this.sequelize.transaction(async transaction => {
      const listeDeDiffusionDto: AsSql<ListeDeDiffusionDto> = {
        id: listeDeDiffusion.id,
        titre: listeDeDiffusion.titre,
        dateDeCreation: listeDeDiffusion.dateDeCreation.toJSDate(),
        idConseiller: listeDeDiffusion.idConseiller
      }
      await ListeDeDiffusionSqlModel.upsert(listeDeDiffusionDto)

      await ListeDeDiffusionJeuneAssociationSqlModel.destroy({
        transaction,
        where: {
          idListe: listeDeDiffusion.id
        }
      })

      await Promise.all(
        listeDeDiffusion.beneficiaires.map(beneficiaire => {
          return ListeDeDiffusionJeuneAssociationSqlModel.create(
            {
              idBeneficiaire: beneficiaire.id,
              idListe: listeDeDiffusion.id,
              dateAjout: beneficiaire.dateAjout.toJSDate()
            },
            { transaction }
          )
        })
      )
    })
  }

  async get(id: string): Promise<Conseiller.ListeDeDiffusion | undefined> {
    const sqlModel = await ListeDeDiffusionSqlModel.findByPk(id, {
      include: [JeuneSqlModel]
    })
    if (!sqlModel) return undefined
    return {
      id: sqlModel.id,
      titre: sqlModel.titre,
      dateDeCreation: DateTime.fromJSDate(sqlModel.dateDeCreation),
      beneficiaires: sqlModel.jeunes.map(getJeuneDeLaListe),
      idConseiller: sqlModel.idConseiller
    }
  }
}

// La requête SQL qui récupère les jeunes d'une liste de diffusion passe par une table de jointure
// Dans le résultat de la requête, on peut récupérer les informations supplémentaires de l'association
// Pour palier au problème de typage, on utilise la technique ci-dessous.
function getJeuneDeLaListe(
  jeuneSqlModel: JeuneSqlModel
): Conseiller.ListeDeDiffusion.Beneficiaire {
  const association = jeuneSqlModel.get(
    ListeDeDiffusionJeuneAssociationSqlModel.name
  ) as ListeDeDiffusionJeuneAssociationSqlModel | undefined
  if (!association) throw new Error('Association non trouvée')
  return {
    id: jeuneSqlModel.id,
    dateAjout: DateTime.fromJSDate(association.dateAjout)
  }
}
