import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect } from '../../utils'
import { OffresEmploi } from '../../../src/domain/offre-emploi'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { Jeune } from '../../../src/domain/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'

describe('AddFavoriOffreEmploiCommandHandler', () => {
  describe('execute', () => {
    let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
    let jeuneRepository: StubbedType<Jeune.Repository>
    let addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler
    const jeune = unJeune()

    beforeEach(async () => {
      const sandbox: SinonSandbox = createSandbox()
      offresEmploiRepository = stubInterface(sandbox)
      jeuneRepository = stubInterface(sandbox)
      addFavoriOffreEmploiCommandHandler =
        new AddFavoriOffreEmploiCommandHandler(
          offresEmploiRepository,
          jeuneRepository
        )
    })

    it('sauvegarde un favori', async () => {
      // Given
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi
      }
      jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
      offresEmploiRepository.getFavori
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(undefined)

      // When
      await addFavoriOffreEmploiCommandHandler.execute(command)

      // Then
      expect(offresEmploiRepository.saveAsFavori).to.have.been.calledWith(
        command.idJeune,
        command.offreEmploi
      )
    })

    it('renvoie une failure NonTrouveError quand le jeune n existe pas', async () => {
      // Given
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: 'FAUUX',
        offreEmploi: uneOffreEmploi()
      }
      jeuneRepository.get.withArgs('FAUUX').resolves(undefined)

      // When
      const result = await addFavoriOffreEmploiCommandHandler.execute(command)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', 'FAUUX'))
      )
    })
    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi
      }
      jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
      offresEmploiRepository.getFavori
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(offreEmploi)

      // When
      const result = await addFavoriOffreEmploiCommandHandler.execute(command)

      // Then
      expect(result).to.deep.equal(
        failure(new FavoriExisteDejaError(jeune.id, offreEmploi.id))
      )
    })
  })
})
