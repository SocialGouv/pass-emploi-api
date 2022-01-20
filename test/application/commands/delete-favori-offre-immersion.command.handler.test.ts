import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { FavoriAuthorizer } from '../../../src/application/authorizers/authorize-favori'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from '../../../src/application/commands/delete-favori-offre-immersion.command.handler'
import { FavoriNonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import {
  OffreImmersion,
  OffresImmersion
} from '../../../src/domain/offre-immersion'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

describe('DeleteFavoriOffreImmersionCommandHandler', () => {
  DatabaseForTesting.prepare()
  let offresImmersionHttpSqlRepository: StubbedType<OffresImmersion.Repository>
  let favoriAuthorizer: StubbedClass<FavoriAuthorizer>
  let deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler
  let offreImmersion: OffreImmersion
  const jeune = unJeune()

  beforeEach(async () => {
    offreImmersion = uneOffreImmersion()
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionHttpSqlRepository = stubInterface(sandbox)
    favoriAuthorizer = stubClass(FavoriAuthorizer)

    deleteFavoriOffreImmersionCommandHandler =
      new DeleteFavoriOffreImmersionCommandHandler(
        offresImmersionHttpSqlRepository,
        favoriAuthorizer
      )
  })

  describe('handle', () => {
    describe('quand le favori existe', () => {
      it('supprime le favori', async () => {
        // Given
        offresImmersionHttpSqlRepository.getFavori
          .withArgs(jeune.id, offreImmersion.id)
          .resolves(offreImmersion)

        const command: DeleteFavoriOffreImmersionCommand = {
          idOffreImmersion: offreImmersion.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreImmersionCommandHandler.handle(
          command
        )
        // Then
        expect(
          offresImmersionHttpSqlRepository.deleteFavori
        ).to.have.been.calledWith(jeune.id, offreImmersion.id)
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le favori n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        offresImmersionHttpSqlRepository.getFavori
          .withArgs(jeune.id, offreImmersion.id)
          .resolves(undefined)

        const command: DeleteFavoriOffreImmersionCommand = {
          idOffreImmersion: offreImmersion.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreImmersionCommandHandler.handle(
          command
        )
        // Then
        expect(result).to.deep.equal(
          failure(
            new FavoriNonTrouveError(command.idJeune, command.idOffreImmersion)
          )
        )
        expect(
          offresImmersionHttpSqlRepository.deleteFavori
        ).not.to.have.been.calledWith(jeune.id, offreImmersion.id)
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune a supprimer son favori', async () => {
      // Given
      const command: DeleteFavoriOffreImmersionCommand = {
        idOffreImmersion: offreImmersion.id,
        idJeune: jeune.id
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await deleteFavoriOffreImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(favoriAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        command.idOffreImmersion,
        utilisateur
      )
    })
  })
})
