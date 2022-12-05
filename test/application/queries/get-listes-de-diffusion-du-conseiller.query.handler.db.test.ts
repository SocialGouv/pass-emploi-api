import {
  ListeDeDiffusionQueryModel
} from '../../../src/application/queries/query-models/liste-de-diffusion.query-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import {
  GetListesDeDiffusionDuConseillerQueryHandler
} from '../../../src/application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import { expect } from 'test/utils'
import { ListeDeDiffusionSqlModel } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import {
  uneListeDeDiffusionAssociationDto,
  uneListeDeDiffusionDto
} from '../../fixtures/sql-models/liste-de-diffusion-sql.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { success } from '../../../src/building-blocks/types/result'

describe('GetListesDeDiffusionDuConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let queryHandler: GetListesDeDiffusionDuConseillerQueryHandler
  const jeune: Jeune = unJeune({
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })
  const conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })
  const jeuneDto = unJeuneDto({
    id: jeune.id,
    idConseiller: conseillerDto.id
  })

  beforeEach(async () => {
    queryHandler = new GetListesDeDiffusionDuConseillerQueryHandler()

    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it('renvoie les listes de diffusion du conseiller', async () => {
      // Given
      const idAutreConseiller = '5cd8e86b-175a-4980-bad8-c5ce01dc049b'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idAutreConseiller }))
      const listeDeDiffusion1 = uneListeDeDiffusionDto({
        idConseiller: conseillerDto.id
      })
      const listeDeDiffusion2 = uneListeDeDiffusionDto({
        idConseiller: conseillerDto.id
      })
      const listeDeDiffusion3 = uneListeDeDiffusionDto({
        idConseiller: idAutreConseiller
      })
      await ListeDeDiffusionSqlModel.bulkCreate([
        listeDeDiffusion1,
        listeDeDiffusion2,
        listeDeDiffusion3
      ])

      await ListeDeDiffusionJeuneAssociationSqlModel.bulkCreate([
        uneListeDeDiffusionAssociationDto({
          idListe: listeDeDiffusion1.id,
          idBeneficiaire: jeuneDto.id
        }),
        uneListeDeDiffusionAssociationDto({
          idListe: listeDeDiffusion2.id,
          idBeneficiaire: jeuneDto.id
        })
      ])

      // When
      const result = await queryHandler.handle({
        idConseiller: conseillerDto.id
      })

      // Then
      const attendu: ListeDeDiffusionQueryModel[] = [
        {
          id: listeDeDiffusion1.id,
          titre: listeDeDiffusion1.titre,
          dateDeCreation: listeDeDiffusion1.dateDeCreation,
          beneficiaires: [
            {
              id: jeuneDto.id,
              prenom: jeuneDto.prenom,
              nom: jeuneDto.nom,
              estDansLePortefeuille: true
            }
          ]
        },
        {
          id: listeDeDiffusion2.id,
          titre: listeDeDiffusion2.titre,
          dateDeCreation: listeDeDiffusion2.dateDeCreation,
          beneficiaires: [
            {
              id: jeuneDto.id,
              prenom: jeuneDto.prenom,
              nom: jeuneDto.nom,
              estDansLePortefeuille: true
            }
          ]
        }
      ]
      expect(result).to.deep.equal(success(attendu))
    })
  })
})
