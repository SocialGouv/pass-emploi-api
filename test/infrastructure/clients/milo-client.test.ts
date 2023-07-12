import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { testConfig } from 'test/utils/module-for-testing'
import {
  unDetailSessionConseillerDto,
  unDetailSessionJeuneDto,
  uneInscriptionSessionMiloDto,
  uneListeDeStructuresConseillerMiloDto,
  uneSessionConseillerListeDto,
  uneSessionJeuneListeDto
} from 'test/fixtures/milo-dto.fixture'
import { success } from 'src/building-blocks/types/result'
import { DateTime } from 'luxon'

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
      const result = await miloClient.getListeInscritsSessionConseillers(
        idpToken,
        idSession
      )
      // Then
      expect(result).to.deep.equal(success([uneInscriptionSessionMiloDto()]))
    })
  })
})
