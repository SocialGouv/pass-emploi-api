import { GetRendezVousJeunePoleEmploiQuery } from '../../../../../src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { unJeune } from '../../../../fixtures/jeune.fixture'
import { uneDatetime } from '../../../../fixtures/date.fixture'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../../../src/domain/rendez-vous/rendez-vous'
import {
  createSandbox,
  expect,
  StubbedClass,
  stubClass
} from '../../../../utils'
import {
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import {
  failure,
  isSuccess,
  success
} from '../../../../../src/building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../../src/building-blocks/types/domain-error'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../../../src/domain/jeune/jeune'
import { DateService } from '../../../../../src/utils/date-service'
import { IdService } from '../../../../../src/utils/id-service'
import { PoleEmploiPartenaireClient } from '../../../../../src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { KeycloakClient } from '../../../../../src/infrastructure/clients/keycloak-client'
import { SinonSandbox } from 'sinon'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { RendezVousJeuneQueryModel } from '../../../../../src/application/queries/query-models/rendez-vous.query-model'
import { failureApi } from '../../../../../src/building-blocks/types/result-api'
import { Cached } from '../../../../../src/building-blocks/types/query'

describe('GetRendezVousJeunePoleEmploiQueryGetter', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let queryGetter: GetRendezVousJeunePoleEmploiQueryGetter
  let sandbox: SinonSandbox
  const idpToken = 'idpToken'

  beforeEach(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    keycloakClient = stubClass(KeycloakClient)
    dateService = stubClass(DateService)
    idService = stubClass(IdService)
    idService.uuid.returns('random-id')
    keycloakClient.exchangeTokenJeune.resolves(idpToken)

    queryGetter = new GetRendezVousJeunePoleEmploiQueryGetter(
      jeunesRepository,
      poleEmploiPartenaireClient,
      dateService,
      idService,
      keycloakClient
    )
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: '1',
        accessToken: 'token'
      }
      const jeune = unJeune()
      const datePrestation = '2014-03-24T14:00:00+01:00'
      const expectedDatePrestation = new Date('2014-03-24T14:00:00.000Z')
      const dateRendezVous = '2014-03-24'
      const heureRendezVous = '12:20'
      const expectedDateRendezVous = new Date('2014-03-24T12:20:00.000Z')
      const maintenant = uneDatetime()

      describe('quand periode est PASSES', () => {
        it('renvoie les rdv passes', async () => {
          // Given
          const queryPasses: GetRendezVousJeunePoleEmploiQuery = {
            idJeune: '1',
            accessToken: 'token',
            periode: RendezVous.Periode.PASSES
          }

          const prestations: PrestationDto[] = [
            {
              annule: false,
              datefin: '',
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
                dateDebut: datePrestation,
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true,
                infoCollective: false,
                realiteVirtuelle: false,
                themeAtelier: {
                  libelle: "Utiliser Internet dans sa recherche d'emploi"
                },
                typePrestation: {
                  libelle: 'Atelier'
                }
              }
            },
            {
              annule: false,
              datefin: '',
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
                dateDebut: maintenant.plus({ days: 10 }).toString(),
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true,
                infoCollective: false,
                realiteVirtuelle: false,
                themeAtelier: {
                  libelle: "Utiliser Internet dans sa recherche d'emploi"
                },
                typePrestation: {
                  libelle: 'Atelier'
                }
              }
            }
          ]
          const rendezVous: RendezVousPoleEmploiDto[] = [
            {
              theme: 'theme',
              date: dateRendezVous,
              heure: heureRendezVous,
              duree: 23,
              modaliteContact: 'AGENCE',
              agence: 'Agence',
              adresse: {
                bureauDistributeur: 'bureau',
                ligne4: '12 rue Albert Camus',
                ligne5: '75018',
                ligne6: 'Paris'
              },
              commentaire: 'commentaire',
              typeRDV: 'RDVL',
              lienVisio: 'lien'
            }
          ]

          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)

          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success(prestations))
          poleEmploiPartenaireClient.getRendezVousPasses
            .withArgs(idpToken, jeune.creationDate.toUTC())
            .resolves(success(rendezVous))

          // When
          const result = await queryGetter.handle(queryPasses)
          // Then

          expect(poleEmploiPartenaireClient.getPrestations).to.have.callCount(1)
          expect(
            poleEmploiPartenaireClient.getRendezVousPasses
          ).to.have.callCount(1)
          expect(
            isSuccess(result) && result.data.queryModel.length
          ).to.be.equal(2)
        })
      })
      describe("quand le lien de la visio prestations n'est pas encore disponible", () => {
        it('récupère les rendez-vous et les prestations Pole Emploi du jeune bien triés', async () => {
          const prestations: PrestationDto[] = [
            {
              annule: false,
              datefin: '',
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
                dateDebut: datePrestation,
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true,
                infoCollective: false,
                realiteVirtuelle: false,
                themeAtelier: {
                  libelle: "Utiliser Internet dans sa recherche d'emploi"
                },
                typePrestation: {
                  libelle: 'Atelier'
                }
              }
            }
          ]
          const rendezVous: RendezVousPoleEmploiDto[] = [
            {
              theme: 'theme',
              date: dateRendezVous,
              heure: heureRendezVous,
              duree: 23,
              modaliteContact: 'AGENCE',
              agence: 'Agence',
              adresse: {
                bureauDistributeur: 'bureau',
                ligne4: '12 rue Albert Camus',
                ligne5: '75018',
                ligne6: 'Paris'
              },
              commentaire: 'commentaire',
              typeRDV: 'RDVL',
              lienVisio: 'lien'
            }
          ]

          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)
          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success(prestations))
          poleEmploiPartenaireClient.getRendezVous
            .withArgs(idpToken)
            .resolves(success(rendezVous))

          // When
          const result = await queryGetter.handle(query)

          // Then
          const expected: Cached<RendezVousJeuneQueryModel[]> = {
            queryModel: [
              {
                agencePE: true,
                date: expectedDateRendezVous,
                duration: 23,
                id: 'random-id',
                modality: 'en agence Pôle emploi',
                theme: 'theme',
                conseiller: undefined,
                presenceConseiller: true,
                comment: 'commentaire',
                adresse: '12 rue Albert Camus 75018 Paris',
                title: '',
                type: {
                  code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
                  label: 'Entretien individuel conseiller'
                },
                isLocaleDate: true,
                visio: false,
                lienVisio: 'lien',
                source: RendezVous.Source.POLE_EMPLOI
              },
              {
                idStable: undefined,
                adresse:
                  '588 BOULEVARD ALBERT CAMUS  69665 VILLEFRANCHE SUR SAONE',
                agencePE: true,
                annule: false,
                comment: undefined,
                date: expectedDatePrestation,
                isLocaleDate: true,
                description: "Utiliser Internet dans sa recherche d'emploi",
                duration: 0,
                id: 'random-id',
                lienVisio: undefined,
                modality: '',
                organisme: undefined,
                telephone: undefined,
                theme: 'Atelier',
                title: '',
                type: {
                  code: CodeTypeRendezVous.PRESTATION,
                  label: 'Prestation'
                },
                visio: false,
                source: RendezVous.Source.POLE_EMPLOI
              }
            ],
            dateDuCache: undefined
          }
          expect(result).to.deep.equal(success(expected))
        })
      })
      describe('quand le lien de la visio prestations est disponible', () => {
        it('récupère les rendez-vous et les prestations Pole Emploi du jeune avec le lien de la visio', async () => {
          // Given
          const idVisio = '1'
          const prestations: PrestationDto[] = [
            {
              annule: false,
              datefin: '',
              identifiantStable: idVisio,
              session: {
                natureAnimation: 'INTERNE',
                modalitePremierRendezVous: 'WEBCAM',
                dateDebut: '2020-04-06T10:00:00+01:00',
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true
              }
            }
          ]
          const rendezVous: RendezVousPoleEmploiDto[] = [
            {
              theme: 'theme',
              date: '2020-04-06',
              heure: heureRendezVous,
              duree: 23,
              modaliteContact: 'VISIO',
              agence: 'Agence',
              adresse: {
                bureauDistributeur: 'bureau',
                ligne4: '12 rue Albert Camus',
                ligne5: '75018',
                ligne6: 'Paris'
              },
              commentaire: 'commentaire',
              typeRDV: 'RDVL',
              lienVisio: 'lien'
            }
          ]

          dateService.now.returns(maintenant)
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success(prestations))

          poleEmploiPartenaireClient.getLienVisio
            .withArgs(idpToken, idVisio)
            .resolves(success('lienvisio.com'))
          poleEmploiPartenaireClient.getRendezVous
            .withArgs(idpToken)
            .resolves(success(rendezVous))

          // When
          const result = await queryGetter.handle(query)

          // Then
          const expected: Cached<RendezVousJeuneQueryModel[]> = {
            queryModel: [
              {
                idStable: idVisio,
                adresse: undefined,
                agencePE: true,
                annule: false,
                comment: undefined,
                date: new Date('2020-04-06T10:00:00.000Z'),
                isLocaleDate: true,
                description: undefined,
                duration: 0,
                id: 'random-id',
                lienVisio: 'lienvisio.com',
                modality: 'par visio',
                organisme: undefined,
                telephone: undefined,
                theme: undefined,
                title: '',
                type: {
                  code: CodeTypeRendezVous.PRESTATION,
                  label: 'Prestation'
                },
                visio: true,
                source: RendezVous.Source.POLE_EMPLOI
              },
              {
                agencePE: false,
                date: new Date('2020-04-06T12:20:00.000Z'),
                duration: 23,
                id: 'random-id',
                modality: 'par visio',
                theme: 'theme',
                presenceConseiller: true,
                conseiller: undefined,
                comment: 'commentaire',
                adresse: '12 rue Albert Camus 75018 Paris',
                title: '',
                type: {
                  code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
                  label: 'Entretien individuel conseiller'
                },
                isLocaleDate: true,
                visio: true,
                lienVisio: 'lien',
                source: RendezVous.Source.POLE_EMPLOI
              }
            ],
            dateDuCache: undefined
          }
          expect(result).to.deep.equal(success(expected))
        })
        it('renvoie les prestations et rdv quand une erreur se produit lors de la recuperation de la visio', async () => {
          // Given
          const idVisio = '1'
          const prestations: PrestationDto[] = [
            {
              identifiantStable: idVisio,
              session: {
                natureAnimation: 'INTERNE',
                modalitePremierRendezVous: 'WEBCAM',
                dateDebut: '2020-04-06T10:00:00+01:00',
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true
              }
            },
            {
              session: {
                dateDebut: datePrestation,
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true
              }
            }
          ]
          const rendezVous: RendezVousPoleEmploiDto[] = [
            {
              date: dateRendezVous,
              heure: heureRendezVous,
              duree: 23
            }
          ]

          dateService.now.returns(maintenant)
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success(prestations))
          poleEmploiPartenaireClient.getLienVisio
            .withArgs(idpToken, idVisio)
            .resolves(failureApi(new ErreurHttp('Erreur', 500)))
          poleEmploiPartenaireClient.getRendezVous
            .withArgs(idpToken)
            .resolves(success(rendezVous))

          // When
          const result = await queryGetter.handle(query)
          // Then
          expect(
            poleEmploiPartenaireClient.getLienVisio
          ).to.have.been.calledWithExactly(
            idpToken,
            prestations[0].identifiantStable
          )
          expect(result._isSuccess).to.equal(true)
          if (result._isSuccess)
            expect(result.data.queryModel.length).to.equal(3)
        })
      })
      describe('quand le rendez est annulé', () => {
        it('retire de la liste des rdv les rdv annulés', async () => {
          // Given
          const prestations: PrestationDto[] = [
            {
              annule: true,
              datefin: '',
              session: {
                natureAnimation: 'INTERNE',
                modalitePremierRendezVous: 'WEBCAM',
                dateDebut: datePrestation,
                dateFinPrevue: '',
                dateLimite: '',
                duree: {
                  unite: 'JOUR',
                  valeur: 1.0
                },
                enAgence: true
              }
            }
          ]

          dateService.now.returns(maintenant)
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success(prestations))
          poleEmploiPartenaireClient.getRendezVous
            .withArgs(idpToken)
            .resolves(success([]))

          // When
          const result = await queryGetter.handle(query)
          // Then
          const expected: Cached<RendezVousJeuneQueryModel[]> = {
            queryModel: [],
            dateDuCache: undefined
          }
          expect(result).to.deep.equal(success(expected))
        })
      })
      describe('quand une erreur se produit', () => {
        it('renvoie un succes quand une erreur rendezVous Agenda se produit', async () => {
          // Given
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)

          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(success([]))
          poleEmploiPartenaireClient.getRendezVous
            .withArgs(idpToken)
            .resolves(failureApi(new ErreurHttp('Erreur', 500)))

          // When
          const result = await queryGetter.handle(query)

          // Then
          expect(result._isSuccess).to.equal(true)
        })
        it('renvoie une failure quand une erreur client se produit', async () => {
          // Given
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.returns(maintenant)

          poleEmploiPartenaireClient.getPrestations
            .withArgs(idpToken, maintenant)
            .resolves(failureApi(new ErreurHttp('Erreur', 500)))

          // When
          const result = await queryGetter.handle(query)

          // Then
          expect(result._isSuccess).to.equal(false)
          if (!result._isSuccess)
            expect(result.error.code).to.equal('ERREUR_HTTP')
        })
        it('throw une erreur quand une erreur interne se produit', async () => {
          // Given
          const errorMessage = 'Date Error'

          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          dateService.now.throws(new Error(errorMessage))

          try {
            await queryGetter.handle(query)
            expect.fail(null, null, 'handle test did not reject with an error')
          } catch (e) {
            expect(e.message).to.equal(errorMessage)
          }
        })
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const query: GetRendezVousJeunePoleEmploiQuery = {
          idJeune: '1',
          accessToken: 'token'
        }

        jeunesRepository.get.withArgs(query.idJeune).resolves(undefined)

        // When
        const result = await queryGetter.handle(query)
        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', query.idJeune))
        )
      })
    })
  })
})
