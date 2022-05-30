import { SinonSandbox } from 'sinon'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import {
  GetConseillersJeuneQuery,
  GetConseillersJeuneQueryHandler
} from '../../../src/application/queries/get-conseillers-jeune.query.handler'
import { GetDetailJeuneQuery } from '../../../src/application/queries/get-detail-jeune.query.handler'
import { HistoriqueConseillerJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-models'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneAutreDate } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetConseillersJeuneQueryHandler', () => {
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)

    getConseillersJeuneQueryHandler = new GetConseillersJeuneQueryHandler(
      conseillerForJeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idJeune = '1'
    const idConseiller = '1'
    const query: GetConseillersJeuneQuery = { idJeune }
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
        expect(result).to.be.deep.equal(expectedResult)
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
          idConseillerSource
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
        expect(result).to.be.deep.equal(expectedResult)
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
          idConseillerSource: idConseillerSource2
        }
        await TransfertConseillerSqlModel.creer(unTransfert)
        const dateTransfert2 = new Date('2022-04-08T03:24:00')
        const unAutreTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce9',
          dateTransfert: dateTransfert2,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource
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
        expect(result).to.be.deep.equal(expectedResult)
      })
    })
  })

  describe('authorize', () => {
    it('valide le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await getConseillersJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerForJeuneAuthorizer.authorize
      ).to.have.been.calledWithExactly(utilisateur.id, utilisateur)
    })
  })
})
