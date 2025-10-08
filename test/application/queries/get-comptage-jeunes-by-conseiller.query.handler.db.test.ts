import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { GetComptageJeunesByConseillerQueryHandler } from '../../../src/application/queries/get-comptage-jeunes-by-conseiller.query.handler.db'
import { GetComptageJeuneQueryGetter } from '../../../src/application/queries/query-getters/get-comptage-jeune.query.getter'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetComptageJeunesByConseillerQueryHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let dateService: StubbedClass<DateService>
  let getComptageJeunesByConseillerQueryHandler: GetComptageJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox
  let queryGetter: StubbedClass<GetComptageJeuneQueryGetter>

  before(() => {
    sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    dateService = stubClass(DateService)
    queryGetter = stubClass(GetComptageJeuneQueryGetter)
    dateService.now.returns(uneDatetime())

    getComptageJeunesByConseillerQueryHandler =
      new GetComptageJeunesByConseillerQueryHandler(
        conseillerRepository,
        dateService,
        queryGetter
      )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne un comptage', async () => {
      // Given
      const conseiller = unConseillerDto()
      const jeune = unJeuneDto({ idConseiller: conseiller.id })
      const jeunePacea = unJeuneDto({
        id: 'PACEA',
        idConseiller: conseiller.id,
        dispositif: Jeune.Dispositif.PACEA
      })
      await ConseillerSqlModel.create(conseiller)
      await JeuneSqlModel.create(jeune)
      await JeuneSqlModel.create(jeunePacea)
      queryGetter.handle.resolves(
        success({
          nbHeuresDeclarees: 1,
          nbHeuresValidees: 0,
          dateDerniereMiseAJour: uneDatetime().minus({ hours: 1 }).toISO()
        })
      )
      // When
      const result = await getComptageJeunesByConseillerQueryHandler.handle(
        {
          idConseiller: conseiller.id,
          accessToken: 'a'
        },
        unUtilisateurConseiller()
      )
      // Then
      expect(result).to.deep.equal(
        success({
          comptages: [{ idJeune: jeune.id, nbHeuresDeclarees: 1 }],
          dateDerniereMiseAJour: uneDatetime().minus({ hours: 1 }).toISO()
        })
      )
      expect(queryGetter.handle).to.have.been.calledOnceWithExactly({
        idJeune: jeune.id,
        idDossier: jeune.idPartenaire!,
        accessTokenJeune: undefined,
        accessTokenConseiller: 'a'
      })
    })
  })

  describe('authorize', () => {
    const query = {
      idConseiller: 'idConseiller',
      accessToken: 'ok'
    }

    describe("quand le conseiller concerné est l'utilisateur", () => {
      it('autorise le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: query.idConseiller })
        conseillerRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )
        // When
        const result =
          await getComptageJeunesByConseillerQueryHandler.authorize(
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
        conseillerRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )

        // When
        const result =
          await getComptageJeunesByConseillerQueryHandler.authorize(
            { idConseiller: 'un-autre-id', accessToken: 'ok' },
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
        conseillerRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )
        conseillerRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )

        // When
        const result =
          await getComptageJeunesByConseillerQueryHandler.authorize(
            query,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un superviseur + MILO", () => {
      it('retourne les jeunes du conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.MILO,
          roles: [Authentification.Role.SUPERVISEUR]
        })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.MILO
          })
        )
        conseillerRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.MILO
          })
        )

        // When
        const result =
          await getComptageJeunesByConseillerQueryHandler.authorize(
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
        conseillerRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        conseillerRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const result =
          await getComptageJeunesByConseillerQueryHandler.authorize(
            query,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
