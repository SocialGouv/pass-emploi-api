import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import { success } from 'src/building-blocks/types/result'
import { IdService } from 'src/utils/id-service'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../../src/application/commands/create-recherche.command.handler'
import { Recherche } from '../../../src/domain/recherche'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('CreateRechercheCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rechercheRepository: StubbedType<Recherche.Repository>
  let idService: StubbedClass<IdService>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let createRechercheCommandHandler: CreateRechercheCommandHandler
  let dateService: StubbedClass<DateService>

  const date = uneDatetime.toJSDate()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    idService = stubClass(IdService)

    dateService = stubClass(DateService)
    dateService.nowJs.returns(date)

    createRechercheCommandHandler = new CreateRechercheCommandHandler(
      rechercheRepository,
      idService,
      jeuneAuthorizer,
      evenementService,
      dateService
    )
  })

  describe('handle', () => {
    describe('quand la recherche est sauvegardée', () => {
      it("renvoie l'id de la recherche", async () => {
        // Given
        const idRecherche = 'un-id'
        idService.uuid.returns(idRecherche)

        const command: CreateRechercheCommand = {
          idJeune: 'ABC123',
          type: Recherche.Type.OFFRES_EMPLOI,
          titre: '',
          metier: '',
          localisation: '',
          criteres: {}
        }

        // When
        const result = await createRechercheCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success({ id: idRecherche }))
        expect(
          rechercheRepository.saveRecherche
        ).to.have.been.calledWithExactly({
          id: 'un-id',
          type: 'OFFRES_EMPLOI',
          titre: '',
          metier: '',
          localisation: '',
          criteres: {},
          idJeune: 'ABC123',
          dateCreation: date,
          dateDerniereRecherche: date,
          etat: Recherche.Etat.SUCCES
        })
      })
    })
  })
  describe('monitor', () => {
    it("renvoie le bon évènement d'engagement quand la recherche est une offre d'emploi", async () => {
      // Given
      const idRecherche = 'un-id'
      idService.uuid.returns(idRecherche)
      const command: CreateRechercheCommand = {
        idJeune: 'ABC123',
        type: Recherche.Type.OFFRES_EMPLOI,
        titre: '',
        metier: '',
        localisation: '',
        criteres: {}
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await createRechercheCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creerEvenement).to.be.calledWith(
        Evenement.Type.RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE,
        utilisateur
      )
    })
    it("renvoie le bon évènement d'engagement quand la recherche est une offre d'immersion", async () => {
      // Given
      const idRecherche = 'un-id'
      idService.uuid.returns(idRecherche)
      const command: CreateRechercheCommand = {
        idJeune: 'ABC123',
        type: Recherche.Type.OFFRES_IMMERSION,
        titre: '',
        metier: '',
        localisation: '',
        criteres: {}
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await createRechercheCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creerEvenement).to.be.calledWith(
        Evenement.Type.RECHERCHE_IMMERSION_SAUVEGARDEE,
        utilisateur
      )
    })
    it("renvoie le bon évènement d'engagement quand la recherche est une offre d'alternance", async () => {
      // Given
      const idRecherche = 'un-id'
      idService.uuid.returns(idRecherche)
      const command: CreateRechercheCommand = {
        idJeune: 'ABC123',
        type: Recherche.Type.OFFRES_ALTERNANCE,
        titre: '',
        metier: '',
        localisation: '',
        criteres: {}
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await createRechercheCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creerEvenement).to.be.calledWith(
        Evenement.Type.RECHERCHE_ALTERNANCE_SAUVEGARDEE,
        utilisateur
      )
    })
  })
})
