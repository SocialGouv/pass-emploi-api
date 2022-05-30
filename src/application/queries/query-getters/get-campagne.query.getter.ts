import { Query } from '../../../building-blocks/types/query'
import {
  CampagneQueryModel,
  QuestionCampagneQueryModel
} from '../query-models/campagne.query-model'
import { CampagneSqlModel } from '../../../infrastructure/sequelize/models/campagne.sql-model'
import { DateService } from '../../../utils/date-service'
import { Op } from 'sequelize'
import { ReponseCampagneSqlModel } from '../../../infrastructure/sequelize/models/reponse-campagne.sql-model'
import { Injectable } from '@nestjs/common'

export interface GetCampagneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetCampagneQueryModel {
  constructor(private dateService: DateService) {}

  async handle(
    query: GetCampagneQuery
  ): Promise<CampagneQueryModel | undefined> {
    const now = this.dateService.nowJs()
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

    const aReponduAToutesLesQuestions =
      campagneEnCours?.reponses[0]?.reponse1 &&
      campagneEnCours?.reponses[0]?.reponse2

    if (campagneEnCours && !aReponduAToutesLesQuestions) {
      return {
        id: campagneEnCours.id,
        dateDebut: campagneEnCours.dateDebut.toISOString(),
        dateFin: campagneEnCours.dateFin.toISOString(),
        description: "Votre expérience sur l'application",
        titre:
          "Aidez-nous à améliorer l'application en répondant à 2 questions",
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
      '*Est-ce que l’application du CEJ vous aide à avoir un bon accompagnement avec votre conseiller ?',
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
      "*À votre avis, est-ce que l'application vous aide à avancer dans votre projet professionnel ?",
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
  }
]
