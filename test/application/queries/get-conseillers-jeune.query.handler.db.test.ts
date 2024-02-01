import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerInterAgenceAuthorizer } from '../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import {
  GetConseillersJeuneQuery,
  GetConseillersJeuneQueryHandler
} from '../../../src/application/queries/get-conseillers-jeune.query.handler.db'
import { HistoriqueConseillerJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-model'
import { Core } from '../../../src/domain/core'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneAutreDate } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { Jeune } from '../../../src/domain/jeune/jeune'

describe('GetConseillersJeuneQueryHandler', () => {
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)

    getConseillersJeuneQueryHandler = new GetConseillersJeuneQueryHandler(
      conseillerAgenceAuthorizer
    )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idJeune = '1'
    const idConseiller = '1'
    const query: GetConseillersJeuneQuery = { idJeune }
    describe("quand le jeune n'existe pas", () => {
      const idJeune = 'inconnu'
      it('retourne une failure', async () => {
        // When
        const result = await getConseillersJeuneQueryHandler.handle({ idJeune })
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', idJeune))
        )
      })
    })
    describe("quand il n'y a pas eu de transfert", () => {
      it('retourne uniquement le conseiller initial', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const jeuneDto = unJeuneDto({
          id: idJeune,
          idConseiller
        })
        await JeuneSqlModel.creer(jeuneDto)

        // When
        const result = await getConseillersJeuneQueryHandler.handle(query)

        // Then
        const expectedResult: HistoriqueConseillerJeuneQueryModel[] = [
          {
            id: conseillerDto.id,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            email: conseillerDto.email!,
            date: jeuneDto.dateCreation.toISOString()
          }
        ]
        expect(result).to.be.deep.equal(success(expectedResult))
      })
    })
    describe('quand il y a eu un transfert', () => {
      it('retourne le conseiller initial et le nouveau conseiller', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreConseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreConseillerDto)

        const jeuneDto = unJeuneDto({
          id: idJeune,
          idConseiller
        })
        await JeuneSqlModel.creer(jeuneDto)
        const dateTransfert = uneAutreDate()
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource,
          idConseillerQuiTransfert: idConseillerSource,
          typeTransfert: Jeune.TypeTransfert.DEFINITIF,
          emailJeune: jeuneDto.email
        }
        await TransfertConseillerSqlModel.creer(unTransfert)

        // When
        const result = await getConseillersJeuneQueryHandler.handle(query)

        // Then
        const expectedResult: HistoriqueConseillerJeuneQueryModel[] = [
          {
            id: conseillerDto.id,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            email: conseillerDto.email!,
            date: unTransfert.dateTransfert.toISOString()
          },
          {
            id: unAutreConseillerDto.id,
            nom: unAutreConseillerDto.nom,
            prenom: unAutreConseillerDto.prenom,
            email: unAutreConseillerDto.email!,
            date: jeuneDto.dateCreation.toISOString()
          }
        ]
        expect(result).to.be.deep.equal(success(expectedResult))
      })
    })
    describe('quand il y a eu au moins deux transferts', () => {
      it('retourne les conseillers', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreConseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreConseillerDto)
        const idConseillerSource2 = '3'
        const encoreUnAutreConseillerDto = unConseillerDto({
          id: idConseillerSource2
        })
        await ConseillerSqlModel.creer(encoreUnAutreConseillerDto)

        const jeuneDto = unJeuneDto({
          id: idJeune,
          idConseiller
        })
        await JeuneSqlModel.creer(jeuneDto)
        const dateTransfert1 = new Date('2022-04-02T03:24:00')
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert: dateTransfert1,
          idJeune,
          idConseillerCible: idConseillerSource,
          idConseillerSource: idConseillerSource2,
          idConseillerQuiTransfert: idConseillerSource,
          typeTransfert: Jeune.TypeTransfert.DEFINITIF,
          emailJeune: jeuneDto.email
        }
        await TransfertConseillerSqlModel.creer(unTransfert)
        const dateTransfert2 = new Date('2022-04-08T03:24:00')
        const unAutreTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce9',
          dateTransfert: dateTransfert2,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource,
          idConseillerQuiTransfert: idConseillerSource,
          typeTransfert: Jeune.TypeTransfert.DEFINITIF,
          emailJeune: jeuneDto.email
        }
        await TransfertConseillerSqlModel.creer(unAutreTransfert)

        // When
        const result = await getConseillersJeuneQueryHandler.handle(query)

        // Then
        const expectedResult: HistoriqueConseillerJeuneQueryModel[] = [
          {
            id: conseillerDto.id,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            email: conseillerDto.email!,
            date: unAutreTransfert.dateTransfert.toISOString()
          },
          {
            id: unAutreConseillerDto.id,
            nom: unAutreConseillerDto.nom,
            prenom: unAutreConseillerDto.prenom,
            email: unAutreConseillerDto.email!,
            date: unTransfert.dateTransfert.toISOString()
          },
          {
            id: encoreUnAutreConseillerDto.id,
            nom: encoreUnAutreConseillerDto.nom,
            prenom: encoreUnAutreConseillerDto.prenom,
            email: encoreUnAutreConseillerDto.email!,
            date: jeuneDto.dateCreation.toISOString()
          }
        ]
        expect(result).to.be.deep.equal(success(expectedResult))
      })
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      const query = {
        idJeune: 'id-jeune'
      }

      // When
      await getConseillersJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
      ).to.have.been.calledWithExactly('id-jeune', utilisateur)
    })
  })
})
