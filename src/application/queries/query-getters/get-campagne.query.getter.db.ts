import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { CampagneSqlModel } from '../../../infrastructure/sequelize/models/campagne.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ReponseCampagneSqlModel } from '../../../infrastructure/sequelize/models/reponse-campagne.sql-model'
import { DateService } from '../../../utils/date-service'
import {
  CampagneQueryModel,
  QuestionCampagneQueryModel
} from '../query-models/campagne.query-model'

export interface GetCampagneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetCampagneQueryGetter {
  constructor(private dateService: DateService) {}

  async handle(
    query: GetCampagneQuery
  ): Promise<CampagneQueryModel | undefined> {
    const now = this.dateService.nowJs()
    const ilYaDeuxMois = this.dateService.now().minus({ months: 2 })
    const jeuneSql = await JeuneSqlModel.findByPk(query.idJeune)
    const leJeuneEstActifDepuisDeuxMois =
      jeuneSql &&
      jeuneSql.datePremiereConnexion &&
      DateService.isGreater(
        ilYaDeuxMois,
        DateTime.fromJSDate(jeuneSql.datePremiereConnexion)
      )
    if (!leJeuneEstActifDepuisDeuxMois) {
      return undefined
    }
    const campagneEnCours = await CampagneSqlModel.findOne({
      where: {
        [Op.and]: {
          dateDebut: {
            [Op.lte]: now
          },
          dateFin: {
            [Op.gte]: now
          }
        }
      },
      include: {
        model: ReponseCampagneSqlModel,
        required: false,
        where: {
          idJeune: query.idJeune
        }
      }
    })

    const reponses = campagneEnCours?.reponses[0]
    const aReponduAToutesLesQuestions =
      reponses?.reponse1 &&
      reponses?.reponse2 &&
      reponses?.reponse3 &&
      reponses?.reponse4 &&
      reponses?.reponse5

    if (campagneEnCours && !aReponduAToutesLesQuestions) {
      return {
        id: campagneEnCours.id,
        dateDebut: DateService.fromJSDateToISOString(campagneEnCours.dateDebut),
        dateFin: DateService.fromJSDateToISOString(campagneEnCours.dateFin),
        titre: 'Votre avis nous intéresse !',
        description: `Aidez-nous à améliorer l’application`,
        questions: questionsInMemory()
      }
    }

    return undefined
  }
}

export const questionsInMemory = (): QuestionCampagneQueryModel[] => [
  {
    id: 1,
    libelle:
      '*Est-ce que l’application vous aide à vous sentir mieux accompagné par votre conseiller ?',
    pourquoi: true,
    options: [
      {
        id: 1,
        libelle: 'Non, pas du tout'
      },
      {
        id: 2,
        libelle: 'Plutôt non'
      },
      {
        id: 3,
        libelle: 'Plutôt oui'
      },
      {
        id: 4,
        libelle: 'Oui, tout à fait'
      }
    ]
  },
  {
    id: 2,
    libelle:
      "*À votre avis, est-ce que l'application vous aide à avancer dans la réalisation de votre projet professionnel ?",
    pourquoi: true,
    options: [
      {
        id: 1,
        libelle: 'Non, pas du tout'
      },
      {
        id: 2,
        libelle: 'Plutôt non'
      },
      {
        id: 3,
        libelle: 'Plutôt oui'
      },
      {
        id: 4,
        libelle: 'Oui, tout à fait'
      }
    ]
  },
  {
    id: 3,
    libelle:
      '*À votre avis, l’application vous permet-elle de devenir plus autonome dans la construction de votre projet ?',
    pourquoi: true,
    options: [
      {
        id: 1,
        libelle: 'Non, pas du tout'
      },
      {
        id: 2,
        libelle: 'Plutôt non'
      },
      {
        id: 3,
        libelle: 'Plutôt oui'
      },
      {
        id: 4,
        libelle: 'Oui, tout à fait'
      }
    ]
  },
  {
    id: 5,
    libelle:
      "*Lorsque vous naviguez sur l'application, vous trouvez ce que vous êtes venu chercher ?",
    pourquoi: true,
    options: [
      {
        id: 1,
        libelle: 'Très difficilement'
      },
      {
        id: 2,
        libelle: 'Assez difficilement'
      },
      {
        id: 3,
        libelle: 'Neutre'
      },
      {
        id: 4,
        libelle: 'Plutôt facilement'
      },
      {
        id: 5,
        libelle: 'Très facilement'
      }
    ]
  },
  {
    id: 4,
    libelle: '*Recommanderiez-vous l’application ?',
    pourquoi: true,
    libellePourquoi:
      'Que pouvons-nous améliorer pour vous satisfaire davantage ?',
    options: [
      {
        id: 10,
        libelle: '10 (très fortement)'
      },
      {
        id: 9,
        libelle: '9'
      },
      {
        id: 8,
        libelle: '8'
      },
      {
        id: 7,
        libelle: '7'
      },
      {
        id: 6,
        libelle: '6'
      },
      {
        id: 5,
        libelle: '5 (neutre)'
      },
      {
        id: 4,
        libelle: '4'
      },
      {
        id: 3,
        libelle: '3'
      },
      {
        id: 2,
        libelle: '2'
      },
      {
        id: 1,
        libelle: '1'
      },
      {
        id: 0,
        libelle: '0 (pas du tout)'
      }
    ]
  }
]
