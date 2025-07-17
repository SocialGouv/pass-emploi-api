import { SinonSandbox } from 'sinon'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetComptageJeuneQueryHandler } from '../../../src/application/queries/get-comptage-jeune.query.handler.db'
import { GetComptageJeuneQueryGetter } from '../../../src/application/queries/query-getters/get-comptage-jeune.query.getter'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetComptageJeuneQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getComptageJeuneQueryHandler: GetComptageJeuneQueryHandler
  let queryGetter: StubbedClass<GetComptageJeuneQueryGetter>
  let sandbox: SinonSandbox

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    queryGetter = stubClass(GetComptageJeuneQueryGetter)

    getComptageJeuneQueryHandler = new GetComptageJeuneQueryHandler(
      jeuneAuthorizer,
      conseillerAuthorizer,
      queryGetter
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe("quand le jeune n'est pas bon", () => {
      it('retourne une failure quand il est inexistant', async () => {
        // When
        const result = await getComptageJeuneQueryHandler.handle(
          {
            idJeune: 't',
            accessToken: 'a'
          },
          unUtilisateurJeune()
        )
        // Then
        expect(result).to.deep.equal(failure(new NonTrouveError('Jeune', 't')))
      })
      it('retourne une failure quand il est PACEA', async () => {
        // Given
        const conseiller = unConseillerDto()
        const jeune = unJeuneDto({
          idConseiller: conseiller.id,
          dispositif: Jeune.Dispositif.PACEA
        })
        await ConseillerSqlModel.create(conseiller)
        await JeuneSqlModel.create(jeune)
        // When
        const result = await getComptageJeuneQueryHandler.handle(
          {
            idJeune: jeune.id,
            accessToken: 'a'
          },
          unUtilisateurJeune()
        )
        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError('Le Jeune doit être en dispositif CEJ')
          )
        )
      })
      it('retourne une failure quand il est sans idPartenaire', async () => {
        // Given
        const conseiller = unConseillerDto()
        const jeune = unJeuneDto({
          idConseiller: conseiller.id,
          idPartenaire: null
        })
        await ConseillerSqlModel.create(conseiller)
        await JeuneSqlModel.create(jeune)
        // When
        const result = await getComptageJeuneQueryHandler.handle(
          {
            idJeune: jeune.id,
            accessToken: 'a'
          },
          unUtilisateurJeune()
        )
        // Then
        expect(result).to.deep.equal(
          failure(new MauvaiseCommandeError('Jeune sans idPartenaire'))
        )
      })
    })
    describe('quand le jeune existe', () => {
      it('retourne un comptage sans dates pour un jeune', async () => {
        // Given
        const conseiller = unConseillerDto()
        const jeune = unJeuneDto({ idConseiller: conseiller.id })
        await ConseillerSqlModel.create(conseiller)
        await JeuneSqlModel.create(jeune)
        queryGetter.handle.resolves(
          success({
            nbHeuresDeclarees: 1,
            nbHeuresValidees: 3,
            dateDerniereMiseAJour: uneDatetime().toISO()
          })
        )
        // When
        const result = await getComptageJeuneQueryHandler.handle(
          {
            idJeune: jeune.id,
            accessToken: 'a'
          },
          unUtilisateurJeune()
        )
        // Then
        expect(result).to.deep.equal(
          success({
            nbHeuresDeclarees: 1,
            nbHeuresValidees: 3,
            dateDerniereMiseAJour: uneDatetime().toISO()
          })
        )
        expect(queryGetter.handle).to.have.been.calledOnceWithExactly({
          idJeune: jeune.id,
          idDossier: jeune.idPartenaire!,
          accessTokenJeune: 'a',
          accessTokenConseiller: undefined
        })
      })
      it('retourne un comptage avec dates pour un conseiller', async () => {
        // Given
        const conseiller = unConseillerDto()
        const jeune = unJeuneDto({ idConseiller: conseiller.id })
        await ConseillerSqlModel.create(conseiller)
        await JeuneSqlModel.create(jeune)
        queryGetter.handle.resolves(
          success({
            nbHeuresDeclarees: 1,
            nbHeuresValidees: 3,
            dateDerniereMiseAJour: uneDatetime().toISO()
          })
        )
        // When
        const result = await getComptageJeuneQueryHandler.handle(
          {
            idJeune: jeune.id,
            accessToken: 'a'
          },
          unUtilisateurConseiller()
        )
        // Then
        expect(result).to.deep.equal(
          success({
            nbHeuresDeclarees: 1,
            nbHeuresValidees: 3,
            dateDerniereMiseAJour: uneDatetime().toISO()
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
  })

  describe('authorize', () => {
    it('Valide le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query = {
        idJeune: 'id-jeune',
        accessToken: 'a'
      }

      // When
      await getComptageJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'id-jeune',
        utilisateur,
        true
      )
    })
    it('Valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query = {
        idJeune: 'id-jeune',
        accessToken: 'a'
      }

      // When
      await getComptageJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerPourSonJeune
      ).to.have.been.calledWithExactly('id-jeune', utilisateur, true)
    })
  })
})
