import { createSandbox, DatabaseForTesting, expect } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi-command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { Jeune } from '../../../src/domain/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  FavoriNonTrouveError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { OffreEmploi, OffresEmploi } from '../../../src/domain/offre-emploi'

describe('DeleteFavoriOffreEmploiCommandHandler', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: StubbedType<OffresEmploi.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler
  let offreEmploi: OffreEmploi
  const jeune = unJeune()
  beforeEach(async () => {
    offreEmploi = uneOffreEmploi()
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiHttpSqlRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    deleteFavoriOffreEmploiCommandHandler =
      new DeleteFavoriOffreEmploiCommandHandler(
        offresEmploiHttpSqlRepository,
        jeuneRepository
      )
  })
  describe('execute', () => {
    describe('quand le favori existe', () => {
      it('supprime le favori', async () => {
        // Given
        offresEmploiHttpSqlRepository.getFavori
          .withArgs(jeune.id, offreEmploi.id)
          .resolves(offreEmploi)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const command: DeleteFavoriOffreEmploiCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreEmploiCommandHandler.execute(
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
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const command: DeleteFavoriOffreEmploiCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreEmploiCommandHandler.execute(
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
    describe('quand le jeune n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        offresEmploiHttpSqlRepository.getFavori
          .withArgs(jeune.id, offreEmploi.id)
          .resolves(undefined)
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

        const command: DeleteFavoriOffreEmploiCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriOffreEmploiCommandHandler.execute(
          command
        )
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', command.idJeune))
        )
        expect(
          offresEmploiHttpSqlRepository.deleteFavori
        ).not.to.have.been.calledWith(jeune.id, offreEmploi.id)
      })
    })
  })
})
