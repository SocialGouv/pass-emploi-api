import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect } from '../../utils'
import { OffresEmploi } from '../../../src/domain/offres-emploi'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { uneOffreEmploiListItem } from '../../fixtures/offre-emploi.fixture'
import { Jeune } from '../../../src/domain/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('AddFavoriOffreEmploiCommandHandler', () => {
  describe('execute', () => {
    let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
    let jeuneRepository: StubbedType<Jeune.Repository>
    let addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler
    const jeune = unJeune()
    before(async () => {
      const sandbox: SinonSandbox = createSandbox()
      offresEmploiRepository = stubInterface(sandbox)
      jeuneRepository = stubInterface(sandbox)
      jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
      addFavoriOffreEmploiCommandHandler =
        new AddFavoriOffreEmploiCommandHandler(
          offresEmploiRepository,
          jeuneRepository
        )
    })

    it('sauvegarde un favori', async () => {
      // Given
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: uneOffreEmploiListItem()
      }

      // When
      await addFavoriOffreEmploiCommandHandler.execute(command)

      // Then
      expect(offresEmploiRepository.saveAsFavori).to.have.been.calledWith(
        command.idJeune,
        command.offreEmploi
      )
    })
    it('renvoit une failure NonTrouveError quand le jeune n existe pas', async () => {
      // Given
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: 'FAUUX',
        offreEmploi: uneOffreEmploiListItem()
      }

      // When
      const result = await addFavoriOffreEmploiCommandHandler.execute(command)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', 'FAUUX'))
      )
    })
  })
})
