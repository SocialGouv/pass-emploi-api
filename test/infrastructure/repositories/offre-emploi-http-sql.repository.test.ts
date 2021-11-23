import { OffreEmploiListItem } from '../../../src/domain/offres-emploi'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect, stubClass } from '../../utils'

describe('OffresEmploiHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository

  beforeEach(async () => {
    const poleEmploiClient = stubClass(PoleEmploiClient)
    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
      poleEmploiClient
    )
  })

  describe('.saveAsFavori', () => {
    describe("quand le favori n'existe pas", () => {
      it('sauvegarde un favori', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'ABCDE',
            idConseiller: 'ZIDANE'
          })
        )
        const offreEmploi: OffreEmploiListItem = {
          id: '123DXPM',
          titre: 'Technicien / Technicienne en froid et climatisation',
          typeContrat: 'MIS',
          nomEntreprise: 'RH TT INTERIM',
          duree: 'Temps plein',
          localisation: {
            nom: '77 - LOGNES',
            codePostal: '77185',
            commune: '77258'
          },
          alternance: false
        }

        // When
        await offresEmploiHttpSqlRepository.saveAsFavori('ABCDE', offreEmploi)

        // Then
        const offresEmplois = await FavoriOffreEmploiSqlModel.findAll()
        expect(offresEmplois.length).to.equal(1)
        expect(offresEmplois[0].idOffre).to.equal('123DXPM')
        expect(offresEmplois[0].idJeune).to.equal('ABCDE')
        expect(offresEmplois[0].titre).to.equal(
          'Technicien / Technicienne en froid et climatisation'
        )
        expect(offresEmplois[0].typeContrat).to.equal('MIS')
        expect(offresEmplois[0].nomEntreprise).to.equal('RH TT INTERIM')
        expect(offresEmplois[0].duree).to.equal('Temps plein')
        expect(offresEmplois[0].nomLocalisation).to.equal('77 - LOGNES')
        expect(offresEmplois[0].codePostalLocalisation).to.equal('77185')
        expect(offresEmplois[0].communeLocalisation).to.equal('77258')
        expect(offresEmplois[0].isAlternance).to.equal(false)
      })
    })
  })
})
