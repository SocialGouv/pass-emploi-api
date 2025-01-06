import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { unFichier } from 'test/fixtures/fichier.fixture'
import {
  AnalyseAntivirusPasTerminee,
  ErreurHttp,
  FichierMalveillant
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { AntivirusClient } from '../../../src/infrastructure/clients/antivirus-client'
import { expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

describe('AntivirusClient', () => {
  let antivirusClient: AntivirusClient
  const configService = testConfig()
  const apiUrl = configService.get('jecliqueoupas').url
  const fichier = unFichier()

  beforeEach(async () => {
    const httpService = new HttpService()
    antivirusClient = new AntivirusClient(httpService, configService)
  })

  describe('declencherAnalyseAsynchrone', () => {
    it('renvoie l’id de l’analyse déclenchée', async () => {
      // Given
      // const hexToString = (hex: string): string => {
      //   let str = ''
      //   for (let i = 0; i < hex.length; i += 2)
      //     str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
      //   return str
      // }

      nock(apiUrl)
        .post(
          '/submit'
          // TODO tester fichier + cert + hostname/ip ?
          // body =>
          //   hexToString(body).includes(
          //     `Content-Disposition: form-data; name="file"; filename="${fichier.nom}"`
          //   ),
          // {
          //   reqheaders: {
          //     Accept: 'application/json, text/plain, */*',
          //     'Content-Type':
          //       'multipart/form-data; boundary=axios-1.6.7-boundary-2iVclxJlB--EmOBSC4y9dov5F',
          //     'X-Auth-token': 'token-jecliqueoupas',
          //     'User-Agent': 'axios/1.6.7',
          //     'Content-Length': '223',
          //     'Accept-Encoding': 'gzip, compress, deflate, br'
          //   }
          // }
        )
        .reply(200, { uuid: 'uuid-analyse', status: true })

      // When
      const result = await antivirusClient.declencherAnalyseAsynchrone(fichier)

      // Then
      expect(result).to.deep.equal(success('uuid-analyse'))
    })

    it("renvoie une failure quand l'api est en erreur", async () => {
      // Given
      nock(apiUrl)
        .post('/submit')
        .reply(400, { status: false, error: 'message d’erreur' })

      // When
      const result = await antivirusClient.declencherAnalyseAsynchrone(fichier)

      // Then
      expect(result).to.deep.equal(
        failure(
          new ErreurHttp("L'analyse du fichier par l'antivirus a échoué", 400)
        )
      )
    })
  })

  describe('recupererResultatAnalyse', () => {
    it('signale une analyse positive', async () => {
      // Given
      nock(apiUrl)
        .get('/results/id-analyse')
        .reply(200, { is_malware: false, done: true })

      // When
      const result = await antivirusClient.recupererResultatAnalyse(
        'id-analyse'
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('signale une analyse en cours', async () => {
      // Given
      nock(apiUrl)
        .get('/results/id-analyse')
        .reply(200, { is_malware: false, done: false })

      // When
      const result = await antivirusClient.recupererResultatAnalyse(
        'id-analyse'
      )

      // Then
      expect(result).to.deep.equal(failure(new AnalyseAntivirusPasTerminee()))
    })

    it('signale un fichier malveillant', async () => {
      // Given
      nock(apiUrl)
        .get('/results/id-analyse')
        .reply(200, { is_malware: true, done: true })

      // When
      const result = await antivirusClient.recupererResultatAnalyse(
        'id-analyse'
      )

      // Then
      expect(result).to.deep.equal(failure(new FichierMalveillant()))
    })

    it("renvoie une failure quand l'api est en erreur", async () => {
      // Given
      nock(apiUrl)
        .get('/results/id-analyse')
        .reply(400, { status: false, error: 'message d’erreur' })

      // When
      const result = await antivirusClient.recupererResultatAnalyse(
        'id-analyse'
      )

      // Then
      expect(result).to.deep.equal(
        failure(
          new ErreurHttp(
            'La récupération de l’analyse du fichier a échoué',
            400
          )
        )
      )
    })
  })
})
