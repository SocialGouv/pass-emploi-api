import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { GetAnimationsCollectivesJeuneQueryHandler } from '../../../src/application/queries/get-animations-collectives-jeune.query.handler.db'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { isSuccess } from '../../../src/building-blocks/types/result'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { unEtablissementDto } from '../../fixtures/sql-models/etablissement.sq-model'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { RendezVousJeuneDetailQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetAnimationsCollectivesJeuneQueryHandler', () => {
  const utilisateurJeune = unUtilisateurJeune()

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  let getAnimationsCollectivesJeuneQueryHandler: GetAnimationsCollectivesJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  const maintenant = uneDatetime()

  beforeEach(() => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getAnimationsCollectivesJeuneQueryHandler =
      new GetAnimationsCollectivesJeuneQueryHandler(jeuneAuthorizer)
  })
  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const query = {
        idJeune: 'un-id-jeune',
        maintenant
      }
      const utilisateur = unUtilisateurJeune({ id: query.idJeune })

      // When
      await getAnimationsCollectivesJeuneQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur
      )
    })
  })
  describe('handle', () => {
    describe('quand le jeune est lié à une agence', () => {
      const etablissementDuConseillerDto = unEtablissementDto({
        id: 'agence-du-conseiller'
      })
      const unAutreEtablissementDto = unEtablissementDto({
        id: 'une-autre-agence'
      })
      const idConseiller = 'id-conseiller'
      const idJeune = 'un-id-jeune'

      const conseillerDto = unConseillerDto({
        id: idConseiller,
        idAgence: etablissementDuConseillerDto.id
      })

      const acAgenceConseillerDto = unRendezVousDto({
        date: maintenant.plus({ day: 1 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        idAgence: etablissementDuConseillerDto.id
      })

      const acAutreAgenceDto = unRendezVousDto({
        date: maintenant.plus({ day: 2 }).toJSDate(),
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        idAgence: unAutreEtablissementDto.id
      })

      beforeEach(async () => {
        // Given
        await AgenceSqlModel.bulkCreate([
          etablissementDuConseillerDto,
          unAutreEtablissementDto
        ])

        await ConseillerSqlModel.creer(conseillerDto)

        const jeuneDto = unJeuneDto({
          id: idJeune,
          idConseiller: conseillerDto.id
        })
        await JeuneSqlModel.creer(jeuneDto)

        await RendezVousSqlModel.bulkCreate([
          acAgenceConseillerDto,
          acAutreAgenceDto
        ])
      })
      describe('quand le jeune est inscrit', () => {
        it('retourne les ACs de l‘agence du conseiller du jeune avec estInscrit a true', async () => {
          // Given
          await RendezVousJeuneAssociationSqlModel.bulkCreate([
            {
              idJeune: idJeune,
              idRendezVous: acAgenceConseillerDto.id
            }
          ])

          const query = {
            idJeune,
            maintenant
          }

          // When
          const result = await getAnimationsCollectivesJeuneQueryHandler.handle(
            query,
            utilisateurJeune
          )

          // Then
          const expectedAnimationCollective: RendezVousJeuneDetailQueryModel = {
            id: acAgenceConseillerDto.id,
            title: acAgenceConseillerDto.titre,
            modality: acAgenceConseillerDto.modalite!,
            date: acAgenceConseillerDto.date,
            duration: acAgenceConseillerDto.duree,
            type: { code: acAgenceConseillerDto.type, label: 'Atelier' },
            isLocaleDate: false,
            estInscrit: true,
            organisme: undefined,
            precision: undefined,
            presenceConseiller: true,
            invitation: false,
            createur: {
              id: '1',
              nom: 'Tavernier',
              prenom: 'Nils'
            },
            comment: 'commentaire',
            adresse: undefined,
            source: RendezVous.Source.PASS_EMPLOI
          }
          expect(isSuccess(result) && result.data).to.deep.equal([
            expectedAnimationCollective
          ])
        })
      })
      describe("quand le jeune n'est pas inscrit", () => {
        it('retourne les ACs de l‘agence du conseiller du jeune avec estInscrit a false', async () => {
          // Given
          const query = {
            idJeune,
            maintenant
          }

          // When
          const result = await getAnimationsCollectivesJeuneQueryHandler.handle(
            query,
            utilisateurJeune
          )

          // Then
          const expectedAnimationCollective: RendezVousJeuneDetailQueryModel = {
            id: acAgenceConseillerDto.id,
            title: acAgenceConseillerDto.titre,
            modality: acAgenceConseillerDto.modalite!,
            date: acAgenceConseillerDto.date,
            duration: acAgenceConseillerDto.duree,
            type: { code: acAgenceConseillerDto.type, label: 'Atelier' },
            isLocaleDate: false,
            estInscrit: false,
            organisme: undefined,
            precision: undefined,
            presenceConseiller: true,
            invitation: false,
            createur: {
              id: '1',
              nom: 'Tavernier',
              prenom: 'Nils'
            },
            comment: 'commentaire',
            adresse: undefined,
            source: RendezVous.Source.PASS_EMPLOI
          }
          expect(isSuccess(result) && result.data).to.deep.equal([
            expectedAnimationCollective
          ])
        })
      })
    })

    describe("quand le jeune n'est pas lié à une agence", () => {
      it('retourne un tableau vide', async () => {
        // Given
        const etablissementDto = unEtablissementDto({
          id: 'une-agence'
        })
        await AgenceSqlModel.create(etablissementDto)

        const conseillerDto = unConseillerDto({
          idAgence: undefined
        })
        await ConseillerSqlModel.creer(conseillerDto)

        const idJeune = 'un-id-jeune'
        const jeuneDto = unJeuneDto({
          id: idJeune,
          idConseiller: conseillerDto.id
        })
        await JeuneSqlModel.creer(jeuneDto)

        const animationCollective = unRendezVousDto({
          date: maintenant.plus({ day: 1 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: etablissementDto.id
        })
        const autreAnimationCollective = unRendezVousDto({
          date: maintenant.plus({ day: 2 }).toJSDate(),
          type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
          idAgence: etablissementDto.id
        })
        await RendezVousSqlModel.bulkCreate([
          animationCollective,
          autreAnimationCollective
        ])

        const query = {
          idJeune,
          maintenant
        }

        // When
        const result = await getAnimationsCollectivesJeuneQueryHandler.handle(
          query,
          utilisateurJeune
        )

        // Then
        expect(isSuccess(result) && result.data).to.deep.equal([])
      })
    })
  })
})
