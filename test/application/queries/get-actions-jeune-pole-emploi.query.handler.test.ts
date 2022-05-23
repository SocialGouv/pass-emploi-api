import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetActionsJeunePoleEmploiQuery,
  GetActionsJeunePoleEmploiQueryHandler
} from 'src/application/queries/get-actions-jeune-pole-emploi.query.handler'
import { ActionPoleEmploi } from 'src/domain/action'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import {
  DemarcheDto,
  PoleEmploiPartenaireClient
} from '../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { uneDemarcheDto } from '../../fixtures/demarches-dto.fixtures'
import { fromDemarcheDtoToDemarcheQueryModel } from '../../../src/application/queries/query-mappers/actions-pole-emploi.mappers'

describe('GetActionsJeunePoleEmploiQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getActionsJeunePoleEmploiQueryHandler: GetActionsJeunePoleEmploiQueryHandler
  let keycloakClient: StubbedClass<KeycloakClient>
  let sandbox: SinonSandbox
  const stringUTC = '2020-04-06T10:20:00.000Z'
  const idpToken = 'idpToken'

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date())
    dateService.fromISOStringToUTCJSDate.returns(new Date(stringUTC))
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves(idpToken)

    getActionsJeunePoleEmploiQueryHandler =
      new GetActionsJeunePoleEmploiQueryHandler(
        jeunesRepository,
        poleEmploiPartenaireClient,
        jeunePoleEmploiAuthorizer,
        dateService,
        keycloakClient
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('fromDemarcheDtoToDemarcheQueryModel', () => {
    let demarcheDto: DemarcheDto

    beforeEach(() => {
      demarcheDto = {
        id: '198916488',
        etat: 'RE',
        dateDebut: '2022-05-09T08:11:00+02:00',
        dateFin: '2022-05-10T10:00:00+02:00',
        dateCreation: '2022-05-11T11:04:00+02:00',
        dateModification: '2021-11-29T11:04:00+01:00',
        origineCreateur: 'CONSEILLER',
        origineDemarche: 'PASS_EMPLOI',
        pourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        quoi: 'Q01',
        libelleQuoi: 'Identification de ses points forts et de ses compétences',
        comment: 'C01.05',
        libelleComment: 'Par un autre moyen',
        libelleCourt: 'Identification de ses compétences avec pole-emploi.fr',
        libelleLong:
          'Identification de ses points forts et de ses compétences par un autre moyen',
        description: 'Candidature chez diffÃ©rents employeurs',
        nombre: 5,
        ou: 'pole-emploi.fr',
        metier: 'Agriculture',
        droitsDemarche: {}
      }
    })

    it('retourne un ActionPoleEmploiQueryModel avec contenu, statut realisée et date annulation', async () => {
      // When
      const queryModel = fromDemarcheDtoToDemarcheQueryModel(
        demarcheDto,
        dateService
      )
      // Then
      expect(queryModel).to.deep.equal({
        attributs: [
          {
            cle: 'metier',
            label: 'Nom du métier',
            valeur: 'Agriculture'
          },
          {
            cle: 'description',
            label: 'Description',
            valeur: 'Candidature chez diffÃ©rents employeurs'
          },
          {
            cle: 'nombre',
            label: 'Nombre',
            valeur: 5
          }
        ],
        codeDemarche:
          'eyJxdW9pIjoiUTAxIiwicG91cnF1b2kiOiJQMDEiLCJjb21tZW50IjoiQzAxLjA1In0=',
        contenu: 'Identification de ses compétences avec pole-emploi.fr',
        creeeParConseiller: true,
        dateCreation: new Date('2020-04-06T10:20:00.000Z'),
        dateFin: new Date('2020-04-06T10:20:00.000Z'),
        dateModification: new Date('2020-04-06T10:20:00.000Z'),
        id: '198916488',
        label: 'Mon (nouveau) métier',
        modifieParConseiller: false,
        sousTitre: 'Par un autre moyen',
        statut: 'REALISEE',
        statutsPossibles: [],
        titre: 'Identification de ses points forts et de ses compétences'
      })
    })
    it('retourne statut annulée', async () => {
      // Given
      demarcheDto.etat = 'AN'
      // When
      const queryModel = fromDemarcheDtoToDemarcheQueryModel(
        demarcheDto,
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
      const queryModel = fromDemarcheDtoToDemarcheQueryModel(
        demarcheDto,
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
      const queryModel = fromDemarcheDtoToDemarcheQueryModel(
        demarcheDto,
        dateService
      )
      // Then
      expect(queryModel.statut).to.equal(ActionPoleEmploi.Statut.A_FAIRE)
    })
    it('retourne les attributs', async () => {
      // Given
      demarcheDto.organisme = 'pole emploi'
      demarcheDto.metier = 'Boulanger'
      demarcheDto.description = 'Le pain'
      demarcheDto.nombre = 4
      demarcheDto.contact = 'contact@contact.contact'
      // When
      const queryModel = fromDemarcheDtoToDemarcheQueryModel(
        demarcheDto,
        dateService
      )
      // Then
      expect(queryModel.attributs).to.deep.equal([
        {
          cle: 'organisme',
          label: 'Nom de l’organisme',
          valeur: 'pole emploi'
        },
        {
          cle: 'metier',
          label: 'Nom du métier',
          valeur: 'Boulanger'
        },
        {
          cle: 'description',
          label: 'Description',
          valeur: 'Le pain'
        },
        {
          cle: 'nombre',
          label: 'Nombre',
          valeur: 4
        },
        {
          cle: 'contact',
          label: 'Contact',
          valeur: 'contact@contact.contact'
        }
      ])
    })
    describe('droits de modification', () => {
      it("autorise l'annulation", async () => {
        // Given
        demarcheDto.droitsDemarche!.annulation = true
        // When
        const queryModel = fromDemarcheDtoToDemarcheQueryModel(
          demarcheDto,
          dateService
        )
        // Then
        expect(queryModel.statutsPossibles).to.deep.equal([
          ActionPoleEmploi.Statut.ANNULEE
        ])
      })
      it('autorise la réalisation', async () => {
        // Given
        demarcheDto.droitsDemarche!.realisation = true
        // When
        const queryModel = fromDemarcheDtoToDemarcheQueryModel(
          demarcheDto,
          dateService
        )
        // Then
        expect(queryModel.statutsPossibles).to.deep.equal([
          ActionPoleEmploi.Statut.REALISEE
        ])
      })
      describe('quand la modification est possible', () => {
        it('autorise a faire et en cours', async () => {
          // Given
          demarcheDto.etat = 'AC'
          demarcheDto.droitsDemarche!.modificationDate = true
          // When
          const queryModel = fromDemarcheDtoToDemarcheQueryModel(
            demarcheDto,
            dateService
          )
          // Then
          expect(queryModel.statutsPossibles).to.deep.equal([
            ActionPoleEmploi.Statut.A_FAIRE,
            ActionPoleEmploi.Statut.EN_COURS
          ])
        })
      })
      describe('quand la replanification est possible', () => {
        it('autorise a faire et en cours', async () => {
          // Given
          demarcheDto.etat = 'RE'
          demarcheDto.droitsDemarche!.replanificationDate = true
          // When
          const queryModel = fromDemarcheDtoToDemarcheQueryModel(
            demarcheDto,
            dateService
          )
          // Then
          expect(queryModel.statutsPossibles).to.deep.equal([
            ActionPoleEmploi.Statut.A_FAIRE,
            ActionPoleEmploi.Statut.EN_COURS
          ])
        })
      })
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const query: GetActionsJeunePoleEmploiQuery = {
        idJeune: '1',
        accessToken: 'token'
      }
      const jeune = unJeune()

      const demarcheDtoRetard: DemarcheDto = {
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
        libelleQuoi: '',
        droitsDemarche: {}
      }
      const demarcheDtoEnCoursProche: DemarcheDto = uneDemarcheDto()

      const demarcheDtoAFaireAuMilieu: DemarcheDto = {
        id: 'id-demarche',
        etat: 'AF',
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
        id: 'id-demarche',
        etat: 'EC',
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
        id: 'id-demarche',
        etat: 'AN',
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
        id: 'id-demarche',
        etat: 'RE',
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

      describe("quand pas d'erreur", () => {
        it('récupère les demarches Pole Emploi du jeune bien triés', async () => {
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
          const result = await getActionsJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result).to.deep.equal({
            _isSuccess: true,
            data: [
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoEnCoursProche,
                dateService
              ),
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoRetard,
                dateService
              ),
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoAFaireAuMilieu,
                dateService
              ),
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoEnCours,
                dateService
              ),
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoAnnulee,
                dateService
              ),
              fromDemarcheDtoToDemarcheQueryModel(
                demarcheDtoRealisee,
                dateService
              )
            ]
          })
        })
      })
      describe('quand une erreur se produit', () => {
        it('renvoie une failure quand une erreur client se produit', async () => {
          // Given
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getDemarches
            .withArgs(idpToken)
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
          accessToken: 'token'
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
        accessToken: 'token'
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
