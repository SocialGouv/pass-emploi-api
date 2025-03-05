import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
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
  let dateService: StubbedClass<DateService>
  const jeune = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    dateService = stubClass(DateService)
    addFavoriOffreEmploiCommandHandler = new AddFavoriOffreEmploiCommandHandler(
      offresEmploiRepository,
      jeuneAuthorizer,
      evenementService,
      dateService
    )
  })

  describe('handle', () => {
    it('sauvegarde un favori', async () => {
      // Given
      const now = DateTime.now()
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi,
        aPostule: true
      }
      offresEmploiRepository.get
        .withArgs(jeune.id, offreEmploi.id)
        .resolves(undefined)
      dateService.now.returns(now)

      // When
      await addFavoriOffreEmploiCommandHandler.handle(command)

      // Then
      const favori: Offre.Favori<Offre.Favori.Emploi> = {
        idBeneficiaire: command.idJeune,
        dateCreation: now,
        dateCandidature: now,
        offre: command.offreEmploi
      }
      expect(offresEmploiRepository.save).to.have.been.calledWith(favori)
    })

    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: jeune.id,
        offreEmploi: offreEmploi,
        aPostule: true
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
        offreEmploi: uneOffreEmploi(),
        aPostule: true
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addFavoriOffreEmploiCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
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
          }),
          aPostule: true
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
          }),
          aPostule: true
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
