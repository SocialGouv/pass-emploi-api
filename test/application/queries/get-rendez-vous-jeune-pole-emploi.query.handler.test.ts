import {
  GetRendezVousJeunePoleEmploiQuery,
  GetRendezVousJeunePoleEmploiQueryHandler
} from '../../../src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { DateService } from '../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Jeune } from '../../../src/domain/jeune'
import {
  PoleEmploiPrestationsClient,
  PrestationDto
} from '../../../src/infrastructure/clients/pole-emploi-prestations-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { DateTime } from 'luxon'
import { IdService } from 'src/utils/id-service'

describe('GetRendezVousJeunePoleEmploiQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let poleEmploiPrestationsClient: StubbedClass<PoleEmploiPrestationsClient>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPrestationsClient = stubClass(PoleEmploiPrestationsClient)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    dateService = stubClass(DateService)
    const idService = stubClass(IdService)
    idService.uuid.returns('inconnu-prestation')

    getRendezVousJeunePoleEmploiQueryHandler =
      new GetRendezVousJeunePoleEmploiQueryHandler(
        jeunesRepository,
        poleEmploiPrestationsClient,
        jeunePoleEmploiAuthorizer,
        dateService,
        idService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('fromPrestationDtoToRendezVousQueryModel', () => {
    it('retourne un RendezVousQueryModel avec la durée en jour', async () => {
      // Given
      const jeune = unJeune()
      const date = new Date('2020-04-06')
      dateService.now.returns(uneDatetime)
      const prestation: PrestationDto = {
        annule: false,
        datefin: date,
        session: {
          dateDebut: date,
          dateFinPrevue: date,
          dateLimite: date,
          duree: {
            unite: 'JOUR',
            valeur: 1.0
          },
          enAgence: true,
          infoCollective: false,
          realiteVirtuelle: false
        }
      }

      // When
      const rendezVousQueryModel =
        await getRendezVousJeunePoleEmploiQueryHandler.fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune
        )

      // Then
      expect(rendezVousQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date,
        duration: 0,
        id: 'inconnu-prestation',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: '',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: undefined,
        comment: undefined,
        adresse: undefined,
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: false,
        lienVisio: undefined
      })
    })
    it('retourne un RendezVousQueryModel avec la duree en heures', async () => {
      // Given
      const jeune = unJeune()
      const date = new Date('2020-04-06')
      dateService.now.returns(uneDatetime)
      const prestation: PrestationDto = {
        annule: false,
        datefin: date,
        session: {
          dateDebut: date,
          dateFinPrevue: date,
          dateLimite: date,
          duree: {
            unite: 'HEURE',
            valeur: 1.5
          },
          enAgence: true,
          infoCollective: false,
          realiteVirtuelle: false
        }
      }

      // When
      const rendezVousQueryModel =
        await getRendezVousJeunePoleEmploiQueryHandler.fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune
        )

      // Then
      expect(rendezVousQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date,
        duration: 90,
        id: 'inconnu-prestation',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: '',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: undefined,
        comment: undefined,
        adresse: undefined,
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: false,
        lienVisio: undefined
      })
    })
    it('retourne un RendezVousQueryModel avec la visio', async () => {
      // Given
      const jeune = unJeune()
      const date = new Date('2020-04-06')
      dateService.now.returns(uneDatetime)
      const prestation: PrestationDto = {
        annule: false,
        datefin: date,
        session: {
          modalitePremierRendezVous: 'WEBCAM',
          dateDebut: date,
          dateFinPrevue: date,
          dateLimite: date,
          duree: {
            unite: 'HEURE',
            valeur: 1.5
          },
          enAgence: true,
          infoCollective: false,
          realiteVirtuelle: false
        }
      }

      // When
      const rendezVousQueryModel =
        await getRendezVousJeunePoleEmploiQueryHandler.fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune
        )

      // Then
      expect(rendezVousQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date,
        duration: 90,
        id: 'inconnu-prestation',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: 'par visio',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: undefined,
        comment: undefined,
        adresse: undefined,
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: true,
        lienVisio: undefined
      })
    })
    it("retourne un RendezVousQueryModel avec l'adresse", async () => {
      // Given
      const jeune = unJeune()
      const date = new Date('2020-04-06')
      dateService.now.returns(uneDatetime)
      const prestation: PrestationDto = {
        annule: false,
        datefin: date,
        session: {
          modalitePremierRendezVous: 'WEBCAM',
          dateDebut: date,
          dateFinPrevue: date,
          dateLimite: date,
          duree: {
            unite: 'HEURE',
            valeur: 1.5
          },
          adresse: {
            adresseLigne1: 'ligne1',
            adresseLigne2: 'ligne2',
            codePostal: 'code postal',
            ville: 'ville'
          },
          enAgence: true,
          infoCollective: false,
          realiteVirtuelle: false
        }
      }

      // When
      const rendezVousQueryModel =
        await getRendezVousJeunePoleEmploiQueryHandler.fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune
        )

      // Then
      expect(rendezVousQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date,
        duration: 90,
        id: 'inconnu-prestation',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: 'par visio',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: undefined,
        comment: undefined,
        adresse: 'ligne1 ligne2 code postal ville',
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: true,
        lienVisio: undefined
      })
    })
    it('retourne un RendezVousQueryModel avec la description', async () => {
      // Given
      const jeune = unJeune()
      const date = new Date('2020-04-06')
      dateService.now.returns(uneDatetime)
      const prestation: PrestationDto = {
        annule: false,
        datefin: date,
        identifiantStable: undefined,
        session: {
          typePrestation: {
            code: 'ATC'
          },
          sousThemeAtelier: {
            libelleSousThemeAtelier: 'sous theme',
            descriptifSousThemeAtelier: 'descriptif'
          },
          modalitePremierRendezVous: 'WEBCAM',
          dateDebut: date,
          dateFinPrevue: date,
          dateLimite: date,
          duree: {
            unite: 'HEURE',
            valeur: 1.5
          },
          enAgence: true,
          infoCollective: false,
          realiteVirtuelle: false
        }
      }

      // When
      const rendezVousQueryModel =
        await getRendezVousJeunePoleEmploiQueryHandler.fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune
        )

      // Then
      expect(rendezVousQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date,
        duration: 90,
        id: 'inconnu-prestation',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: 'par visio',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: 'sous theme\ndescriptif',
        comment: undefined,
        adresse: undefined,
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: true,
        lienVisio: undefined
      })
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      describe("quand le lien de la visio n'est pas encore disponible", () => {
        it('récupère les rendez-vous Pole Emploi du jeune', async () => {
          // Given
          const query: GetRendezVousJeunePoleEmploiQuery = {
            idJeune: '1',
            idpToken: 'token'
          }
          const jeune = unJeune()
          const date = new Date('2020-04-06')
          const maintenant = uneDatetime
          const prestations: PrestationDto[] = [
            {
              annule: false,
              datefin: date,
              identifiantStable: undefined,
              session: {
                adresse: {
                  adresseLigne1: '588 BOULEVARD ALBERT CAMUS',
                  codeInsee: '69264',
                  codePostal: '69665',
                  identifiantAurore: '69065_00014597',
                  typeLieu: 'INTERNE',
                  ville: 'VILLEFRANCHE SUR SAONE',
                  villePostale: 'VILLEFRANCHE SUR SAONE CEDEX'
                },
                dateDebut: date,
                dateFinPrevue: date,
                dateLimite: date,
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true,
                infoCollective: false,
                realiteVirtuelle: false,
                themeAtelier: {
                  code: 'A14',
                  libelle: "Utiliser Internet dans sa recherche d'emploi"
                },
                typePrestation: {
                  code: 'ATE',
                  libelle: 'Atelier',
                  actif: true
                }
              }
            }
          ]
          const prestationsResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: prestations
          }

          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)
          poleEmploiPrestationsClient.getRendezVous
            .withArgs(query.idpToken, maintenant)
            .resolves(prestationsResponse)

          // When
          const result = await getRendezVousJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result).to.deep.equal({
            _isSuccess: true,
            data: [
              {
                idStable: undefined,
                adresse:
                  '588 BOULEVARD ALBERT CAMUS  69665 VILLEFRANCHE SUR SAONE',
                agencePE: true,
                annule: false,
                comment: undefined,
                date: date,
                description: "Utiliser Internet dans sa recherche d'emploi",
                duration: 0,
                id: 'inconnu-prestation',
                jeune: {
                  id: 'ABCDE',
                  nom: 'Doe',
                  prenom: 'John'
                },
                lienVisio: undefined,
                modality: '',
                organisme: undefined,
                telephone: undefined,
                theme: 'Atelier',
                title: '',
                type: {
                  code: 'PRESTATION',
                  label: 'Prestation'
                },
                visio: false
              }
            ]
          })
        })
      })
      describe('quand le lien de la visio est disponible', () => {
        it('récupère les rendez-vous Pole Emploi du jeune avec le lien de la visio', async () => {
          // Given
          const query: GetRendezVousJeunePoleEmploiQuery = {
            idJeune: '1',
            idpToken: 'token'
          }
          const date = new Date('2020-04-06')
          const jeune = unJeune()
          const idVisio = '1'
          const prestations: PrestationDto[] = [
            {
              annule: false,
              datefin: date,
              identifiantStable: idVisio,
              session: {
                dateDebut: date,
                dateFinPrevue: date,
                dateLimite: date,
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true
              }
            }
          ]

          const rendezVousPoleEmploiPrestationsResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: prestations
          }

          const lienVisioResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: 'lienvisio.com'
          }

          const maintenant = DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          ).toUTC()

          dateService.now.returns(maintenant)
          dateService.isSameDateDay.returns(true)
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPrestationsClient.getRendezVous
            .withArgs(query.idpToken, maintenant)
            .resolves(rendezVousPoleEmploiPrestationsResponse)
          poleEmploiPrestationsClient.getLienVisio
            .withArgs(query.idpToken, idVisio)
            .resolves(lienVisioResponse)

          // When
          const result = await getRendezVousJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result).to.deep.equal({
            _isSuccess: true,
            data: [
              {
                idStable: idVisio,
                adresse: undefined,
                agencePE: true,
                annule: false,
                comment: undefined,
                date,
                description: undefined,
                duration: 0,
                id: 'inconnu-prestation',
                jeune: {
                  id: 'ABCDE',
                  nom: 'Doe',
                  prenom: 'John'
                },
                lienVisio: 'lienvisio.com',
                modality: '',
                organisme: undefined,
                telephone: undefined,
                theme: undefined,
                title: '',
                type: {
                  code: 'PRESTATION',
                  label: 'Prestation'
                },
                visio: false
              }
            ]
          })
        })
      })
      describe('quand une erreur se produit', () => {
        it('renvoie une failure', async () => {
          // Given
          const query: GetRendezVousJeunePoleEmploiQuery = {
            idJeune: '1',
            idpToken: 'token'
          }
          const jeune = unJeune()
          const maintenant = uneDatetime

          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)
          poleEmploiPrestationsClient.getRendezVous
            .withArgs(query.idpToken, maintenant)
            .rejects()

          // When
          const result = await getRendezVousJeunePoleEmploiQueryHandler.handle(
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
        const query: GetRendezVousJeunePoleEmploiQuery = {
          idJeune: '1',
          idpToken: 'token'
        }

        jeunesRepository.get.withArgs(query.idJeune).resolves(undefined)

        // When
        const result = await getRendezVousJeunePoleEmploiQueryHandler.handle(
          query
        )
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
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'ABCDE',
        idpToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.authorize(
        query,
        utilisateur
      )
      // Then
      expect(jeunePoleEmploiAuthorizer.authorize).to.have.been.calledWith(
        query.idJeune,
        utilisateur
      )
    })
  })
})
