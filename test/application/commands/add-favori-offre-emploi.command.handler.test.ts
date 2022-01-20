import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { FavoriExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { OffresEmploi } from '../../../src/domain/offre-emploi'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur

describe('AddFavoriOffreEmploiCommandHandler', () => {
  let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    addFavoriOffreEmploiCommandHandler = new AddFavoriOffreEmploiCommandHandler(
      offresEmploiRepository,
      jeuneAuthorizer,
      evenementService
    )
  })

  describe('handle', () => {
    it('sauvegarde un favori', async () => {
      // Given
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi
      }
      offresEmploiRepository.getFavori
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(undefined)

      // When
      await addFavoriOffreEmploiCommandHandler.handle(command)

      // Then
      expect(offresEmploiRepository.saveAsFavori).to.have.been.calledWith(
        command.idJeune,
        command.offreEmploi
      )
    })
    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi
      }
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

  describe('authorize', () => {
    it('authorize le jeune', async () => {
      // Given
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: 'idJeune',
        offreEmploi: uneOffreEmploi()
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addFavoriOffreEmploiCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur
      )
    })
  })
})
