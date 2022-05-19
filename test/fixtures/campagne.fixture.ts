import { Campagne } from '../../src/domain/campagne'
import { uneDatetime } from './date.fixture'
import { CampagneQueryModel } from '../../src/application/queries/query-models/campagne.query-model'
import { questionsInMemory } from '../../src/application/queries/query-getters/get-campagne.query.getter'

export const uneCampagne = (args: Partial<Campagne> = {}): Campagne => {
  const defaults: Campagne = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    nom: 'Premiere campagne',
    dateDebut: uneDatetime,
    dateFin: uneDatetime.plus({ week: 2 })
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
    dateCreation: uneDatetime,
    structure: 'MILO'
  },
  date: uneDatetime,
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
    dateCreation: uneDatetime,
    structure: 'MILO'
  },
  date: uneDatetime,
  idCampagne: campagne.id,
  reponses: [
    {
      idReponse: 4,
      idQuestion: 1
    },
    {
      idReponse: 3,
      idQuestion: 2,
      pourquoi: 'Voila pourquoi'
    }
  ]
})
