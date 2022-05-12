import { SinonSandbox } from 'sinon'
import { CategorieSituationMilo, EtatSituationMilo } from 'src/domain/milo'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { uneAutreDate } from 'test/fixtures/date.fixture'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  GetDetailJeuneQuery,
  GetDetailJeuneQueryHandler
} from '../../../src/application/queries/get-detail-jeune.query.handler'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

describe('GetDetailJeuneQueryHandler', () => {
  DatabaseForTesting.prepare()
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getDetailJeuneQueryHandler = new GetDetailJeuneQueryHandler(
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe("quand il n'y a pas eu de transfert", () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date de creation du jeune', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          situations: undefined
        })
        expect(actual).to.deep.equal(expected)
      })
      it('retourne un jeune avec ses situations', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )
        await SituationsMiloSqlModel.create({
          idJeune,
          situations: [
            {
              etat: EtatSituationMilo.EN_COURS,
              categorie: CategorieSituationMilo.EMPLOI
            }
          ]
        })

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          situations: [{ etat: 'EN_COURS', categorie: 'Emploi' }]
        })
        expect(actual).to.deep.equal(expected)
      })
    })
    describe('quand il y a eu un transfert', () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date du transfert', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreconseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreconseillerDto)

        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )
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
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert.toISOString()
          },
          situations: undefined
        })
        expect(actual).to.deep.equal(expected)
      })
    })
    describe('quand il y a eu plusieurs transferts', () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date du dernier transfert', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreconseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreconseillerDto)
        const idConseillerSource2 = '3'
        const encoreUnAutreconseillerDto = unConseillerDto({
          id: idConseillerSource2
        })
        await ConseillerSqlModel.creer(encoreUnAutreconseillerDto)

        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )
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
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert2.toISOString()
          },
          situations: undefined
        })
        expect(actual).to.deep.equal(expected)
      })
    })
  })

  describe('authorize', () => {
    it("appelle l'authorizer pour le conseiller", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await getDetailJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerForJeuneAuthorizer.authorize
      ).to.have.been.calledWithExactly(utilisateur.id, utilisateur)
    })
    it("appelle l'authorizer pour le jeune", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await jeuneAuthorizer.authorize(query.idJeune, utilisateur)

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
