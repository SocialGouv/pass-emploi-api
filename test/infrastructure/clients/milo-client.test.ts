import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import { emptySuccess, success } from 'src/building-blocks/types/result'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import {
  unDetailSessionConseillerDto,
  unDetailSessionJeuneDto,
  uneInscriptionSessionMiloDto,
  uneListeDeStructuresConseillerMiloDto,
  uneSessionConseillerListeDto,
  uneSessionJeuneListeDto
} from 'test/fixtures/milo-dto.fixture'
import { testConfig } from 'test/utils/module-for-testing'

describe('MiloClient', () => {
  const configService = testConfig()
  let miloClient: MiloClient
  const MILO_BASE_URL = 'https://milo.com'

  beforeEach(() => {
    const httpService = new HttpService()
    miloClient = new MiloClient(httpService, configService)
  })

  describe('getSessionsConseiller', () => {
    it('recupere la liste des sessions milo de la structure du conseiller', async () => {
      // Given
      const idpToken = 'idpToken'
      const idStructure = '1'

      nock(MILO_BASE_URL)
        .get(
          `/operateurs/structures/${idStructure}/sessions?dateDebutRecherche=2023-05-31&dateFinRecherche=2023-06-29`
        )
        .reply(200, uneSessionConseillerListeDto)
        .isDone()

      // When
      const result = await miloClient.getSessionsConseiller(
        idpToken,
        idStructure,
        'America/Cayenne',
        DateTime.fromISO('2023-06-01T00:00:00'),
        DateTime.fromISO('2023-06-30T00:00:00')
      )

      // Then
      expect(result).to.deep.equal(success(uneSessionConseillerListeDto))
    })
  })

  describe('getSessionsJeune', () => {
    it('recupere la liste des sessions milo accessible au jeune', async () => {
      // Given
      const idpToken = 'idpToken'
      const idDossier = 'idDossier'

      nock(MILO_BASE_URL)
        .get(`/operateurs/sessions?idDossier=${idDossier}`)
        .reply(200, uneSessionJeuneListeDto)
        .isDone()

      // When
      const result = await miloClient.getSessionsJeune(idpToken, idDossier)

      // Then
      expect(result).to.deep.equal(success(uneSessionJeuneListeDto))
    })
  })

  describe('getDetailSessionConseiller', () => {
    it('recupere le detail d’une sessions milo', async () => {
      // Given
      const idpToken = 'idpToken'
      const idSession = '1'

      nock(MILO_BASE_URL)
        .get(`/operateurs/sessions/${idSession}`)
        .reply(200, unDetailSessionConseillerDto)
        .isDone()

      // When
      const result = await miloClient.getDetailSessionConseiller(
        idpToken,
        idSession
      )
      // Then
      expect(result).to.deep.equal(success(unDetailSessionConseillerDto))
    })
  })

  describe('getDetailSessionJeune', () => {
    it('recupere le detail d’une sessions milo', async () => {
      // Given
      const idpToken = 'idpToken'
      const idSession = '1'

      nock(MILO_BASE_URL)
        .get(`/operateurs/sessions/${idSession}`)
        .reply(200, unDetailSessionJeuneDto)
        .isDone()

      // When
      const result = await miloClient.getDetailSessionJeune(idpToken, idSession)

      // Then
      expect(result).to.deep.equal(success(unDetailSessionJeuneDto))
    })
  })

  describe('getStructureConseiller', () => {
    it('recupere la structure principale du conseiller', async () => {
      // Given
      const idpToken = 'idpToken'

      nock(MILO_BASE_URL)
        .get(`/operateurs/utilisateurs/moi/structures`)
        .reply(200, uneListeDeStructuresConseillerMiloDto)
        .isDone()

      // When
      const result = await miloClient.getStructureConseiller(idpToken)
      // Then
      expect(result).to.deep.equal(
        success(uneListeDeStructuresConseillerMiloDto[1])
      )
    })
  })

  describe('getListeInscritsSessionConseillers', () => {
    it('recupere les inscrits d’une sessions milo', async () => {
      // Given
      const idpToken = 'idpToken'
      const idSession = '1'

      nock(MILO_BASE_URL)
        .get(`/operateurs/sessions/${idSession}/inscrits`)
        .reply(200, [uneInscriptionSessionMiloDto()])
        .isDone()

      // When
      const result = await miloClient.getListeInscritsSession(
        idpToken,
        idSession
      )
      // Then
      expect(result).to.deep.equal(success([uneInscriptionSessionMiloDto()]))
    })
  })

  describe('inscrireJeunesSession', () => {
    it('inscrit chaque jeune à la session', async () => {
      // Given
      const idSession = 'id-session'
      const idsDossier = ['id-dossier-1', 'id-dossier-2', 'id-dossier-3']

      const scope1 = nock(MILO_BASE_URL)
        .post(
          `/operateurs/dossiers/${idsDossier[0]}/instances-session`,
          JSON.stringify(idSession)
        )
        .reply(201)
      const scope2 = nock(MILO_BASE_URL)
        .post(
          `/operateurs/dossiers/${idsDossier[1]}/instances-session`,
          JSON.stringify(idSession)
        )
        .reply(201)
      const scope3 = nock(MILO_BASE_URL)
        .post(
          `/operateurs/dossiers/${idsDossier[2]}/instances-session`,
          JSON.stringify(idSession)
        )
        .reply(201)

      // When
      const result = await miloClient.inscrireJeunesSession(
        'idpToken',
        idSession,
        idsDossier
      )

      // Then
      expect(scope1.isDone()).to.equal(true)
      expect(scope2.isDone()).to.equal(true)
      expect(scope3.isDone()).to.equal(true)
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
