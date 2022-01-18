import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Authentification } from '../../../src/domain/authentification'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Jeune } from '../../../src/domain/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { EvenementService } from 'src/domain/evenement'
import { OffresImmersion } from '../../../src/domain/offre-immersion'

import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import Utilisateur = Authentification.Utilisateur
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from '../../../src/application/commands/add-favori-offre-immersion.command.handler'

describe('AddFavoriOffreImmersionCommandHandler', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    addFavoriOffreImmersionCommandHandler =
      new AddFavoriOffreImmersionCommandHandler(
        offresImmersionRepository,
        jeuneRepository,
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
      jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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

    it('renvoie une failure NonTrouveError quand le jeune n existe pas', async () => {
      // Given
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: 'FAUUX',
        offreImmersion: uneOffreImmersion()
      }
      jeuneRepository.get.withArgs('FAUUX').resolves(undefined)

      // When
      const result = await addFavoriOffreImmersionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', 'FAUUX'))
      )
    })
    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreImmersion = uneOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        offreImmersion: offreImmersion
      }
      jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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
