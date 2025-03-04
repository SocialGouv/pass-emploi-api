import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { Op } from 'sequelize'
import { Context, ContextKey } from 'src/building-blocks/context'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import {
  failureApi,
  successApi
} from '../../../src/building-blocks/types/result-api'
import { Core } from '../../../src/domain/core'
import { Demarche } from '../../../src/domain/demarche'
import { DocumentPoleEmploiDto } from '../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { PoleEmploiPartenaireClient } from '../../../src/infrastructure/clients/pole-emploi-partenaire-client.db'
import {
  CacheApiPartenaireDto,
  CacheApiPartenaireSqlModel
} from '../../../src/infrastructure/sequelize/models/cache-api-partenaire.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneDemarcheDto } from '../../fixtures/demarches-dto.fixtures'
import { unePrestationDto } from '../../fixtures/pole-emploi-partenaire.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { testConfig } from '../../utils/module-for-testing'

describe('PoleEmploiPartenaireClient', () => {
  let poleEmploiPartenaireClient: PoleEmploiPartenaireClient
  const configService = testConfig()
  const PARTENAIRE_BASE_URL = 'https://api.peio.pe-qvr.fr/partenaire'
  const tokenJeune = 'token'
  let context: StubbedClass<Context>
  let databaseForTesting: DatabaseForTesting
  const utilisateurJeunePE = unUtilisateurJeune({
    id: 'hermione',
    structure: Core.Structure.POLE_EMPLOI
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    databaseForTesting = getDatabase()
    context = stubClass(Context)
    context.get.withArgs(ContextKey.UTILISATEUR).returns(utilisateurJeunePE)

    const httpService = new HttpService()
    poleEmploiPartenaireClient = new PoleEmploiPartenaireClient(
      httpService,
      configService,
      context,
      databaseForTesting.sequelize
    )
  })

  describe('getPrestations', () => {
    describe("quand l'api est up", () => {
      it('renvoie les prestations', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get(
            '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-04-06'
          )
          .reply(200, [])
          .isDone()

        // When
        const response = await poleEmploiPartenaireClient.getPrestations(
          tokenJeune,
          uneDatetime()
        )

        // Then
        expect(response).to.deep.equal(successApi([]))
      })
    })
    describe("quand l'api est en 500", () => {
      beforeEach(() => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get(
            '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-04-06'
          )
          .reply(500, 'erreur')
      })
      describe('quand il y a un cache', () => {
        it('renvoie les prestations du cache', async () => {
          // Given
          const CacheApiDto: AsSql<CacheApiPartenaireDto> = {
            id: 'd90e397a-dcb3-4a7b-8eac-3dec0aa55dfa',
            idUtilisateur: 'hermione',
            typeUtilisateur: 'JEUNE',
            date: uneDatetime().toJSDate(),
            pathPartenaire: 'peconnect-gerer-prestations/v1/rendez-vous',
            resultatPartenaire: [unePrestationDto()],
            transactionId: 'transactionId'
          }
          await CacheApiPartenaireSqlModel.create(CacheApiDto)

          // When
          const response = await poleEmploiPartenaireClient.getPrestations(
            tokenJeune,
            uneDatetime()
          )

          // Then
          expect(response).to.deep.equal(
            successApi([unePrestationDto()], uneDatetime())
          )
        })
      })
      describe("quand il n'y a pas de cache", () => {
        it('renvoie la 500', async () => {
          // Given
          const CacheApiDto: AsSql<CacheApiPartenaireDto> = {
            id: 'd90e397a-dcb3-4a7b-8eac-3dec0aa55dfa',
            idUtilisateur: 'le-cache-de-quelqun-dautre',
            typeUtilisateur: 'JEUNE',
            date: uneDatetime().toJSDate(),
            pathPartenaire:
              '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-03-06',
            resultatPartenaire: [unePrestationDto()],
            transactionId: 'transactionId'
          }
          await CacheApiPartenaireSqlModel.create(CacheApiDto)

          // When
          const response = await poleEmploiPartenaireClient.getPrestations(
            tokenJeune,
            uneDatetime()
          )

          // Then
          expect(response).to.deep.equal(
            failureApi(new ErreurHttp('erreur', 500))
          )
        })
      })
    })
    describe("quand l'api est en erreur autre que 500", () => {
      it("renvoie l'erreur", async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get(
            '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-04-06'
          )
          .reply(400, 'erreur')
          .isDone()

        // When
        const response = await poleEmploiPartenaireClient.getPrestations(
          tokenJeune,
          uneDatetime()
        )

        // Then
        expect(response).to.deep.equal(
          failureApi(new ErreurHttp('erreur', 400))
        )
      })
    })
  })

  describe('getLienVisio', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const idVisio = '1'

      nock(PARTENAIRE_BASE_URL)
        .get('/peconnect-gerer-prestations/v1/lien-visio/rendez-vous/1')
        .reply(200, 'https://lien-visio.fr')
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getLienVisio(
        tokenJeune,
        idVisio
      )

      // Then
      expect(response).to.deep.equal(success('https://lien-visio.fr'))
    })
  })

  describe('getDocuments', () => {
    describe('quand on reçoit une 200', () => {
      it('retourne les documents', async () => {
        // Given
        const documentsDto: DocumentPoleEmploiDto[] = [
          {
            titre: 'CVTest',
            nomFichier: 'CVTest.pdf',
            url: 'https://entreprise.pe-qvr.fr/docnums/portfolio-usager/G1tE02iVu0cVk9L4I2fdTp0uDICAaJuZ/CVTest.pdf?Expires=1680785474&Signature=wRUu4iakc%2BFRJDPA37BYbM%2BbyNA%3D',
            format: 'DOCUMENT',
            type: {
              libelle: 'CV',
              code: 'CV'
            }
          },
          {
            titre: 'CVTest2',
            nomFichier: 'aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
            url: 'https://entreprise.pe-qvr.fr/docnums/portfolio-usager/1dTmSWPOPhFUjHy5FtpSoJ9UtqRb0Oat/CVTest2.pdf?Expires=1680785474&Signature=K1qEcZV2lx8a1XYHm2AFAcGD9lA%3D',
            format: 'DOCUMENT',
            type: {
              libelle: 'CV',
              code: 'CV'
            }
          },
          {
            titre: 'LM_Test_2',
            nomFichier: 'david-svihovec-5X2ViX_r0ZA-unsplash.jpg',
            url: 'https://entreprise.pe-qvr.fr/docnums/portfolio-usager/hyso6KKbs6d46qsKGYuDIzmISIkUkjT3/LM_Test_2.pdf?Expires=1680785474&Signature=R3g2nlipky3WqPbnajwyMxc42AE%3D',
            format: 'DOCUMENT',
            type: {
              libelle: 'Lettre de motivation',
              code: 'LM'
            }
          },
          {
            titre: 'LM_Test_3_ aaaaaaaaaaaaaaa aaaaaaaaaaa aaaaaaaaaaa',
            nomFichier: '20230200057Développeureusefonctionnel.pdf',
            url: 'https://entreprise.pe-qvr.fr/docnums/portfolio-usager/DXfW3pIr4Z9gXc5H7RKyMZMoF0PzCaNu/LM_Test_3__aaaaaaaaaaaaaaa_aaaaaaaaaaa_aaaaaaaaaaa.pdf?Expires=1680785474&Signature=w3MNPpmGigVEtAeI%2FBrGRdzOB7Q%3D',
            format: 'DOCUMENT',
            type: {
              libelle: 'Lettre de motivation',
              code: 'LM'
            }
          }
        ]
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-telecharger-cv-realisation/v1/piecesjointes')
          .reply(200, documentsDto)
          .isDone()

        // When
        const response = await poleEmploiPartenaireClient.getDocuments(
          tokenJeune
        )

        // Then
        expect(response).to.deep.equal(success(documentsDto))
      })
    })
    describe('quand on reçoit une 204', () => {
      it('renvoie une liste vide', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-telecharger-cv-realisation/v1/piecesjointes')
          .reply(204)
          .isDone()

        // When
        const response = await poleEmploiPartenaireClient.getDocuments(
          tokenJeune
        )

        // Then
        expect(response).to.deep.equal(success([]))
      })
    })
  })

  describe('getRendezVous', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      nock(PARTENAIRE_BASE_URL)
        .get('/peconnect-rendezvousagenda/v2/listerendezvous')
        .query({ dateDebut: uneDatetime().toUTC().toISO() })
        .reply(200, [])
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getRendezVous(
        tokenJeune,
        uneDatetime()
      )

      // Then
      expect(response).to.deep.equal(successApi([]))
    })
  })

  describe('getCatalogue', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      const catalogue = {
        code: 'P02',
        libelle: 'Ma formation professionnelle',
        typesDemarcheRetourEmploi: [
          {
            type: 'TypeDemarcheRetourEmploiReferentielPartenaire',
            code: 'Q06',
            libelle:
              "Information sur un projet de formation ou de Validation des acquis de l'expérience",
            moyensRetourEmploi: [
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C06.01',
                libelle:
                  "En participant à un atelier, une prestation, une réunion d'information",
                droitCreation: false
              }
            ]
          }
        ]
      }
      // Given
      nock(PARTENAIRE_BASE_URL)
        .get('/peconnect-demarches/v1/referentiel/demarches')
        .reply(200, [catalogue])
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getCatalogue(tokenJeune)

      // Then
      expect(response).to.deep.equal(success([catalogue]))
    })
  })

  describe('getDemarches', () => {
    describe('quand il y a des data', () => {
      it('renvoie les démarches et stocke en cache', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-demarches/v1/demarches')
          .reply(200, [uneDemarcheDto()])
          .isDone()

        // When
        const demarcheDtos = await poleEmploiPartenaireClient.getDemarches(
          tokenJeune
        )

        // Then
        expect(demarcheDtos).to.deep.equal(success([uneDemarcheDto()]))

        await new Promise(resolve => setTimeout(resolve, 3000))
        expect(context.get).to.have.been.calledOnceWithExactly('UTILISATEUR')

        const cacheAPI = await CacheApiPartenaireSqlModel.findOne({
          where: {
            pathPartenaire: {
              [Op.like]: `%peconnect-demarches/v1/demarches%`
            },
            idUtilisateur: utilisateurJeunePE.id
          },
          order: [['date', 'DESC']]
        })
        expect(cacheAPI?.resultatPartenaire).to.deep.equal([uneDemarcheDto()])
      })
    })
    describe('quand il y a no content', () => {
      it('renvoie un tableau vide', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-demarches/v1/demarches')
          .reply(204, '')
          .isDone()

        // When
        const demarcheDtos = await poleEmploiPartenaireClient.getDemarches(
          tokenJeune
        )

        // Then
        expect(demarcheDtos).to.deep.equal(successApi([]))
      })
    })
  })

  describe('getDemarchesEnCache', () => {
    describe('quand il y a un cache', () => {
      it('renvoie les démarches du cache', async () => {
        // Given
        const conseiller = unUtilisateurConseiller()
        context.get.withArgs(ContextKey.UTILISATEUR).returns(conseiller)
        const CacheApiDto: AsSql<CacheApiPartenaireDto> = {
          id: 'd90e397a-dcb3-4a7b-8eac-3dec0aa55dfa',
          idUtilisateur: conseiller.id,
          typeUtilisateur: 'CONSEILLER',
          date: uneDatetime().toJSDate(),
          pathPartenaire:
            'peconnect-demarches/v1/demarches?cacheParam=hermione',
          resultatPartenaire: [uneDemarcheDto()],
          transactionId: 'transactionId'
        }
        await CacheApiPartenaireSqlModel.create(CacheApiDto)

        // When
        const response = await poleEmploiPartenaireClient.getDemarchesEnCache(
          'hermione'
        )

        // Then
        expect(response).to.deep.equal(
          successApi([uneDemarcheDto()], uneDatetime())
        )
      })
    })
    describe("quand il n'y a pas de cache", () => {
      it('remonte une 404', async () => {
        // Given
        const CacheApiDto: AsSql<CacheApiPartenaireDto> = {
          id: 'd90e397a-dcb3-4a7b-8eac-3dec0aa55dfa',
          idUtilisateur: 'hermione',
          typeUtilisateur: 'JEUNE',
          date: uneDatetime().toJSDate(),
          pathPartenaire: '/peconnect-demarches/v1/demarches',
          resultatPartenaire: [uneDemarcheDto()],
          transactionId: 'transactionId'
        }
        await CacheApiPartenaireSqlModel.create(CacheApiDto)

        // When
        const response = await poleEmploiPartenaireClient.getDemarchesEnCache(
          'hermione'
        )

        // Then
        expect(response).to.deep.equal(
          failureApi(new ErreurHttp('Aucune démarche en cache', 404))
        )
      })
    })
  })

  describe('updateDemarche', () => {
    const demarcheDto = uneDemarcheDto()

    describe('quand tout fonctionne', () => {
      describe('statut en cours', () => {
        it('construit le payload et met à jour la démarche', async () => {
          // Given
          const demarcheModifiee: Demarche.Modifiee = {
            id: 'idDemarche',
            statut: Demarche.Statut.EN_COURS,
            dateModification: uneDatetime(),
            dateDebut: uneDatetime()
          }
          const body = {
            id: demarcheModifiee.id,
            dateModification: '2020-04-06T12:00:00.000Z',
            origineModification: 'INDIVIDU',
            etat: 'AC',
            dateDebut: '2020-04-06T12:00:00.000Z',
            dateFin: undefined,
            dateAnnulation: undefined
          }

          nock(PARTENAIRE_BASE_URL)
            .put('/peconnect-demarches/v1/demarches/idDemarche', body)
            .reply(200, demarcheDto)
            .isDone()

          // When
          const result = await poleEmploiPartenaireClient.updateDemarche(
            demarcheModifiee,
            tokenJeune
          )

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(demarcheDto)
          }
        })
      })
      describe('statut à faire', () => {
        it('construit le payload et met à jour la démarche', async () => {
          // Given
          const demarcheModifiee: Demarche.Modifiee = {
            id: 'idDemarche',
            statut: Demarche.Statut.A_FAIRE,
            dateModification: uneDatetime(),
            dateDebut: undefined
          }
          const body = {
            id: demarcheModifiee.id,
            dateModification: '2020-04-06T12:00:00.000Z',
            origineModification: 'INDIVIDU',
            etat: 'AC',
            dateDebut: undefined,
            dateFin: undefined,
            dateAnnulation: undefined
          }

          nock(PARTENAIRE_BASE_URL)
            .put('/peconnect-demarches/v1/demarches/idDemarche', body)
            .reply(200, demarcheDto)
            .isDone()

          // When
          const result = await poleEmploiPartenaireClient.updateDemarche(
            demarcheModifiee,
            tokenJeune
          )

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(demarcheDto)
          }
        })
      })
    })
    describe("quand il y' une erreur", () => {
      it('renvoie une failure', async () => {
        // Given
        const demarcheModifiee: Demarche.Modifiee = {
          id: 'idDemarche',
          statut: Demarche.Statut.EN_COURS,
          dateModification: uneDatetime(),
          dateDebut: uneDatetime()
        }
        const body = {
          id: demarcheModifiee.id,
          dateModification: '2020-04-06T12:00:00.000Z',
          origineModification: 'INDIVIDU',
          etat: 'AC',
          dateDebut: '2020-04-06T12:00:00.000Z',
          dateFin: undefined,
          dateAnnulation: undefined
        }
        nock(PARTENAIRE_BASE_URL)
          .put('/peconnect-demarches/v1/demarches/idDemarche', body)
          .reply(400, 'un message')
          .isDone()

        // When
        const result = await poleEmploiPartenaireClient.updateDemarche(
          demarcheModifiee,
          tokenJeune
        )

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('un message', 400)))
      })
    })
  })

  describe('createDemarche', () => {
    const demarcheDto = uneDemarcheDto()
    const demarche: Demarche.Creee = {
      statut: Demarche.Statut.A_FAIRE,
      dateCreation: uneDatetime(),
      dateFin: uneDatetime(),
      pourquoi: 'test',
      quoi: 'test',
      comment: 'comment',
      description: 'test'
    }
    const body = {
      origineCreateur: 'INDIVIDU',
      etat: 'AC',
      dateCreation: '2020-04-06T12:00:00.000Z',
      dateFin: '2020-04-06T12:00:00.000Z',
      pourquoi: 'test',
      quoi: 'test',
      comment: 'comment',
      description: 'test'
    }
    describe('quand tout va bien', () => {
      it('construit le payload et crée la démarche', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .post('/peconnect-demarches/v1/demarches', body)
          .reply(200, demarcheDto)
          .isDone()

        // When
        const result = await poleEmploiPartenaireClient.createDemarche(
          demarche,
          tokenJeune
        )

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data).to.deep.equal(demarcheDto)
        }
      })
    })
    describe("quand il y' une erreur", () => {
      it('renvoie une failure', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .post('/peconnect-demarches/v1/demarches', body)
          .reply(400, 'un message')
          .isDone()

        // When
        const result = await poleEmploiPartenaireClient.createDemarche(
          demarche,
          tokenJeune
        )

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('un message', 400)))
      })
    })
  })

  describe('getSuggestionsRecherches', () => {
    describe('quand l’appel api PE retourne un succès', () => {
      it('retourne les suggestions', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(200, [])
          .isDone()

        // When
        const result =
          await poleEmploiPartenaireClient.getSuggestionsRecherches(tokenJeune)

        // Then
        expect(result).to.deep.equal(success([]))
      })
    })
    describe('quand l’appel api PE retourne une 429', () => {
      it('refait un essai et retourne les suggestions', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(429)
          .isDone()
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(200, [])
          .isDone()

        // When
        const result =
          await poleEmploiPartenaireClient.getSuggestionsRecherches(tokenJeune)

        // Then
        expect(result).to.deep.equal(success([]))
      })
      it('refait un seul essai puis échoue', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(429)
          .isDone()
        nock(PARTENAIRE_BASE_URL)
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(429)
          .isDone()

        // When
        const result =
          await poleEmploiPartenaireClient.getSuggestionsRecherches(tokenJeune)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('', 429)))
      })
    })
    describe('quand l’appel api PE échoue', () => {
      it('retourne une failure', async () => {
        // Given
        nock(PARTENAIRE_BASE_URL)
          .get('/peconnect-metiersrecherches/v1/metiersrecherches')
          .reply(400, 'un message')
          .isDone()

        // When
        const result =
          await poleEmploiPartenaireClient.getSuggestionsRecherches(tokenJeune)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('un message', 400)))
      })
    })
  })
})
