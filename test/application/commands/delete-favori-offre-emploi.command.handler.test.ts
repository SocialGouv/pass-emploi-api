import { FavoriAuthorizer } from '../../../src/application/authorizers/authorize-favori'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
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
import { FavoriNonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { OffreEmploi, OffresEmploi } from '../../../src/domain/offre-emploi'

describe('DeleteFavoriOffreEmploiCommandHandler', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: StubbedType<OffresEmploi.Repository>
  let favoriAuthorizer: StubbedClass<FavoriAuthorizer>
  let deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler
  let offreEmploi: OffreEmploi
  const jeune = unJeune()

  beforeEach(async () => {
    offreEmploi = uneOffreEmploi()
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiHttpSqlRepository = stubInterface(sandbox)
    favoriAuthorizer = stubClass(FavoriAuthorizer)

    deleteFavoriOffreEmploiCommandHandler =
      new DeleteFavoriOffreEmploiCommandHandler(
        offresEmploiHttpSqlRepository,
        favoriAuthorizer
      )
  })

  describe('handle', () => {
    describe('quand le favori existe', () => {
      it('supprime le favori', async () => {
        // Given
        offresEmploiHttpSqlRepository.getFavori
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
        expect(
          offresEmploiHttpSqlRepository.deleteFavori
        ).to.have.been.calledWith(jeune.id, offreEmploi.id)
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le favori n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        offresEmploiHttpSqlRepository.getFavori
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
            new FavoriNonTrouveError(command.idJeune, command.idOffreEmploi)
          )
        )
        expect(
          offresEmploiHttpSqlRepository.deleteFavori
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
      expect(favoriAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        command.idOffreEmploi,
        utilisateur
      )
    })
  })
})
