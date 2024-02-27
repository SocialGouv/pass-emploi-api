import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { FavoriOffresEmploiAuthorizer } from '../../../src/application/authorizers/favori-offres-emploi-authorizer'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { Offre } from '../../../src/domain/offre/offre'

describe('DeleteFavoriOffreEmploiCommandHandler', () => {
  let offresEmploiHttpSqlRepository: StubbedType<Offre.Favori.Emploi.Repository>
  let favoriOffresEmploiAuthorizer: StubbedClass<FavoriOffresEmploiAuthorizer>
  let deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler
  let offreEmploi: Offre.Favori.Emploi
  const jeune = unJeune()

  beforeEach(async () => {
    offreEmploi = uneOffreEmploi()
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiHttpSqlRepository = stubInterface(sandbox)
    favoriOffresEmploiAuthorizer = stubClass(FavoriOffresEmploiAuthorizer)

    deleteFavoriOffreEmploiCommandHandler =
      new DeleteFavoriOffreEmploiCommandHandler(
        offresEmploiHttpSqlRepository,
        favoriOffresEmploiAuthorizer
      )
  })

  describe('handle', () => {
    describe('quand le favori existe', () => {
      it('supprime le favori', async () => {
        // Given
        offresEmploiHttpSqlRepository.get
          .withArgs(jeune.id, offreEmploi.id)
          .resolves(offreEmploi)

        const command: DeleteFavoriOffreEmploiCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreEmploiCommandHandler.handle(
          command
        )
        // Then
        expect(offresEmploiHttpSqlRepository.delete).to.have.been.calledWith(
          jeune.id,
          offreEmploi.id
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le favori n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        offresEmploiHttpSqlRepository.get
          .withArgs(jeune.id, offreEmploi.id)
          .resolves(undefined)

        const command: DeleteFavoriOffreEmploiCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreEmploiCommandHandler.handle(
          command
        )
        // Then
        expect(result).to.deep.equal(
          failure(
            new NonTrouveError(
              'Favori',
              `du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreEmploi}`
            )
          )
        )
        expect(
          offresEmploiHttpSqlRepository.delete
        ).not.to.have.been.calledWith(jeune.id, offreEmploi.id)
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune a supprimer son favori', async () => {
      // Given
      const command: DeleteFavoriOffreEmploiCommand = {
        idOffreEmploi: offreEmploi.id,
        idJeune: jeune.id
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await deleteFavoriOffreEmploiCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        favoriOffresEmploiAuthorizer.autoriserLeJeunePourSonOffre
      ).to.have.been.calledWithExactly(
        command.idJeune,
        command.idOffreEmploi,
        utilisateur
      )
    })
  })
})
