import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { MiloClient } from '../../../src/infrastructure/clients/milo-client'
import { testConfig } from '../../utils/module-for-testing'
import {
  unDetailSessionConseillerDto,
  uneListeDeStructuresConseillerMiloDto,
  uneSessionConseillerListeDto
} from '../../fixtures/milo-dto.fixture'
import { success } from '../../../src/building-blocks/types/result'
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
})
