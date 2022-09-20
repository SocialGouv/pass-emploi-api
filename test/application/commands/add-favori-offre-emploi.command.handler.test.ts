import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { FavoriExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur
import { Offre } from '../../../src/domain/offre/offre'

describe('AddFavoriOffreEmploiCommandHandler', () => {
  let offresEmploiRepository: StubbedType<Offre.Favori.Emploi.Repository>
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
      offresEmploiRepository.get
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(undefined)

      // When
      await addFavoriOffreEmploiCommandHandler.handle(command)

      // Then
      expect(offresEmploiRepository.save).to.have.been.calledWith(
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
      offresEmploiRepository.get
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(offreEmploi)

      // When
      const result = await addFavoriOffreEmploiCommandHandler.handle(command)

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

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    describe("quand c'est une alternance", () => {
      it("créé l'événement idoine", () => {
        // Given
        const command: AddFavoriOffreEmploiCommand = {
          idJeune: jeune.id,
          offreEmploi: uneOffreEmploi({
            alternance: true
          })
        }

        // When
        addFavoriOffreEmploiCommandHandler.monitor(utilisateur, command)

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE,
          utilisateur
        )
      })
    })
    describe("quand c'est une offre d'emploi", () => {
      it("créé l'événement idoine", () => {
        // Given
        const command: AddFavoriOffreEmploiCommand = {
          idJeune: jeune.id,
          offreEmploi: uneOffreEmploi({
            alternance: false
          })
        }

        // When
        addFavoriOffreEmploiCommandHandler.monitor(utilisateur, command)

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.OFFRE_EMPLOI_SAUVEGARDEE,
          utilisateur
        )
      })
    })
  })
})
