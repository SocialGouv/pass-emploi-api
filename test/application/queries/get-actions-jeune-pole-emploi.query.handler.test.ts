import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetActionsJeunePoleEmploiQuery,
  GetActionsJeunePoleEmploiQueryHandler
} from 'src/application/queries/get-actions-jeune-pole-emploi.query.handler'
import { fromDemarcheDtoToActionPoleEmploiQueryModel } from 'src/application/queries/query-mappers/actions-pole-emploi.mappers'
import { ActionPoleEmploi } from 'src/domain/action'
import { IdService } from 'src/utils/id-service'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune'
import {
  DemarcheDto,
  PoleEmploiPartenaireClient
} from '../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetActionsJeunePoleEmploiQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getActionsJeunePoleEmploiQueryHandler: GetActionsJeunePoleEmploiQueryHandler
  let sandbox: SinonSandbox
  const stringUTC = '2020-04-06T10:20:00.000Z'

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    dateService = stubClass(DateService)
    idService = stubClass(IdService)
    idService.uuid.returns('random-id')
    dateService.nowJs.returns(new Date())
    dateService.fromISOStringToUTCJSDate.returns(new Date(stringUTC))

    getActionsJeunePoleEmploiQueryHandler =
      new GetActionsJeunePoleEmploiQueryHandler(
        jeunesRepository,
        poleEmploiPartenaireClient,
        jeunePoleEmploiAuthorizer,
        idService,
        dateService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('fromDemarcheDtoToActionPoleEmploiQueryModel', () => {
    const demarcheDto: DemarcheDto = {
      id: 'id-demarche',
      etat: 'AC',
      dateFin: '2020-04-06T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: ''
    }

    it('retourne un ActionPoleEmploiQueryModel avec statut en retard', async () => {
      // When
      const queryModel = fromDemarcheDtoToActionPoleEmploiQueryModel(
        demarcheDto,
        idService,
        dateService
      )

      // Then
      expect(queryModel).to.deep.equal({
        id: 'id-demarche',
        contenu: undefined,
        statut: ActionPoleEmploi.Statut.EN_RETARD,
        dateFin: new Date(stringUTC),
        dateAnnulation: undefined,
        creeeParConseiller: false
      })
    })
    it('retourne un ActionPoleEmploiQueryModel avec contenu, statut realisée et date annulation', async () => {
      // Given
      demarcheDto.id = undefined
      demarcheDto.etat = 'RE'
      demarcheDto.dateAnnulation = 'test'
      demarcheDto.libelleCourt = 'test'
      demarcheDto.origineCreateur = 'CONSEILLER'
      // When
      const queryModel = fromDemarcheDtoToActionPoleEmploiQueryModel(
        demarcheDto,
        idService,
        dateService
      )
      // Then
      expect(queryModel).to.deep.equal({
        id: 'random-id',
        contenu: 'test',
        statut: ActionPoleEmploi.Statut.REALISEE,
        dateFin: new Date(stringUTC),
        dateAnnulation: new Date(stringUTC),
        creeeParConseiller: true
      })
    })
    it('retourne statut annulée', async () => {
      // Given
      demarcheDto.etat = 'AN'
      // When
      const queryModel = fromDemarcheDtoToActionPoleEmploiQueryModel(
        demarcheDto,
        idService,
        dateService
      )
      // Then
      expect(queryModel.statut).to.equal(ActionPoleEmploi.Statut.ANNULEE)
    })
    it('retourne statut en cours', async () => {
      // Given
      demarcheDto.etat = 'EC'
      demarcheDto.dateFin = '2222-04-06T10:20:00+02:00'
      demarcheDto.dateDebut = '2020-04-06T10:20:00+02:00'
      // When
      const queryModel = fromDemarcheDtoToActionPoleEmploiQueryModel(
        demarcheDto,
        idService,
        dateService
      )
      // Then
      expect(queryModel.statut).to.equal(ActionPoleEmploi.Statut.EN_COURS)
    })
    it('retourne statut à faire', async () => {
      // Given
      demarcheDto.etat = 'AF'
      demarcheDto.dateDebut = '2222-04-06T10:20:00+02:00'
      // When
      const queryModel = fromDemarcheDtoToActionPoleEmploiQueryModel(
        demarcheDto,
        idService,
        dateService
      )
      // Then
      expect(queryModel.statut).to.equal(ActionPoleEmploi.Statut.A_FAIRE)
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const query: GetActionsJeunePoleEmploiQuery = {
        idJeune: '1',
        idpToken: 'token'
      }
      const jeune = unJeune()

      const demarcheDto: DemarcheDto = {
        id: 'id-demarche',
        etat: 'AC',
        dateFin: '2020-04-06T10:20:00+02:00',
        dateCreation: '',
        dateModification: '',
        origineCreateur: 'INDIVIDU',
        origineDemarche: 'PASS_EMPLOI',
        pourquoi: '',
        libellePourquoi: '',
        quoi: '',
        libelleQuoi: ''
      }
      const axiosResponse = {
        config: undefined,
        headers: undefined,
        request: undefined,
        status: 200,
        statusText: '',
        data: [demarcheDto]
      }
      describe("quand pas d'erreur", () => {
        it('récupère les demarches Pole Emploi du jeune', async () => {
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getDemarches
            .withArgs(query.idpToken)
            .resolves(axiosResponse)

          // When
          const result = await getActionsJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result).to.deep.equal({
            _isSuccess: true,
            data: [
              {
                id: 'id-demarche',
                contenu: undefined,
                statut: ActionPoleEmploi.Statut.EN_RETARD,
                dateFin: new Date(stringUTC),
                dateAnnulation: undefined,
                creeeParConseiller: false
              }
            ]
          })
        })
      })
      describe('quand une erreur se produit', () => {
        it('renvoie une failure quand une erreur client se produit', async () => {
          // Given
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getDemarches
            .withArgs(query.idpToken)
            .throws({ response: { data: {} } })

          // When
          const result = await getActionsJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result._isSuccess).to.equal(false)
          if (!result._isSuccess)
            expect(result.error.code).to.equal('ERREUR_HTTP')
        })
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const query: GetActionsJeunePoleEmploiQuery = {
          idJeune: '1',
          idpToken: 'token'
        }

        jeunesRepository.get.withArgs(query.idJeune).resolves(undefined)

        // When
        const result = await getActionsJeunePoleEmploiQueryHandler.handle(query)
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', query.idJeune))
        )
      })
    })
  })

  describe('authorize', () => {
    it('authorise le jeune', async () => {
      // Given
      const query: GetActionsJeunePoleEmploiQuery = {
        idJeune: 'ABCDE',
        idpToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getActionsJeunePoleEmploiQueryHandler.authorize(query, utilisateur)
      // Then
      expect(jeunePoleEmploiAuthorizer.authorize).to.have.been.calledWith(
        query.idJeune,
        utilisateur
      )
    })
  })
})
