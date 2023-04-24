import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { createSandbox } from 'sinon'
import {
  AddFavoriOffreServiceCiviqueCommandHandler,
  AddFavoriServiceCiviqueCommand
} from '../../../src/application/commands/add-favori-offre-service-civique-command-handler'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { FavoriExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { Offre } from '../../../src/domain/offre/offre'

describe('AddFavoriOffreServiceCiviqueCommandHandler', () => {
  let addFavoriOffreServiceCiviqueCommandHandler: AddFavoriOffreServiceCiviqueCommandHandler
  let offreServiceCiviqueRepository: StubbedType<Offre.Favori.ServiceCivique.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    const sandbox = createSandbox()
    offreServiceCiviqueRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)

    addFavoriOffreServiceCiviqueCommandHandler =
      new AddFavoriOffreServiceCiviqueCommandHandler(
        offreServiceCiviqueRepository,
        jeuneAuthorizer,
        evenementService
      )
  })

  const command: AddFavoriServiceCiviqueCommand = {
    idJeune: 'idJeune',
    offre: uneOffreServiceCivique()
  }

  describe('handle', () => {
    describe("quand le favori n'existe pas déjà", () => {
      it('le crée', async () => {
        // Given
        offreServiceCiviqueRepository.get
          .withArgs(command.idJeune, command.offre.id)
          .resolves(undefined)

        // When
        const result = await addFavoriOffreServiceCiviqueCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(
          offreServiceCiviqueRepository.save
        ).to.have.been.calledWithExactly(command.idJeune, command.offre)
      })
    })

    describe('quand le favori existe déjà', () => {
      it('rejette', async () => {
        // Given
        offreServiceCiviqueRepository.get
          .withArgs(command.idJeune, command.offre.id)
          .resolves(uneOffreServiceCivique())

        // When
        const result = await addFavoriOffreServiceCiviqueCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(new FavoriExisteDejaError(command.idJeune, command.offre.id))
        )
        expect(offreServiceCiviqueRepository.save).not.to.have.been.called()
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      jeuneAuthorizer.autoriserLeJeune
        .withArgs(command.idJeune, utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await addFavoriOffreServiceCiviqueCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement idoine", () => {
      // When
      addFavoriOffreServiceCiviqueCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE,
        utilisateur
      )
    })
  })
})
