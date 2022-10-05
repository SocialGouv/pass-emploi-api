import { unJeune } from '../../../../fixtures/jeune.fixture'
import {
  DemarcheDto,
  DemarcheDtoEtat
} from '../../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { uneDemarcheDto } from '../../../../fixtures/demarches-dto.fixtures'
import {
  createSandbox,
  expect,
  StubbedClass,
  stubClass
} from '../../../../utils'
import { fromDemarcheDtoToDemarche } from '../../../../../src/application/queries/query-mappers/actions-pole-emploi.mappers'
import { failure } from '../../../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../../../src/building-blocks/types/domain-error'
import { before } from 'mocha'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { PoleEmploiPartenaireClient } from '../../../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from '../../../../../src/utils/date-service'
import { DateTime } from 'luxon'
import { KeycloakClient } from '../../../../../src/infrastructure/clients/keycloak-client'
import { Jeune } from '../../../../../src/domain/jeune/jeune'
import { SinonSandbox } from 'sinon'
import { GetDemarchesQueryGetter } from '../../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'

describe('handler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let getDemarchesQueryGetter: GetDemarchesQueryGetter
  let keycloakClient: StubbedClass<KeycloakClient>
  let sandbox: SinonSandbox
  const stringUTC = '2020-04-06T10:20:00.000Z'
  const idpToken = 'idpToken'
  const maintenant = new Date('2022-05-09T10:11:00+02:00')

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant)
    dateService.now.returns(DateTime.fromJSDate(maintenant))
    dateService.fromISOStringToJSDate.returns(new Date(stringUTC))
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves(idpToken)

    getDemarchesQueryGetter = new GetDemarchesQueryGetter(
      jeunesRepository,
      poleEmploiPartenaireClient,
      dateService,
      keycloakClient
    )
  })

  describe('quand le jeune existe', () => {
    const jeune = unJeune()

    const demarcheDtoRetard: DemarcheDto = {
      idDemarche: 'id-demarche',
      etat: DemarcheDtoEtat.AC,
      dateFin: '2020-04-06T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }
    const demarcheDtoEnCoursProche: DemarcheDto = uneDemarcheDto()

    const demarcheDtoAFaireAuMilieu: DemarcheDto = {
      idDemarche: 'id-demarche',
      etat: DemarcheDtoEtat.AF,
      dateFin: '2222-04-02T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      dateDebut: '2222-04-06T10:20:00+02:00',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }
    const demarcheDtoEnCours: DemarcheDto = {
      idDemarche: 'id-demarche',
      etat: DemarcheDtoEtat.EC,
      dateFin: '2222-04-03T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }
    const demarcheDtoAnnulee: DemarcheDto = {
      idDemarche: 'id-demarche',
      etat: DemarcheDtoEtat.AN,
      dateFin: '2020-04-01T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }
    const demarcheDtoRealisee: DemarcheDto = {
      idDemarche: 'id-demarche',
      etat: DemarcheDtoEtat.RE,
      dateFin: '2020-04-02T10:20:00+02:00',
      dateCreation: '',
      dateModification: '',
      origineCreateur: 'INDIVIDU',
      origineDemarche: 'PASS_EMPLOI',
      pourquoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }

    describe("quand il n'y a pas d'erreur", () => {
      it('récupère les demarches Pole Emploi du jeune triés par statut et par date de fin', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves([
            demarcheDtoAnnulee,
            demarcheDtoEnCours,
            demarcheDtoRetard,
            demarcheDtoRealisee,
            demarcheDtoAFaireAuMilieu,
            demarcheDtoEnCoursProche
          ])

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(result).to.deep.equal({
          _isSuccess: true,
          data: [
            fromDemarcheDtoToDemarche(demarcheDtoEnCoursProche, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoRetard, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoAFaireAuMilieu, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoEnCours, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoAnnulee, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoRealisee, dateService)
          ]
        })
      })
      it('récupère les demarches Pole Emploi du jeune triés par date de fin', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parDateFin
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves([
            demarcheDtoAnnulee,
            demarcheDtoEnCours,
            demarcheDtoRetard,
            demarcheDtoRealisee,
            demarcheDtoAFaireAuMilieu,
            demarcheDtoEnCoursProche
          ])

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(result).to.deep.equal({
          _isSuccess: true,
          data: [
            fromDemarcheDtoToDemarche(demarcheDtoAnnulee, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoEnCoursProche, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoEnCours, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoRealisee, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoAFaireAuMilieu, dateService),
            fromDemarcheDtoToDemarche(demarcheDtoRetard, dateService)
          ]
        })
      })
    })
    describe('quand une erreur se produit', () => {
      it('renvoie une failure quand une erreur client se produit', async () => {
        // Given
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .throws({ response: { data: {} } })

        // When
        const result = await getDemarchesQueryGetter.handle(query)
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
      const query = {
        idJeune: '1',
        accessToken: 'token',
        tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
      }

      jeunesRepository.get.withArgs(query.idJeune).resolves(undefined)

      // When
      const result = await getDemarchesQueryGetter.handle(query)
      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', query.idJeune))
      )
    })
  })
})
