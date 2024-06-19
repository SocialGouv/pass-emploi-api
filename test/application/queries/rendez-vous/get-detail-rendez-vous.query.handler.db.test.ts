import { SinonSandbox } from 'sinon'
import { GetDetailRendezVousQueryHandler } from '../../../../src/application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import {
  failure,
  isSuccess,
  success
} from '../../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../../src/building-blocks/types/domain-error'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import { RendezVousConseillerDetailQueryModel } from '../../../../src/application/queries/query-models/rendez-vous.query-model'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../../src/domain/rendez-vous/rendez-vous'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { RendezVousAuthorizer } from '../../../../src/application/authorizers/rendezvous-authorizer'
import { LogModificationRendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/log-modification-rendez-vous-sql.model'
import { DateService } from '../../../../src/utils/date-service'
import { DateTime } from 'luxon'
import { getDatabase } from '../../../utils/database-for-testing'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { Core } from '../../../../src/domain/core'

const queryModel: RendezVousConseillerDetailQueryModel = {
  adresse: undefined,
  comment: 'commentaire',
  createur: {
    id: '1',
    nom: 'Tavernier',
    prenom: 'Nils'
  },
  date: uneDatetime().toJSDate(),
  duration: 30,
  id: 'fake',
  jeunes: [],
  modality: 'modalite',
  organisme: undefined,
  precision: undefined,
  presenceConseiller: true,
  invitation: false,
  title: 'UN RENDEZ VOUS',
  historique: [],
  type: {
    code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
    label: 'Entretien individuel conseiller'
  },
  source: RendezVous.Source.PASS_EMPLOI,
  nombreMaxParticipants: undefined
}

describe('GetDetailRendezVousQueryHandler', () => {
  let getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let dateService: StubbedClass<DateService>
  let sandbox: SinonSandbox
  const maintenant = uneDate()

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sandbox = createSandbox()
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant)
    getDetailRendezVousQueryHandler = new GetDetailRendezVousQueryHandler(
      rendezVousAuthorizer,
      conseillerAgenceAuthorizer,
      dateService
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
      it("retourne le rdv quand il n'y a aucun jeune participant", async () => {
        // Given
        const unRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          titre: 'UN RENDEZ VOUS'
        })

        await RendezVousSqlModel.create({
          ...unRendezVous
        })

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: unRendezVous.id
        })

        // Then
        const data: RendezVousConseillerDetailQueryModel = {
          ...queryModel,
          id: unRendezVous.id,
          type: { code: CodeTypeRendezVous.ATELIER, label: 'Atelier' },
          statut: RendezVous.AnimationCollective.Statut.A_CLOTURER
        }

        expect(result).to.deep.equal(success(data))
      })
      it('retourne le rdv quand il y a un jeune participant avec nombre max', async () => {
        // Given
        const jeune = unJeune()
        await ConseillerSqlModel.creer(unConseillerDto())
        await JeuneSqlModel.creer(unJeuneDto())

        const unRendezVous = unRendezVousDto({
          date: uneDatetime().toJSDate(),
          titre: 'UN RENDEZ VOUS',
          nombreMaxParticipants: 10
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
        const data: RendezVousConseillerDetailQueryModel = {
          ...queryModel,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'ABCDE',
              nom: 'Doe',
              prenom: 'John',
              futPresent: undefined
            }
          ],
          nombreMaxParticipants: 10
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
        const data: RendezVousConseillerDetailQueryModel = {
          ...queryModel,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'ABCDE',
              nom: 'Doe',
              prenom: 'John',
              futPresent: undefined
            },
            {
              id: 'PLOP',
              nom: 'Doe',
              prenom: 'John',
              futPresent: undefined
            }
          ]
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
        const data: RendezVousConseillerDetailQueryModel = {
          ...queryModel,
          id: unRendezVous.id,
          jeunes: [
            {
              id: 'jeune-1',
              nom: 'Doe',
              prenom: 'John',
              futPresent: undefined
            },
            {
              id: 'jeune-2',
              nom: 'Doe',
              prenom: 'John',
              futPresent: undefined
            }
          ]
        }
        expect(result).to.deep.equal(success(data))
      })
      it('retourne l‘historique des modification quand il est demandé', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const conseillerDto = unConseillerDto({
          id: idConseiller,
          nom: 'Tavernier',
          prenom: 'Nils'
        })
        await ConseillerSqlModel.create(conseillerDto)
        await JeuneSqlModel.create(unJeuneDto({ idConseiller }))

        const idRendezVous = '20c8ca73-fd8b-4194-8d3c-80b6c9949deb'
        await RendezVousSqlModel.create(unRendezVousDto({ id: idRendezVous }))

        const date = maintenant
        const unLogModifRdvDto = {
          id: '24c8ca73-fd8b-3488-8d3c-80b6c9949bed',
          idRendezVous,
          date,
          auteur: {
            id: conseillerDto.id,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom
          }
        }
        await LogModificationRendezVousSqlModel.create(unLogModifRdvDto)

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous
        })

        // Then
        const historiqueAttendu = [
          {
            date: date.toISOString(),
            auteur: {
              id: conseillerDto.id,
              nom: conseillerDto.nom,
              prenom: conseillerDto.prenom
            }
          }
        ]

        expect(isSuccess(result) && result.data.historique).to.deep.equal(
          historiqueAttendu
        )
      })
      it("retourne la présence des jeunes quand c'est une AC cloturée", async () => {
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
        const unAtelierCloture = unRendezVousDto({
          date: DateTime.fromJSDate(maintenant).minus({ days: 2 }).toJSDate(),
          titre: 'UN ATELIER DE FOU',
          type: CodeTypeRendezVous.ATELIER,
          dateCloture: DateTime.fromJSDate(maintenant)
            .minus({ days: 1 })
            .toJSDate()
        })

        await RendezVousSqlModel.create(unAtelierCloture)

        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          {
            idJeune: jeune1.id,
            idRendezVous: unAtelierCloture.id,
            present: true
          },
          {
            idJeune: jeune2.id,
            idRendezVous: unAtelierCloture.id,
            present: false
          }
        ])

        // When
        const result = await getDetailRendezVousQueryHandler.handle({
          idRendezVous: unAtelierCloture.id
        })

        // Then
        const data: RendezVousConseillerDetailQueryModel = {
          ...queryModel,
          id: unAtelierCloture.id,
          title: 'UN ATELIER DE FOU',
          date: DateTime.fromJSDate(maintenant).minus({ days: 2 }).toJSDate(),
          jeunes: [
            {
              id: 'jeune-1',
              nom: 'Doe',
              prenom: 'John',
              futPresent: true
            },
            {
              id: 'jeune-2',
              nom: 'Doe',
              prenom: 'John',
              futPresent: false
            }
          ],
          statut: RendezVous.AnimationCollective.Statut.CLOTUREE,
          type: {
            code: CodeTypeRendezVous.ATELIER,
            label: 'Atelier'
          }
        }
        expect(result).to.deep.equal(success(data))
      })
    })
  })

  describe('authorize', () => {
    it("valide l'autorisation quand c’est un conseiller PE", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({
        id: 'idConseiller',
        structure: Core.Structure.POLE_EMPLOI
      })

      // When
      await getDetailRendezVousQueryHandler.authorize(
        {
          idRendezVous: 'idRdv'
        },
        utilisateur
      )

      // Then
      expect(
        rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune
      ).to.have.been.calledWithExactly('idRdv', utilisateur)
    })
    it("valide l'autorisation quand c’est un conseiller MILO", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({
        id: 'idConseiller',
        structure: Core.Structure.MILO
      })

      // When
      await getDetailRendezVousQueryHandler.authorize(
        {
          idRendezVous: 'idRdv'
        },
        utilisateur
      )

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerMiloPourUnRdvDeSonAgenceOuAvecUnJeuneDansLeRdv
      ).to.have.been.calledWithExactly('idRdv', utilisateur)
    })
  })
})
