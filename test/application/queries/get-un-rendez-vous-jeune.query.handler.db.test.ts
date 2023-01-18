import {
  GetUnRendezVousJeuneQuery,
  GetUnRendezVousJeuneQueryHandler
} from '../../../src/application/queries/rendez-vous/get-un-rendez-vous-jeune.query.handler.db'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { failure, isSuccess } from '../../../src/building-blocks/types/result'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { unEtablissementDto } from '../../fixtures/sql-models/etablissement.sq-model'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousJeuneDetailQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetUnRendezVousJeuneQueryHandler', () => {
  let getUnRendezVousJeuneQueryHandler: GetUnRendezVousJeuneQueryHandler
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  const maintenant = uneDatetime()
  const utilisateurJeune = unUtilisateurJeune()

  beforeEach(async () => {
    await getDatabase().cleanPG()
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    getUnRendezVousJeuneQueryHandler = new GetUnRendezVousJeuneQueryHandler(
      rendezVousAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise le jeune sur le rendez vous', () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'idJeune' })

      // When
      getUnRendezVousJeuneQueryHandler.authorize(
        {
          idJeune: 'idJeune',
          idRendezVous: 'idRendezVous'
        },
        utilisateur
      )

      // Then
      expect(rendezVousAuthorizer.authorize).to.have.been.calledWithExactly(
        'idRendezVous',
        utilisateur
      )
    })
    it("rejette si le jeune demandé n'est pas l'utilisateur", async () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'idJeune' })

      // When
      const result = await getUnRendezVousJeuneQueryHandler.authorize(
        {
          idJeune: 'idAutreJeune',
          idRendezVous: 'idRendezVous'
        },
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
  describe('handle', async () => {
    const idAnimationCollective = '413664c0-92b5-44d4-a4b6-c1c78f4a9a14'
    const idRendezVous = 'cbc5f0b4-ce56-4ced-a461-791478ad75a5'
    const idJeune = 'un-id-jeune'

    const etablissementDto = unEtablissementDto({
      id: 'une-agence'
    })
    const conseillerDto = unConseillerDto({
      idAgence: etablissementDto.id
    })
    const jeuneDto = unJeuneDto({
      id: idJeune,
      idConseiller: conseillerDto.id
    })
    const animationCollective = unRendezVousDto({
      id: idAnimationCollective,
      date: maintenant.plus({ day: 1 }).toJSDate(),
      type: CodeTypeRendezVous.ATELIER,
      idAgence: etablissementDto.id
    })

    const rendezVous = unRendezVousDto({
      id: idRendezVous,
      date: maintenant.plus({ day: 2 }).toJSDate(),
      type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
    })

    beforeEach(async () => {
      await AgenceSqlModel.create(etablissementDto)
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(jeuneDto)
      await RendezVousSqlModel.bulkCreate([rendezVous, animationCollective])
      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        {
          idJeune: idJeune,
          idRendezVous: rendezVous.id
        }
      ])
    })

    describe("quand le jeune est dans l'événement", () => {
      it("renvoie l'événement avec l'inscription", async () => {
        // Given
        const query: GetUnRendezVousJeuneQuery = {
          idRendezVous: idRendezVous,
          idJeune
        }

        // When
        const result = await getUnRendezVousJeuneQueryHandler.handle(
          query,
          utilisateurJeune
        )

        // Then
        const expected: RendezVousJeuneDetailQueryModel = {
          id: rendezVous.id,
          title: rendezVous.titre,
          modality: rendezVous.modalite!,
          date: rendezVous.date,
          duration: rendezVous.duree,
          type: {
            code: rendezVous.type,
            label: 'Entretien individuel conseiller'
          },
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
        expect(isSuccess(result) && result.data).to.deep.equal(expected)
      })
    })
    describe("quand le jeune n'est pas dans l'événement", () => {
      it("renvoie l'événement avec l'inscription à faux", async () => {
        // Given
        const query: GetUnRendezVousJeuneQuery = {
          idRendezVous: idAnimationCollective,
          idJeune
        }

        // When
        const result = await getUnRendezVousJeuneQueryHandler.handle(
          query,
          utilisateurJeune
        )

        // Then
        const expected: RendezVousJeuneDetailQueryModel = {
          id: animationCollective.id,
          title: animationCollective.titre,
          modality: animationCollective.modalite!,
          date: animationCollective.date,
          duration: animationCollective.duree,
          type: { code: animationCollective.type, label: 'Atelier' },
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
        expect(isSuccess(result) && result.data).to.deep.equal(expected)
      })
    })
  })
})
