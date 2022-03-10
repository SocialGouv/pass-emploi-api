import {
  GetRendezVousJeunePoleEmploiQuery,
  GetRendezVousJeunePoleEmploiQueryHandler
} from '../../../src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { DateService } from '../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Jeune } from '../../../src/domain/jeune'
import { PoleEmploiPrestationsClient } from '../../../src/infrastructure/clients/pole-emploi-prestations-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'

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
    getRendezVousJeunePoleEmploiQueryHandler =
      new GetRendezVousJeunePoleEmploiQueryHandler(
        jeunesRepository,
        poleEmploiPrestationsClient,
        jeunePoleEmploiAuthorizer,
        dateService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      describe('quand le lien de la visio n"est pas encore disponible', () => {
        it('récupère les rendez-vous Pole Emploi du jeune', async () => {
          // Given
          const query: GetRendezVousJeunePoleEmploiQuery = {
            idJeune: '1',
            idpToken: 'token'
          }
          const jeune = unJeune()
          const date = new Date('2020-04-06')
          const maintenant = uneDatetime
          const rendezVousPoleEmploiPrestationsResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: [
              {
                annule: false,
                datefin: date,
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
                    disponibleAutoInscription: false,
                    libelle: "Utiliser Internet dans sa recherche d'emploi",
                    type: 'THA',
                    typeCourrier: 'CON'
                  },
                  typePrestation: {
                    code: 'ATE',
                    libelle: 'Atelier',
                    actif: true
                  }
                }
              }
            ]
          }

          jeunesRepository.getQueryModelById
            .withArgs(query.idJeune)
            .resolves(jeune)
          dateService.now.returns(maintenant)
          poleEmploiPrestationsClient.getRendezVous
            .withArgs(query.idpToken, maintenant)
            .resolves(rendezVousPoleEmploiPrestationsResponse)

          // When
          const result = await getRendezVousJeunePoleEmploiQueryHandler.handle(
            query
          )
          // Then
          expect(result).to.deep.equal({
            _isSuccess: true,
            data: [
              {
                adresse:
                  '588 BOULEVARD ALBERT CAMUS  69665 VILLEFRANCHE SUR SAONE',
                agencePE: true,
                annule: false,
                comment: undefined,
                date: date,
                description: "Utiliser Internet dans sa recherche d'emploi",
                duration: 1440,
                id: 'inconnu-prestation',
                jeune: {
                  id: 'ABCDE',
                  nom: 'Doe',
                  prenom: 'John'
                },
                lienVisio: undefined,
                modality: '',
                organisme: undefined,
                presenceConseiller: true,
                telephone: undefined,
                theme: 'Atelier',
                title: 'Prestation',
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
          const maintenant = uneDatetime
          const rendezVousPoleEmploiPrestationsResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: [
              {
                annule: false,
                datefin: date,
                identifiantStable: '1',
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
                    disponibleAutoInscription: false,
                    libelle: "Utiliser Internet dans sa recherche d'emploi",
                    type: 'THA',
                    typeCourrier: 'CON'
                  },
                  typePrestation: {
                    code: 'ATE',
                    libelle: 'Atelier',
                    actif: true
                  }
                }
              }
            ]
          }

          const lienVisioResponse = {
            config: undefined,
            headers: undefined,
            request: undefined,
            status: 200,
            statusText: '',
            data: 'lienvisio.com'
          }

          jeunesRepository.getQueryModelById
            .withArgs(query.idJeune)
            .resolves(jeune)
          dateService.now.returns(maintenant)
          poleEmploiPrestationsClient.getRendezVous
            .withArgs(query.idpToken, maintenant)
            .resolves(rendezVousPoleEmploiPrestationsResponse)
          poleEmploiPrestationsClient.getLienVisio
            .withArgs(query.idpToken, '1')
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
                adresse:
                  '588 BOULEVARD ALBERT CAMUS  69665 VILLEFRANCHE SUR SAONE',
                agencePE: true,
                annule: false,
                comment: undefined,
                date: date,
                description: "Utiliser Internet dans sa recherche d'emploi",
                duration: 1440,
                id: 'inconnu-prestation',
                jeune: {
                  id: 'ABCDE',
                  nom: 'Doe',
                  prenom: 'John'
                },
                lienVisio: 'lienvisio.com',
                modality: '',
                organisme: undefined,
                presenceConseiller: true,
                telephone: undefined,
                theme: 'Atelier',
                title: 'Prestation',
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
    })
    describe('quand le jeune n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        const query: GetRendezVousJeunePoleEmploiQuery = {
          idJeune: '1',
          idpToken: 'token'
        }

        jeunesRepository.getQueryModelById
          .withArgs(query.idJeune)
          .resolves(undefined)

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
