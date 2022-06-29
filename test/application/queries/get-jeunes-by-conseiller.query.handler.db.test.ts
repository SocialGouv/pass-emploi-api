import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { GetJeunesByConseillerQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler.db'
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
import { unDetailJeuneConseillerQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('GetJeunesByConseillerQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)

    getJeunesByConseillerQueryHandler = new GetJeunesByConseillerQueryHandler(
      databaseForTesting.sequelize,
      conseillersRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idConseiller = '1'
    it("retourne les jeunes d'un conseiller", async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

      // When
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller
      })
      // Then
      expect(actual).to.deep.equal(
        success([unDetailJeuneConseillerQueryModel()])
      )
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
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          {
            ...unDetailJeuneConseillerQueryModel(),
            lastActivity: dateEvenement.toISOString()
          }
        ])
      )
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
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          {
            ...unDetailJeuneConseillerQueryModel(),
            lastActivity: dateEvenementRecent.toISOString()
          }
        ])
      )
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
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller
      })

      // Then
      expect(actual).to.deep.equal(
        success([unDetailJeuneConseillerQueryModel()])
      )
    })
    it("retourne tableau vide quand le conseiller n'existe pas", async () => {
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller: 'id-inexistant'
      })

      expect(actual).to.deep.equal(success([]))
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
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller: idConseillerCible
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          {
            ...unDetailJeuneConseillerQueryModel({ id: idJeune }),
            conseillerPrecedent: {
              email: '43@43.com',
              nom: 'Tavernier',
              prenom: 'Nils'
            }
          }
        ])
      )
    })
    it("retourne les jeunes d'un conseiller avec situation courante", async () => {
      // Given
      const idJeune = '1'
      const situationsDuJeune = uneSituationsMiloDto({ idJeune })
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ id: idJeune, idConseiller }))
      await SituationsMiloSqlModel.create(situationsDuJeune)

      // When
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller: idConseiller
      })
      // Then
      expect(actual).to.deep.equal(
        success([
          unDetailJeuneConseillerQueryModel({
            id: idJeune,
            situationCourante: situationsDuJeune.situationCourante ?? undefined
          })
        ])
      )
    })
    it("retourne les jeunes d'un conseiller avec l'information de réaffectation temporaire", async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await ConseillerSqlModel.creer(unConseillerDto({ id: '41' }))
      await JeuneSqlModel.creer(
        unJeuneDto({ idConseiller, idConseillerInitial: '41' })
      )

      // When
      const actual = await getJeunesByConseillerQueryHandler.handle({
        idConseiller
      })
      // Then
      expect(actual).to.deep.equal(
        success([
          unDetailJeuneConseillerQueryModel({ isReaffectationTemporaire: true })
        ])
      )
    })
  })

  describe('authorize', () => {
    const query = {
      idConseiller: 'idConseiller'
    }

    describe("quand le conseiller concerné est l'utilisateur", () => {
      it('autorise le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: query.idConseiller })
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )
        // When
        const result = await getJeunesByConseillerQueryHandler.authorize(
          query,
          utilisateur
        )
        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe("quand le conseiller concerné n'existe pas", () => {
      it('renvoie un échec NonTrouve', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )

        // When
        const result = await getJeunesByConseillerQueryHandler.authorize(
          { idConseiller: 'un-autre-id' },
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur n'est pas le conseiller concerné", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'au-autre-id' })
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )

        // When
        const result = await getJeunesByConseillerQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
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
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const result = await getJeunesByConseillerQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
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
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const result = await getJeunesByConseillerQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
