import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetJeunesByConseillerQuery,
  GetJeunesByConseillerQueryHandler
} from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { TransfertConseillerSqlModel } from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import {
  uneDatetime,
  uneDatetimeMoinsRecente
} from 'test/fixtures/date.fixture'
import { uneSituationsMiloDto } from 'test/fixtures/milo.fixture'
import {
  unDetailJeuneConseillerQueryModel,
  unDetailJeuneQueryModel
} from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

describe('GetJeunesByConseillerQueryHandler', () => {
  const db = DatabaseForTesting.prepare()
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getJeunesByConseillerQueryHandler = new GetJeunesByConseillerQueryHandler(
      db.sequelize,
      conseillersRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idConseiller = 'idConseiller'
    const getJeunesByConseillerQuery: GetJeunesByConseillerQuery = {
      idConseiller
    }
    beforeEach(async () => {
      conseillersRepository.get.withArgs(idConseiller).resolves(
        unConseiller({
          id: idConseiller,
          structure: Core.Structure.POLE_EMPLOI
        })
      )

      sandbox
        .stub(
          GetJeunesByConseillerQueryHandler.prototype,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'getAllQueryModelsByConseiller' as any
        )
        .withArgs(idConseiller)
        .resolves([
          { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
        ])
    })

    describe("quand le conseiller concerné est l'utilisateur", () => {
      it('retourne un tableau de jeunes', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: idConseiller })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          success([
            { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
          ])
        )
      })
    })

    describe("quand le conseiller concerné n'existe pas", () => {
      it('renvoie un échec NonTrouve', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          { idConseiller: 'un-autre-id' },
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          failure(new NonTrouveError('Conseiller', 'un-autre-id'))
        )
      })
    })

    describe("quand l'utilisateur n'est pas le conseiller concerné", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'au-autre-id' })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un superviseur", () => {
      it('retourne les jeunes du conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.POLE_EMPLOI,
          roles: [Authentification.Role.SUPERVISEUR]
        })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          success([
            { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
          ])
        )
      })
    })

    describe("quand l'utilisateur est un superviseur d'une autre structure", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.MILO,
          roles: [Authentification.Role.SUPERVISEUR]
        })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('getAllQueryModelsByConseiller', () => {
    const idConseiller = '1'
    it("retourne les jeunes d'un conseiller", async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseiller
        )
      // Then
      expect(actual).to.deep.equal([unDetailJeuneConseillerQueryModel()])
    })
    it("retourne les jeunes d'un conseiller avec la date d'evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseiller
        )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel(),
          lastActivity: dateEvenement.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller avec la date du DERNIER evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenementRecent = uneDatetime.toJSDate()
      const dateEvenementAncien = uneDatetimeMoinsRecente.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementAncien
      })
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementRecent
      })

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseiller
        )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel(),
          lastActivity: dateEvenementRecent.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller sans la date d'evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: 'faux-id',
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseiller
        )

      // Then
      expect(actual).to.deep.equal([unDetailJeuneConseillerQueryModel()])
    })
    it("retourne tableau vide quand le conseiller n'existe pas", async () => {
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          'id-inexistant'
        )

      expect(actual).to.deep.equal([])
    })
    it("retourne les jeunes d'un conseiller avec l'email du conseiller precedent en prenant le dernier transfert", async () => {
      // Given
      const idConseillerSource = '1'
      const idConseillerCible = '2'
      const idDernierConseillerPrecedent = '43'
      const idJeune = '1'
      const jeune = unJeuneDto({
        id: idJeune,
        idConseiller: idConseillerCible
      })
      const dateTransfert = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idConseillerSource,
          email: '1@1.com'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idConseillerCible,
          email: '2@2.com'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idDernierConseillerPrecedent,
          email: '43@43.com'
        })
      )
      await JeuneSqlModel.creer(jeune)
      await TransfertConseillerSqlModel.create({
        id: '39d6cbf4-8507-11ec-a8a3-0242ac120002',
        idConseillerSource,
        idConseillerCible,
        idJeune,
        dateTransfert
      })
      await TransfertConseillerSqlModel.create({
        id: '39d6cbf4-8507-11ec-a8a3-0242ac120003',
        idConseillerSource: idDernierConseillerPrecedent,
        idConseillerCible,
        idJeune,
        dateTransfert: uneDatetime.plus({ week: 1 }).toJSDate()
      })

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseillerCible
        )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel({ id: idJeune }),
          conseillerPrecedent: {
            email: '43@43.com',
            nom: 'Tavernier',
            prenom: 'Nils'
          }
        }
      ])
    })
    it("retourne les jeunes d'un conseiller avec situation courante", async () => {
      // Given
      const idJeune = '1'
      const situationsDuJeune = uneSituationsMiloDto({ idJeune })
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ id: idJeune, idConseiller }))
      await SituationsMiloSqlModel.create(situationsDuJeune)

      // When
      const actual =
        await getJeunesByConseillerQueryHandler.getAllQueryModelsByConseiller(
          idConseiller
        )
      // Then
      expect(actual).to.deep.equal([
        unDetailJeuneConseillerQueryModel({
          id: idJeune,
          situationCourante: situationsDuJeune.situationCourante ?? undefined
        })
      ])
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetJeunesByConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getJeunesByConseillerQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.authorizeConseiller
      ).to.have.been.calledWithExactly(utilisateur)
    })
  })
})
