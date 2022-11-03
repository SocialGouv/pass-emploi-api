import { SinonSandbox } from 'sinon'
import { GetDetailRendezVousQueryHandler } from '../../../src/application/queries/get-detail-rendez-vous.query.handler.db'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { failure, success } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { RendezVousConseillerQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { CodeTypeRendezVous } from '../../../src/domain/rendez-vous'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('GetDetailRendezVousQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    getDetailRendezVousQueryHandler = new GetDetailRendezVousQueryHandler(
      rendezVousAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe("quand le rdv n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: idRdv
        })

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('RendezVous', idRdv))
        )
      })
    })
    describe('quand le rdv existe', () => {
      it('retourne le rdv quand il y a un jeune participant', async () => {
        // Given
        const jeune = unJeune()
        await ConseillerSqlModel.creer(unConseillerDto())
        await JeuneSqlModel.creer(unJeuneDto())

        const unRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          titre: 'UN RENDEZ VOUS'
        })

        await RendezVousSqlModel.create({
          ...unRendezVous
        })

        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: jeune.id,
          idRendezVous: unRendezVous.id
        })

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: unRendezVous.id
        })

        // Then
        const data: RendezVousConseillerQueryModel = {
          adresse: undefined,
          comment: 'commentaire',
          createur: {
            id: '1',
            nom: 'Tavernier',
            prenom: 'Nils'
          },
          date: uneDatetime().toJSDate(),
          duration: 30,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'ABCDE',
              nom: 'Doe',
              prenom: 'John'
            }
          ],
          modality: 'modalite',
          organisme: undefined,
          precision: undefined,
          presenceConseiller: true,
          invitation: false,
          title: 'UN RENDEZ VOUS',
          type: {
            code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
            label: 'Entretien individuel conseiller'
          }
        }
        expect(result).to.deep.equal(success(data))
      })

      it('retourne le rdv quand il y a plusieurs jeunes participants', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto())
        const jeune1 = await JeuneSqlModel.creer(unJeuneDto())
        const jeune2 = await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'PLOP'
          })
        )

        const unRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          titre: 'UN RENDEZ VOUS'
        })

        await RendezVousSqlModel.create({
          ...unRendezVous
        })

        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          {
            idJeune: jeune1.id,
            idRendezVous: unRendezVous.id
          },
          {
            idJeune: jeune2.id,
            idRendezVous: unRendezVous.id
          }
        ])

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: unRendezVous.id
        })

        // Then
        const data: RendezVousConseillerQueryModel = {
          adresse: undefined,
          comment: 'commentaire',
          createur: {
            id: '1',
            nom: 'Tavernier',
            prenom: 'Nils'
          },
          date: uneDatetime().toJSDate(),
          duration: 30,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'ABCDE',
              nom: 'Doe',
              prenom: 'John'
            },
            {
              id: 'PLOP',
              nom: 'Doe',
              prenom: 'John'
            }
          ],
          modality: 'modalite',
          organisme: undefined,
          precision: undefined,
          presenceConseiller: true,
          invitation: false,
          title: 'UN RENDEZ VOUS',
          type: {
            code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
            label: 'Entretien individuel conseiller'
          }
        }
        expect(result).to.deep.equal(success(data))
      })

      it('retourne le rdv avec les bons jeunes', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto())
        const jeune1 = await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'jeune-1'
          })
        )
        const jeune2 = await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'jeune-2'
          })
        )
        const jeune3 = await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'jeune-3'
          })
        )
        const unRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          titre: 'UN RENDEZ VOUS'
        })
        const unAutreRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          titre: 'UN RENDEZ VOUS'
        })

        await RendezVousSqlModel.bulkCreate([unRendezVous, unAutreRendezVous])

        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          {
            idJeune: jeune1.id,
            idRendezVous: unRendezVous.id
          },
          {
            idJeune: jeune2.id,
            idRendezVous: unRendezVous.id
          },
          {
            idJeune: jeune3.id,
            idRendezVous: unAutreRendezVous.id
          }
        ])

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: unRendezVous.id
        })

        // Then
        const data: RendezVousConseillerQueryModel = {
          adresse: undefined,
          comment: 'commentaire',
          createur: {
            id: '1',
            nom: 'Tavernier',
            prenom: 'Nils'
          },
          date: uneDatetime().toJSDate(),
          duration: 30,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'jeune-1',
              nom: 'Doe',
              prenom: 'John'
            },
            {
              id: 'jeune-2',
              nom: 'Doe',
              prenom: 'John'
            }
          ],
          modality: 'modalite',
          organisme: undefined,
          precision: undefined,
          presenceConseiller: true,
          invitation: false,
          title: 'UN RENDEZ VOUS',
          type: {
            code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
            label: 'Entretien individuel conseiller'
          }
        }
        expect(result).to.deep.equal(success(data))
      })
    })
  })

  describe('authorize', () => {
    it("valide l'autorisation", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ id: 'idConseiller' })

      // When
      await getDetailRendezVousQueryHandler.authorize(
        {
          idRendezVous: 'idRdv'
        },
        utilisateur
      )

      // Then
      expect(rendezVousAuthorizer.authorize).to.have.been.calledWithExactly(
        'idRdv',
        utilisateur
      )
    })
  })
})
