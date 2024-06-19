import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneMiloAArchiverSqlModel } from 'src/infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { DateService } from 'src/utils/date-service'
import { uneAutreDate, uneDate } from 'test/fixtures/date.fixture'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { testConfig } from 'test/utils/module-for-testing'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  GetDetailJeuneQuery,
  GetDetailJeuneQueryHandler
} from '../../../src/application/queries/get-detail-jeune.query.handler.db'
import { JeuneMilo } from '../../../src/domain/milo/jeune.milo'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { ConseillerInterAgenceAuthorizer } from '../../../src/application/authorizers/conseiller-inter-agence-authorizer'

describe('GetDetailJeuneQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getDetailJeuneQueryHandler = new GetDetailJeuneQueryHandler(
      jeuneAuthorizer,
      conseillerAgenceAuthorizer,
      testConfig()
    )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe("quand le jeune n'existe pas", () => {
      const idJeune = 'inconnu'
      it('retourne une failure', async () => {
        // When
        const result = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', idJeune))
        )
      })
    })
    describe("quand il n'y a pas eu de transfert", () => {
      const idJeune = '1'
      const idConseiller = '1'
      const conseillerDto = unConseillerDto({ id: idConseiller })
      beforeEach(async () => {
        await ConseillerSqlModel.creer(conseillerDto)
      })

      it('retourne un jeune avec son conseiller avec la date de creation du jeune', async () => {
        // Given
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller,
            structure: Core.Structure.MILO
          })
        )

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: conseillerDto.id,
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          situations: undefined,
          estAArchiver: false,
          urlDossier: 'https://milo.com/1234/acces-externe'
        })
        expect(actual).to.deep.equal(success(expected))
      })

      it('retourne un jeune  avec la date de fin de CEJ du jeune', async () => {
        // Given
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller,
            structure: Core.Structure.MILO,
            dateFinCEJ: uneDate()
          })
        )

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: conseillerDto.id,
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          situations: undefined,
          dateFinCEJ: DateService.fromJSDateToISOString(uneDate()),
          urlDossier: 'https://milo.com/1234/acces-externe',
          estAArchiver: false
        })
        expect(actual).to.deep.equal(success(expected))
      })

      it('retourne un jeune avec ses situations', async () => {
        // Given
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller,
            structure: Core.Structure.MILO
          })
        )
        await SituationsMiloSqlModel.create({
          idJeune,
          situations: [
            {
              etat: JeuneMilo.EtatSituation.EN_COURS,
              categorie: JeuneMilo.CategorieSituation.EMPLOI
            }
          ]
        })

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: conseillerDto.id,
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          situations: [{ etat: 'EN_COURS', categorie: 'Emploi' }],
          estAArchiver: false,
          urlDossier: 'https://milo.com/1234/acces-externe'
        })
        expect(actual).to.deep.equal(success(expected))
      })
      describe('quand il y a un id externe', () => {
        describe('pour un Jeune MILO', () => {
          it("retourne l'url MILO", async () => {
            // Given
            await JeuneSqlModel.creer(
              unJeuneDto({
                id: idJeune,
                idConseiller,
                structure: Core.Structure.MILO,
                idPartenaire: '123'
              })
            )
            await JeuneMiloAArchiverSqlModel.create({ idJeune })

            // When
            const result = await getDetailJeuneQueryHandler.handle({ idJeune })

            // Then
            expect(result._isSuccess).to.be.true()
            if (isSuccess(result)) {
              expect(result.data.urlDossier).to.equal(
                'https://milo.com/123/acces-externe'
              )
              expect(result.data.estAArchiver).to.equal(true)
            }
          })
        })
        describe('pour un Jeune PE', () => {
          it("retourne l'id externe", async () => {
            // Given
            await JeuneSqlModel.creer(
              unJeuneDto({
                id: idJeune,
                idConseiller,
                structure: Core.Structure.POLE_EMPLOI,
                idPartenaire: '123'
              })
            )
            // When
            const result = await getDetailJeuneQueryHandler.handle({ idJeune })
            // Then
            expect(result._isSuccess).to.be.true()
            if (isSuccess(result)) {
              expect(result.data.idPartenaire).to.equal('123')
            }
          })
        })
      })
      describe("quand il n'y a pas d'id externe", () => {
        describe('pour un Jeune MILO', () => {
          it("ne retourne pas d'url MILO", async () => {
            // Given
            await JeuneSqlModel.creer(
              unJeuneDto({
                id: idJeune,
                idConseiller,
                structure: Core.Structure.MILO,
                idPartenaire: undefined
              })
            )
            // When
            const result = await getDetailJeuneQueryHandler.handle({ idJeune })
            // Then
            expect(result._isSuccess).to.be.true()
            if (isSuccess(result)) {
              expect(result.data.urlDossier).to.be.undefined()
            }
          })
        })
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
            idConseiller,
            structure: Core.Structure.MILO
          })
        )
        const dateTransfert = uneAutreDate()
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource,
          idConseillerQuiTransfert: null,
          emailJeune: 'plop',
          typeTransfert: null
        }
        await TransfertConseillerSqlModel.creer(unTransfert)

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: conseillerDto.id,
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert.toISOString()
          },
          situations: undefined,
          estAArchiver: false,
          urlDossier: 'https://milo.com/1234/acces-externe'
        })
        expect(actual).to.deep.equal(success(expected))
      })
    })
    describe('quand il y a eu un transfert temporaire', () => {
      const idJeune = '1'
      const idConseiller = '1'
      beforeEach(async () => {
        await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
        await ConseillerSqlModel.creer(unConseillerDto({ id: '41' }))
      })

      it("retourne un jeune avec l'information de réaffectation temporaire", async () => {
        // Given
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller,
            idConseillerInitial: '41',
            structure: Core.Structure.MILO
          })
        )

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: idConseiller,
            email: unConseillerDto({ id: idConseiller }).email!,
            nom: unConseillerDto({ id: idConseiller }).nom,
            prenom: unConseillerDto({ id: idConseiller }).prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          },
          isReaffectationTemporaire: true,
          situations: undefined,
          estAArchiver: false,
          urlDossier: 'https://milo.com/1234/acces-externe'
        })
        expect(actual).to.deep.equal(success(expected))
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
            idConseiller,
            structure: Core.Structure.MILO
          })
        )
        const dateTransfert1 = new Date('2022-04-02T03:24:00')
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert: dateTransfert1,
          idJeune,
          idConseillerCible: idConseillerSource,
          idConseillerSource: idConseillerSource2,
          idConseillerQuiTransfert: null,
          emailJeune: 'plop',
          typeTransfert: null
        }
        await TransfertConseillerSqlModel.creer(unTransfert)
        const dateTransfert2 = new Date('2022-04-08T03:24:00')
        const unAutreTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce9',
          dateTransfert: dateTransfert2,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource,
          idConseillerQuiTransfert: null,
          emailJeune: 'plop',
          typeTransfert: null
        }
        await TransfertConseillerSqlModel.creer(unAutreTransfert)

        // When
        const actual = await getDetailJeuneQueryHandler.handle({ idJeune })
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            id: conseillerDto.id,
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert2.toISOString()
          },
          situations: undefined,
          estAArchiver: false,
          urlDossier: 'https://milo.com/1234/acces-externe'
        })
        expect(actual).to.deep.equal(success(expected))
      })
    })
  })

  describe('authorize', () => {
    it("appelle l'authorizer pour le conseiller", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      const query: GetDetailJeuneQuery = {
        idJeune: 'idJeune'
      }

      // When
      await getDetailJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
      ).to.have.been.calledWithExactly(query.idJeune, utilisateur)
    })
    it("appelle l'authorizer pour le jeune", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur
      )
    })
  })
})
