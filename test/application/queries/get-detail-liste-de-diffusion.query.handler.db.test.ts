import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  GetDetailListeDeDiffusionQuery,
  GetDetailListeDeDiffusionQueryHandler
} from '../../../src/application/queries/get-detail-liste-de-diffusion.query.handler.db'
import { ListeDeDiffusionAuthorizer } from '../../../src/application/authorizers/liste-de-diffusion-authorizer'
import {
  emptySuccess,
  success
} from '../../../src/building-blocks/types/result'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import {
  uneListeDeDiffusionAssociationDto,
  uneListeDeDiffusionDto
} from '../../fixtures/sql-models/liste-de-diffusion-sql.fixture'
import { ListeDeDiffusionSqlModel } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { ListeDeDiffusionQueryModel } from '../../../src/application/queries/query-models/liste-de-diffusion.query-model'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetDetailListeDeDiffusionQueryHandler', () => {
  let listeDiffusionAuthorizer: StubbedClass<ListeDeDiffusionAuthorizer>
  let queryHandler: GetDetailListeDeDiffusionQueryHandler

  beforeEach(async () => {
    await getDatabase().cleanPG()
    listeDiffusionAuthorizer = stubClass(ListeDeDiffusionAuthorizer)
    queryHandler = new GetDetailListeDeDiffusionQueryHandler(
      listeDiffusionAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise le conseiller à consulter une de ses liste de diffusion', async () => {
      // Given
      const query: GetDetailListeDeDiffusionQuery = {
        idListeDeDiffusion: 'id-liste'
      }
      listeDiffusionAuthorizer.autoriserConseillerPourSaListeDeDiffusion
        .withArgs(query.idListeDeDiffusion, unUtilisateurConseiller())
        .resolves(emptySuccess())

      // When
      const result = await queryHandler.authorize(
        query,
        unUtilisateurConseiller()
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })

  describe('handle', () => {
    let conseillerDto: AsSql<ConseillerDto>
    let jeuneDto: AsSql<JeuneDto>

    beforeEach(async () => {
      // Given
      const jeune: Jeune = unJeune({
        conseiller: unConseillerDuJeune({ idAgence: undefined })
      })
      conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })
      jeuneDto = unJeuneDto({
        id: jeune.id,
        idConseiller: conseillerDto.id
      })

      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(jeuneDto)
    })

    it('renvoie la liste de diffusion demandée quand elle existe', async () => {
      // Given
      const idBonneListe = 'f8f9da70-7639-11ed-a1eb-0242ac120002'
      const bonneListeDeDiffusion = uneListeDeDiffusionDto({
        id: idBonneListe,
        idConseiller: conseillerDto.id
      })
      const mauvaiseListeDeDiffusion = uneListeDeDiffusionDto({
        id: 'fe192ba0-7639-11ed-a1eb-0242ac120002',
        idConseiller: conseillerDto.id
      })
      await ListeDeDiffusionSqlModel.bulkCreate([
        bonneListeDeDiffusion,
        mauvaiseListeDeDiffusion
      ])

      await ListeDeDiffusionJeuneAssociationSqlModel.bulkCreate([
        uneListeDeDiffusionAssociationDto({
          idListe: bonneListeDeDiffusion.id,
          idBeneficiaire: jeuneDto.id
        }),
        uneListeDeDiffusionAssociationDto({
          idListe: mauvaiseListeDeDiffusion.id,
          idBeneficiaire: jeuneDto.id
        })
      ])

      const query: GetDetailListeDeDiffusionQuery = {
        idListeDeDiffusion: idBonneListe
      }

      // When
      const result = await queryHandler.handle(query)

      // Then
      const attendu: ListeDeDiffusionQueryModel = {
        id: bonneListeDeDiffusion.id,
        titre: bonneListeDeDiffusion.titre,
        dateDeCreation: bonneListeDeDiffusion.dateDeCreation,
        beneficiaires: [
          {
            id: jeuneDto.id,
            prenom: jeuneDto.prenom,
            nom: jeuneDto.nom,
            estDansLePortefeuille: true
          }
        ]
      }
      expect(result).to.deep.equal(success(attendu))
    })

    it('renvoie une NonTrouveError quand la liste n’existe pas', async () => {
      // Given - When
      const result = await queryHandler.handle({
        idListeDeDiffusion: 'c8ccdca2-763a-11ed-a1eb-0242ac120002'
      })

      // Then
      expect(!result._isSuccess && result.error).to.be.an.instanceOf(
        NonTrouveError
      )
    })
  })
})
