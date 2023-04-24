import {
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { unJeune } from '../../fixtures/jeune.fixture'
import { RechercheAuthorizer } from '../../../src/application/authorizers/recherche-authorizer'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../../src/application/commands/delete-recherche.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { Offre } from '../../../src/domain/offre/offre'
import { Evenement, EvenementService } from '../../../src/domain/evenement'

describe('DeleteRechercheCommandHandler', () => {
  let rechercheSqlRepository: StubbedType<Recherche.Repository>
  let rechercheAuthorizer: StubbedClass<RechercheAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let deleteRechercheCommandHandler: DeleteRechercheCommandHandler
  let recherche: Recherche
  const jeune = unJeune()

  beforeEach(async () => {
    recherche = uneRecherche()
    const sandbox: SinonSandbox = createSandbox()
    rechercheSqlRepository = stubInterface(sandbox)
    rechercheAuthorizer = stubClass(RechercheAuthorizer)
    evenementService = stubClass(EvenementService)

    deleteRechercheCommandHandler = new DeleteRechercheCommandHandler(
      rechercheSqlRepository,
      rechercheAuthorizer,
      evenementService
    )
  })

  describe('handle', () => {
    describe('quand la recherche existe', () => {
      it('supprime la recherche', async () => {
        // Given
        rechercheSqlRepository.existe
          .withArgs(recherche.id, jeune.id)
          .resolves(true)

        const command: DeleteRechercheCommand = {
          idRecherche: recherche.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteRechercheCommandHandler.handle(command)
        // Then
        expect(rechercheSqlRepository.delete).to.have.been.calledWith(
          command.idRecherche
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand la recherche n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        rechercheSqlRepository.existe
          .withArgs(recherche.id, recherche.idJeune)
          .resolves(false)

        const command: DeleteRechercheCommand = {
          idRecherche: recherche.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteRechercheCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Recherche', command.idRecherche))
        )
        expect(rechercheSqlRepository.delete).not.to.have.been.calledWith(
          command.idRecherche
        )
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune a supprimer sa recherche', async () => {
      // Given
      const command: DeleteRechercheCommand = {
        idRecherche: recherche.id,
        idJeune: jeune.id
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await deleteRechercheCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        rechercheAuthorizer.autoriserLeJeunePourSaRecherche
      ).to.have.been.calledWithExactly(
        command.idJeune,
        command.idRecherche,
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    describe('recherche offre emploi', () => {
      it('enregistre l‘évènement', async () => {
        // Given
        const command: DeleteRechercheCommand = {
          idJeune: 'id-jeune',
          idRecherche: 'id-recherche'
        }
        const recherche = uneRecherche({
          id: command.idRecherche,
          idJeune: command.idJeune,
          type: Offre.Recherche.Type.OFFRES_EMPLOI
        })
        rechercheSqlRepository.get.resolves(recherche)

        // When
        await deleteRechercheCommandHandler.monitor(
          unUtilisateurDecode(),
          command
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RECHERCHE_EMPLOI_SUPPRIMEE,
          unUtilisateurDecode()
        )
      })
    })
    describe('recherche offre alternance', () => {
      it('enregistre l‘évènement', async () => {
        // Given
        const command: DeleteRechercheCommand = {
          idJeune: 'id-jeune',
          idRecherche: 'id-recherche'
        }
        const recherche = uneRecherche({
          id: command.idRecherche,
          idJeune: command.idJeune,
          type: Offre.Recherche.Type.OFFRES_ALTERNANCE
        })
        rechercheSqlRepository.get.resolves(recherche)

        // When
        await deleteRechercheCommandHandler.monitor(
          unUtilisateurDecode(),
          command
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RECHERCHE_ALTERNANCE_SUPPRIMEE,
          unUtilisateurDecode()
        )
      })
    })
    describe('recherche offre immersion', () => {
      it('enregistre l‘évènement', async () => {
        // Given
        const command: DeleteRechercheCommand = {
          idJeune: 'id-jeune',
          idRecherche: 'id-recherche'
        }
        const recherche = uneRecherche({
          id: command.idRecherche,
          idJeune: command.idJeune,
          type: Offre.Recherche.Type.OFFRES_IMMERSION
        })
        rechercheSqlRepository.get.resolves(recherche)

        // When
        await deleteRechercheCommandHandler.monitor(
          unUtilisateurDecode(),
          command
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RECHERCHE_IMMERSION_SUPPRIMEE,
          unUtilisateurDecode()
        )
      })
    })
    describe('recherche offre service civique', () => {
      it('enregistre l‘évènement', async () => {
        // Given
        const command: DeleteRechercheCommand = {
          idJeune: 'id-jeune',
          idRecherche: 'id-recherche'
        }
        const recherche = uneRecherche({
          id: command.idRecherche,
          idJeune: command.idJeune,
          type: Offre.Recherche.Type.OFFRES_SERVICES_CIVIQUE
        })
        rechercheSqlRepository.get.resolves(recherche)

        // When
        await deleteRechercheCommandHandler.monitor(
          unUtilisateurDecode(),
          command
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SUPPRIMEE,
          unUtilisateurDecode()
        )
      })
    })
  })
})
