import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { Authentification } from '../../../../../src/domain/authentification'
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
  isSuccess,
  success
} from '../../../../../src/building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../../src/building-blocks/types/domain-error'
import { before } from 'mocha'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { PoleEmploiPartenaireClient } from '../../../../../src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from '../../../../../src/utils/date-service'
import { DateTime } from 'luxon'
import { KeycloakClient } from '../../../../../src/infrastructure/clients/keycloak-client.db'
import { SinonSandbox } from 'sinon'
import { GetDemarchesQueryGetter } from '../../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { failureApi } from '../../../../../src/building-blocks/types/result-api'
import { Cached } from '../../../../../src/building-blocks/types/query'
import { DemarcheQueryModel } from '../../../../../src/application/queries/query-models/actions.query-model'
import { Demarche } from '../../../../../src/domain/demarche'

describe('GetDemarchesQueryGetter', () => {
  let authRepository: StubbedType<Authentification.Repository>
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
    authRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenJeune.resolves(idpToken)

    getDemarchesQueryGetter = new GetDemarchesQueryGetter(
      authRepository,
      poleEmploiPartenaireClient,
      dateService,
      keycloakClient
    )
  })

  describe('quand le jeune existe', () => {
    const jeune = unUtilisateurJeune()

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
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves(success([demarcheDtoEnCoursProche]))

        // When
        const result = await getDemarchesQueryGetter.handle(query)

        // Then
        const expected: Cached<DemarcheQueryModel[]> = {
          queryModel: [
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
              dateFin: DateTime.fromISO(
                '2022-04-01T10:20:00.000+02:00'
              ).toISO(),
              dateModification: DateTime.fromISO(
                '2022-03-02T11:20:00.000+01:00'
              ).toISO(),
              id: 'id-demarche',
              label: 'pourquoi',
              modifieParConseiller: false,
              sousTitre: undefined,
              statut: Demarche.Statut.A_FAIRE,
              statutsPossibles: [
                Demarche.Statut.ANNULEE,
                Demarche.Statut.REALISEE
              ],
              titre: 'quoi'
            }
          ],
          dateDuCache: undefined
        }
        expect(result).to.deep.equal(success(expected))
      })

      it('récupère les demarches Pole Emploi du jeune triés par statut et par date de fin', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
        }
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves(
            success([
              demarcheDtoAnnulee,
              demarcheDtoEnCours,
              demarcheDtoRetard,
              demarcheDtoRealisee,
              demarcheDtoAFaireAuMilieu,
              demarcheDtoEnCoursProche
            ])
          )

        // When
        const result = await getDemarchesQueryGetter.handle(query)

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data.queryModel
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
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves(
            success([
              demarcheDtoAnnulee,
              demarcheDtoEnCours,
              demarcheDtoRetard,
              demarcheDtoRealisee,
              demarcheDtoAFaireAuMilieu,
              demarcheDtoEnCoursProche
            ])
          )

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data.queryModel
          expect(demarches[0].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoRealisee.idDemarche)
          expect(demarches[4].id).to.equal(demarcheDtoAFaireAuMilieu.idDemarche)
          expect(demarches[5].id).to.equal(demarcheDtoRetard.idDemarche)
        }
      })

      it('récupère les demarches Pole Emploi du jeune après la date de début', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          dateDebut: DateTime.fromISO('2020-04-03')
        }
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves(
            success([
              demarcheDtoAnnulee,
              demarcheDtoEnCours,
              demarcheDtoRetard,
              demarcheDtoRealisee,
              demarcheDtoAFaireAuMilieu,
              demarcheDtoEnCoursProche
            ])
          )

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data.queryModel
          expect(demarches.length).to.equal(4)
          expect(demarches[0].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoRealisee.idDemarche)
        }
      })

      it('récupères les démarches Pole Emploi du jeune pour son conseiller', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          dateDebut: DateTime.fromISO('2020-04-03'),
          pourConseiller: true
        }
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        keycloakClient.exchangeTokenConseillerJeune
          .withArgs(query.accessToken, jeune.idAuthentification!)
          .resolves(idpToken)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken, query.idJeune)
          .resolves(
            success([
              demarcheDtoAnnulee,
              demarcheDtoEnCours,
              demarcheDtoRetard,
              demarcheDtoRealisee,
              demarcheDtoAFaireAuMilieu,
              demarcheDtoEnCoursProche
            ])
          )

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data.queryModel
          expect(demarches.length).to.equal(4)
          expect(demarches[0].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoRealisee.idDemarche)
        }
      })

      it('récupères les démarches en cache', async () => {
        const query = {
          idJeune: '1',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          dateDebut: DateTime.fromISO('2020-04-03'),
          pourConseiller: true
        }
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        keycloakClient.exchangeTokenConseillerJeune
          .withArgs(query.accessToken, jeune.idAuthentification!)
          .rejects(new Error())
        poleEmploiPartenaireClient.getDemarchesEnCache
          .withArgs(query.idJeune)
          .resolves(
            success([
              demarcheDtoAnnulee,
              demarcheDtoEnCours,
              demarcheDtoRetard,
              demarcheDtoRealisee,
              demarcheDtoAFaireAuMilieu,
              demarcheDtoEnCoursProche
            ])
          )

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          const demarches = result.data.queryModel
          expect(demarches.length).to.equal(4)
          expect(demarches[0].id).to.equal(demarcheDtoAnnulee.idDemarche)
          expect(demarches[1].id).to.equal(demarcheDtoEnCoursProche.idDemarche)
          expect(demarches[2].id).to.equal(demarcheDtoEnCours.idDemarche)
          expect(demarches[3].id).to.equal(demarcheDtoRealisee.idDemarche)
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
        authRepository.getJeuneById.withArgs(query.idJeune).resolves(jeune)
        poleEmploiPartenaireClient.getDemarches
          .withArgs(idpToken)
          .resolves(failureApi(new ErreurHttp('erreur', 400)))

        // When
        const result = await getDemarchesQueryGetter.handle(query)
        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('erreur', 400)))
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

      authRepository.getJeuneById.withArgs(query.idJeune).resolves(undefined)

      // When
      const result = await getDemarchesQueryGetter.handle(query)
      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', query.idJeune))
      )
    })
  })
})
