import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { DossierMiloDto } from '../../../src/infrastructure/repositories/dto/milo.dto'
import { MiloHttpRepository } from '../../../src/infrastructure/repositories/milo-http.repository'
import { testConfig } from '../../utils/module-for-testing'

describe('MiloHttpRepository', () => {
  let miloHttpRepository: MiloHttpRepository
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()

    miloHttpRepository = new MiloHttpRepository(httpService, configService)
  })
  describe('getDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        nock('https://milo.com')
          .get('/dossiers/1')
          .reply(200, JSON.stringify(dossierDto()))
          .isDone()

        // When
        const dossier = await miloHttpRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal({
          email: 'pass.emploi.contact@gmail.com',
          id: '1',
          nom: 'PEREZ',
          prenom: 'Olivier',
          dateDeNaissance: '1997-05-08'
        })
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie undefined', async () => {
        // Given
        nock('https://milo.com').get('/dossiers/1').reply(404).isDone()

        // When
        const dossier = await miloHttpRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal(undefined)
      })
    })
  })
})

const dossierDto = (): DossierMiloDto => ({
  idDossier: 6282,
  idJeune: '1306654400021970358',
  numeroDE: '4053956Z',
  adresse: {
    numero: '',
    libelleVoie: 'le village',
    complement: 'ancienne ecole',
    codePostal: '65410',
    commune: 'Beyrède-Jumet-Camous'
  },
  nomNaissance: 'PEREZ',
  nomUsage: 'PEREZ',
  prenom: 'Olivier',
  dateNaissance: '1997-05-08',
  mail: 'pass.emploi.contact@gmail.com',
  structureRattachement: {
    nomUsuel: 'Antenne de Tarbes',
    nomOfficiel: '65-ML TARBES',
    codeStructure: '65440S00'
  },
  accompagnementCEJ: {
    accompagnementCEJ: false,
    dateDebut: null,
    dateFinPrevue: null,
    dateFinReelle: null,
    premierAccompagnement: null
  },
  situations: [
    {
      etat: 'EN_COURS',
      dateFin: null,
      categorieSituation: "Demandeur d'emploi",
      codeRomeMetierPrepare: null,
      codeRomePremierMetier: 'F1501',
      codeRomeMetierExerce: null
    }
  ]
})
