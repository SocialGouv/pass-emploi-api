import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from '../../../src/application/commands/add-favori-offre-immersion.command.handler'
import { FavoriExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unFavoriOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur

describe('AddFavoriOffreImmersionCommandHandler', () => {
  let offresImmersionRepository: StubbedType<Offre.Favori.Immersion.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let dateService: StubbedClass<DateService>
  const jeune = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    dateService = stubClass(DateService)
    addFavoriOffreImmersionCommandHandler =
      new AddFavoriOffreImmersionCommandHandler(
        offresImmersionRepository,
        jeuneAuthorizer,
        evenementService,
        dateService
      )
  })

  describe('handle', () => {
    it('sauvegarde un favori', async () => {
      // Given
      const offreImmersion = unFavoriOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        offreImmersion: offreImmersion,
        aPostule: true
      }
      const now = DateTime.now()

      offresImmersionRepository.get
        .withArgs(jeune.id, offreImmersion.id)
        .resolves(undefined)
      dateService.now.returns(now)

      // When
      await addFavoriOffreImmersionCommandHandler.handle(command)

      // Then
      expect(offresImmersionRepository.save).to.have.been.calledWith({
        idBeneficiaire: command.idJeune,
        offre: command.offreImmersion,
        dateCreation: now,
        dateCandidature: now
      })
    })

    it('renvoie une failure ExisteDeja quand le jeune a déjà ce favori', async () => {
      // Given
      const offreImmersion = unFavoriOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        offreImmersion: offreImmersion,
        aPostule: false
      }
      offresImmersionRepository.get
        .withArgs(jeune.id, offreImmersion.id)
        .resolves(offreImmersion)

      // When
      const result = await addFavoriOffreImmersionCommandHandler.handle(command)

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
        offreImmersion: unFavoriOffreImmersion(),
        aPostule: false
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addFavoriOffreImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement idoine", () => {
      // When
      addFavoriOffreImmersionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_IMMERSION_SAUVEGARDEE,
        utilisateur
      )
    })
  })
})
