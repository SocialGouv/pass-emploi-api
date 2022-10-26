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
import {
  failure,
  isSuccess
} from '../../../../../src/building-blocks/types/result'
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

describe('GetDemarchesQueryGetter', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let getDemarchesQueryGetter: GetDemarchesQueryGetter
  let keycloakClient: StubbedClass<KeycloakClient>
  let sandbox: SinonSandbox
  const idpToken = 'idpToken'
  const maintenant = DateTime.fromISO('2022-05-09T10:11:00+02:00', {
    setZone: true
  })

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
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
      pourQuoi: '',
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
      pourQuoi: '',
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
      pourQuoi: '',
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
      pourQuoi: '',
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
      pourQuoi: '',
      libellePourquoi: '',
      quoi: '',
      libelleQuoi: '',
      droitsDemarche: {}
    }

    describe("quand il n'y a pas d'erreur", () => {
      it('renvoie des demarcheQueryModel', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves([demarcheDtoEnCoursProche])

        // When
        const result = await getDemarchesQueryGetter.handle(query)

        // Then
        expect(isSuccess(result) && result.data).to.deep.equal([
          {
            attributs: [],
            codeDemarche: 'eyJxdW9pIjoiUTIwIiwicG91cnF1b2kiOiJQMTgifQ==',
            contenu: undefined,
            creeeParConseiller: false,
            dateAnnulation: undefined,
            dateCreation: DateTime.fromISO(
              '2022-03-01T09:20:00.000+01:00'
            ).toISO(),
            dateDebut: undefined,
            dateFin: DateTime.fromISO('2022-04-01T10:20:00.000+02:00').toISO(),
            dateModification: DateTime.fromISO(
              '2022-03-02T11:20:00.000+01:00'
            ).toISO(),
            id: 'id-demarche',
            label: 'pourquoi',
            modifieParConseiller: false,
            sousTitre: undefined,
            statut: 'A_FAIRE',
            statutsPossibles: ['ANNULEE', 'REALISEE'],
            titre: 'quoi'
          }
        ])
      })
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
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data
          expect(demarches[0].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoRetard.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoAFaireAuMilieu.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[4].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[5].id).to.equal(demarcheDtoRealisee.idDemarche)
        }
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
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data
          expect(demarches[0].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoRealisee.idDemarche)
          expect(demarches[4].id).to.equal(demarcheDtoAFaireAuMilieu.idDemarche)
          expect(demarches[5].id).to.equal(demarcheDtoRetard.idDemarche)
        }
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
