import { DateTime } from 'luxon'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Demarche } from 'src/domain/demarche'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DemarcheHttpRepository } from 'src/infrastructure/repositories/demarche-http.repository'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { uneDemarcheDto } from 'test/fixtures/demarches-dto.fixtures'
import { DateService } from '../../../src/utils/date-service'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('DemarcheHttpRepository', () => {
  DatabaseForTesting.prepare()
  let demarcheHttpRepository: DemarcheHttpRepository
  let keycloakClient: StubbedClass<KeycloakClient>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.001Z').toUTC()

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    dateService.nowJs.returns(maintenant.toJSDate())
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves('token')
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)

    demarcheHttpRepository = new DemarcheHttpRepository(
      keycloakClient,
      poleEmploiPartenaireClient,
      dateService
    )
  })

  describe('update', () => {
    describe('quand tout va bien', () => {
      it('met à jour le statut et renvoie la demarche', async () => {
        // Given
        const demarche: Demarche.Modifiee = {
          id: 'test',
          statut: Demarche.Statut.A_FAIRE,
          dateModification: uneDatetime,
          dateDebut: uneDatetime,
          dateFin: uneDatetime
        }

        poleEmploiPartenaireClient.updateDemarche
          .withArgs(demarche, 'token')
          .resolves(success(uneDemarcheDto()))

        // When
        const result = await demarcheHttpRepository.update(demarche, 'token')

        // Then
        expect(result).to.deep.equal({
          _isSuccess: true,
          data: {
            attributs: [],
            codeDemarche: 'eyJxdW9pIjoiIiwicG91cnF1b2kiOiIifQ==',
            contenu: undefined,
            creeeParConseiller: false,
            dateCreation: undefined,
            dateFin: undefined,
            dateDebut: undefined,
            dateModification: undefined,
            dateAnnulation: undefined,
            id: 'id-demarche',
            label: '',
            modifieParConseiller: false,
            sousTitre: undefined,
            statut: Demarche.Statut.EN_COURS,
            statutsPossibles: [],
            titre: ''
          }
        })
      })
    })
    describe('quand une erreur se produit', () => {
      it('renvoie une failure', async () => {
        // Given
        const demarche: Demarche.Modifiee = {
          id: 'test',
          statut: Demarche.Statut.A_FAIRE,
          dateModification: uneDatetime,
          dateDebut: uneDatetime,
          dateFin: uneDatetime
        }

        poleEmploiPartenaireClient.updateDemarche
          .withArgs(demarche, 'token')
          .resolves(failure(new ErreurHttp('test', 404)))

        // When
        const result = await demarcheHttpRepository.update(demarche, 'token')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })

  describe('save', () => {
    describe('quand tout va bien', () => {
      it('sauvegarde et renvoie la demarche', async () => {
        // Given
        const demarche: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDatetime,
          dateDebut: uneDatetime,
          dateFin: uneDatetime,
          pourquoi: 'string',
          quoi: 'string'
        }

        poleEmploiPartenaireClient.createDemarche
          .withArgs(demarche, 'token')
          .resolves(success(uneDemarcheDto()))

        // When
        const result = await demarcheHttpRepository.save(demarche, 'token')

        // Then
        expect(result).to.deep.equal({
          _isSuccess: true,
          data: {
            attributs: [],
            codeDemarche: 'eyJxdW9pIjoiIiwicG91cnF1b2kiOiIifQ==',
            contenu: undefined,
            creeeParConseiller: false,
            dateCreation: undefined,
            dateFin: undefined,
            dateDebut: undefined,
            dateModification: undefined,
            dateAnnulation: undefined,
            id: 'id-demarche',
            label: '',
            modifieParConseiller: false,
            sousTitre: undefined,
            statut: Demarche.Statut.EN_COURS,
            statutsPossibles: [],
            titre: ''
          }
        })
      })
    })
    describe('quand une erreur se produit', () => {
      it('renvoie une failure', async () => {
        // Given
        const demarche: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDatetime,
          dateDebut: uneDatetime,
          dateFin: uneDatetime,
          pourquoi: 'string',
          quoi: 'string'
        }

        poleEmploiPartenaireClient.createDemarche
          .withArgs(demarche, 'token')
          .resolves(failure(new ErreurHttp('test', 404)))

        // When
        const result = await demarcheHttpRepository.save(demarche, 'token')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })
})
