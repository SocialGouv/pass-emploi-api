import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from '../../../src/application/commands/add-favori-offre-immersion.command.handler'
import { FavoriExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { OffresImmersion } from '../../../src/domain/offre-immersion'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

import Utilisateur = Authentification.Utilisateur

describe('AddFavoriOffreImmersionCommandHandler', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    addFavoriOffreImmersionCommandHandler =
      new AddFavoriOffreImmersionCommandHandler(
        offresImmersionRepository,
        jeuneAuthorizer,
        evenementService
      )
  })

  describe('handle', () => {
    it('sauvegarde un favori', async () => {
      // Given
      const offreImmersion = uneOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        offreImmersion: offreImmersion
      }
      offresImmersionRepository.getFavori
        .withArgs(jeune.id, offreImmersion.id)
        .resolves(undefined)

      // When
      await addFavoriOffreImmersionCommandHandler.handle(command)

      // Then
      expect(offresImmersionRepository.saveAsFavori).to.have.been.calledWith(
        command.idJeune,
        command.offreImmersion
      )
    })

    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreImmersion = uneOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        offreImmersion: offreImmersion
      }
      offresImmersionRepository.getFavori
        .withArgs(jeune.id, offreImmersion.id)
        .resolves(offreImmersion)

      // When
      const result = await addFavoriOffreImmersionCommandHandler.execute(
        command
      )

      // Then
      expect(result).to.deep.equal(
        failure(new FavoriExisteDejaError(jeune.id, offreImmersion.id))
      )
    })
  })

  describe('authorize', () => {
    it('authorize le jeune', async () => {
      // Given
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: 'idJeune',
        offreImmersion: uneOffreImmersion()
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addFavoriOffreImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur
      )
    })
  })
})
