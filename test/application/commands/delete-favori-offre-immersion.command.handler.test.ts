import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { FavoriOffresImmersionAuthorizer } from '../../../src/application/authorizers/favori-offres-immersion-authorizer'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from '../../../src/application/commands/delete-favori-offre-immersion.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unFavoriOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Offre } from '../../../src/domain/offre/offre'

describe('DeleteFavoriOffreImmersionCommandHandler', () => {
  let offresImmersionHttpSqlRepository: StubbedType<Offre.Favori.Immersion.Repository>
  let favoriOffresImmersionAuthorizer: StubbedClass<FavoriOffresImmersionAuthorizer>
  let deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler
  let offreImmersion: Offre.Favori.Immersion
  const jeune = unJeune()

  beforeEach(async () => {
    offreImmersion = unFavoriOffreImmersion()
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionHttpSqlRepository = stubInterface(sandbox)
    favoriOffresImmersionAuthorizer = stubClass(FavoriOffresImmersionAuthorizer)

    deleteFavoriOffreImmersionCommandHandler =
      new DeleteFavoriOffreImmersionCommandHandler(
        offresImmersionHttpSqlRepository,
        favoriOffresImmersionAuthorizer
      )
  })

  describe('handle', () => {
    describe('quand le favori existe', () => {
      it('supprime le favori', async () => {
        // Given
        offresImmersionHttpSqlRepository.get
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
        expect(offresImmersionHttpSqlRepository.delete).to.have.been.calledWith(
          jeune.id,
          offreImmersion.id
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le favori n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        offresImmersionHttpSqlRepository.get
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
            new NonTrouveError(
              'Favori',
              `du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreImmersion}`
            )
          )
        )
        expect(
          offresImmersionHttpSqlRepository.delete
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
      expect(
        favoriOffresImmersionAuthorizer.autoriserLeJeunePourSonOffre
      ).to.have.been.calledWithExactly(
        command.idJeune,
        command.idOffreImmersion,
        utilisateur
      )
    })
  })
})
