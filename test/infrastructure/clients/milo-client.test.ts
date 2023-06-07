import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { MiloClient } from '../../../src/infrastructure/clients/milo-client'
import { testConfig } from '../../utils/module-for-testing'
import {
  uneListeDeStructuresConseillerMiloDto,
  uneSessionConseillerListeDto
} from '../../fixtures/milo-dto.fixture'
import { success } from '../../../src/building-blocks/types/result'

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
        .get(`/operateurs/structures/${idStructure}/sessions`)
        .reply(200, uneSessionConseillerListeDto)
        .isDone()

      // When
      const result = await miloClient.getSessionsConseiller(
        idpToken,
        idStructure
      )
      // Then
      expect(result).to.deep.equal(success(uneSessionConseillerListeDto))
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
