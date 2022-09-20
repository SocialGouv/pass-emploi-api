import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { uneDatetime } from '../../fixtures/date.fixture'
import { PoleEmploiPartenaireClient } from '../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { uneDemarcheDto } from '../../fixtures/demarches-dto.fixtures'
import { Demarche } from '../../../src/domain/demarche'
import { failure, isSuccess } from '../../../src/building-blocks/types/result'
import { expect, stubClass } from '../../utils'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { Context } from 'src/building-blocks/context'

describe('PoleEmploiPartenaireClient', () => {
  let poleEmploiPartenaireClient: PoleEmploiPartenaireClient
  const configService = testConfig()
  const tokenJeune = 'token'

  beforeEach(() => {
    const httpService = new HttpService()
    poleEmploiPartenaireClient = new PoleEmploiPartenaireClient(
      httpService,
      configService,
      stubClass(Context)
    )
  })

  describe('getPrestations', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      nock('https://api-r.es-qvr.fr/partenaire')
        .get(
          '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-04-06'
        )
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getPrestations(
        tokenJeune,
        uneDatetime
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })

  describe('getLienVisio', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const idVisio = '1'

      nock('https://api-r.es-qvr.fr/partenaire')
        .get('/peconnect-gerer-prestations/v1/lien-visio/rendez-vous/1')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getLienVisio(
        tokenJeune,
        idVisio
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })

  describe('getRendezVous', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      nock('https://api-r.es-qvr.fr/partenaire')
        .get('/peconnect-rendezvousagenda/v1/listerendezvous')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getRendezVous(
        tokenJeune
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })

  describe('getDemarches', () => {
    describe('quand il y a des data', () => {
      it('renvoie les démarches', async () => {
        // Given
        nock('https://api-r.es-qvr.fr/partenaire')
          .get('/peconnect-demarches/v1/demarches')
          .reply(200, [uneDemarcheDto()])
          .isDone()

        // When
        const demarcheDtos = await poleEmploiPartenaireClient.getDemarches(
          tokenJeune
        )

        // Then
        expect(demarcheDtos).to.deep.equal([uneDemarcheDto()])
      })
    })
    describe('quand il y a no content', () => {
      it('renvoie un tableau vide', async () => {
        // Given
        nock('https://api-r.es-qvr.fr/partenaire')
          .get('/peconnect-demarches/v1/demarches')
          .reply(204, '')
          .isDone()

        // When
        const demarcheDtos = await poleEmploiPartenaireClient.getDemarches(
          tokenJeune
        )

        // Then
        expect(demarcheDtos).to.deep.equal([])
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
            dateModification: uneDatetime,
            dateDebut: uneDatetime
          }
          const body = {
            id: demarcheModifiee.id,
            dateModification: '2020-04-06T12:00:00.000',
            origineModification: 'INDIVIDU',
            etat: 'AC',
            dateDebut: '2020-04-06T12:00:00.000',
            dateFin: undefined,
            dateAnnulation: undefined
          }

          nock('https://api-r.es-qvr.fr/partenaire')
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
            dateModification: uneDatetime,
            dateDebut: undefined
          }
          const body = {
            id: demarcheModifiee.id,
            dateModification: '2020-04-06T12:00:00.000',
            origineModification: 'INDIVIDU',
            etat: 'AC',
            dateDebut: undefined,
            dateFin: undefined,
            dateAnnulation: undefined
          }

          nock('https://api-r.es-qvr.fr/partenaire')
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
          dateModification: uneDatetime,
          dateDebut: uneDatetime
        }
        const body = {
          id: demarcheModifiee.id,
          dateModification: '2020-04-06T12:00:00.000',
          origineModification: 'INDIVIDU',
          etat: 'AC',
          dateDebut: '2020-04-06T12:00:00.000',
          dateFin: undefined,
          dateAnnulation: undefined
        }
        nock('https://api-r.es-qvr.fr/partenaire')
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
      dateCreation: uneDatetime,
      dateFin: uneDatetime,
      pourquoi: 'test',
      quoi: 'test',
      comment: 'comment',
      description: 'test'
    }
    const body = {
      origineCreateur: 'INDIVIDU',
      etat: 'AC',
      dateCreation: '2020-04-06T12:00:00.000',
      dateFin: '2020-04-06T12:00:00.000',
      pourquoi: 'test',
      quoi: 'test',
      comment: 'comment',
      description: 'test'
    }
    describe('quand tout va bien', () => {
      it('construit le payload et crée la démarche', async () => {
        // Given
        nock('https://api-r.es-qvr.fr/partenaire')
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
        nock('https://api-r.es-qvr.fr/partenaire')
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
})
