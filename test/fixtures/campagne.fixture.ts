import { Campagne } from '../../src/domain/campagne'
import { uneDate, uneDatetime } from './date.fixture'
import { CampagneQueryModel } from '../../src/application/queries/query-models/campagne.query-model'
import { questionsInMemory } from '../../src/application/queries/query-getters/get-campagne.query.getter.db'
import { ReponseCampagneDto } from '../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { AsSql } from '../../src/infrastructure/sequelize/types'

export const uneCampagne = (args: Partial<Campagne> = {}): Campagne => {
  const defaults: Campagne = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    nom: 'Premiere campagne',
    dateDebut: uneDatetime(),
    dateFin: uneDatetime().plus({ week: 2 })
  }

  return { ...defaults, ...args }
}

export const uneCampagneQueryModel = (
  campagne = uneCampagne()
): CampagneQueryModel => ({
  id: campagne.id,
  dateDebut: campagne.dateDebut.toString(),
  dateFin: campagne.dateFin.toString(),
  description: "Votre expérience sur l'application",
  titre: 'Donnez nous votre avis',
  questions: questionsInMemory()
})

export const uneEvaluationIncomplete = (
  campagne = uneCampagne()
): Campagne.Evaluation => ({
  jeune: {
    id: 'idJeune',
    dateCreation: uneDatetime(),
    structure: 'MILO'
  },
  date: uneDatetime(),
  idCampagne: campagne.id,
  reponses: [
    {
      pourquoi: 'parce que',
      idReponse: 3,
      idQuestion: 1
    }
  ]
})

export const uneEvaluationComplete = (
  campagne = uneCampagne()
): Campagne.Evaluation => ({
  jeune: {
    id: 'idJeune',
    dateCreation: uneDatetime(),
    structure: 'MILO'
  },
  date: uneDatetime(),
  idCampagne: campagne.id,
  reponses: [
    {
      idQuestion: 1,
      idReponse: 4
    },
    {
      idQuestion: 2,
      idReponse: 3,
      pourquoi: 'Voila pourquoi'
    },
    {
      idQuestion: 3,
      idReponse: 1,
      pourquoi: 'Parce que'
    },
    {
      idQuestion: 4,
      idReponse: 7,
      pourquoi: 'Imhotep'
    },
    {
      idQuestion: 5,
      idReponse: 1,
      pourquoi: 'Imhotep'
    }
  ]
})

export const uneEvaluationIncompleteDTO = (
  idJeune: string,
  idCampagne: string
): Omit<AsSql<ReponseCampagneDto>, 'id'> => {
  return {
    idJeune,
    idCampagne,
    structureJeune: 'MILO',
    dateReponse: uneDate(),
    dateCreationJeune: uneDate(),
    reponse1: 'reponse1',
    pourquoi1: null,
    reponse2: 'reponse2',
    pourquoi2: null,
    reponse3: 'reponse3',
    pourquoi3: null,
    reponse4: 'reponse4',
    pourquoi4: null,
    reponse5: 'reponse5',
    pourquoi5: null
  }
}
