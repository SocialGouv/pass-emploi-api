import {
  OffreEmploiListItem,
  OffresEmploi
} from '../../../src/domain/offres-emploi'
import { createSandbox, DatabaseForTesting, expect } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  DeleteFavoriCommand,
  DeleteFavoriCommandHandler
} from '../../../src/application/commands/delete-favori.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { uneOffreEmploiListItem } from '../../fixtures/offre-emploi.fixture'
import { Jeune } from '../../../src/domain/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('DeleteFavoriCommandHandler', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: StubbedType<OffresEmploi.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let deleteFavoriCommandHandler: DeleteFavoriCommandHandler
  let offreEmploi: OffreEmploiListItem
  const jeune = unJeune()
  beforeEach(async () => {
    offreEmploi = uneOffreEmploiListItem()
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiHttpSqlRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    deleteFavoriCommandHandler = new DeleteFavoriCommandHandler(
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

        const command: DeleteFavoriCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriCommandHandler.execute(command)
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

        const command: DeleteFavoriCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriCommandHandler.execute(command)
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('OffreEmploi', command.idOffreEmploi))
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

        const command: DeleteFavoriCommand = {
          idOffreEmploi: offreEmploi.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteFavoriCommandHandler.execute(command)
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
