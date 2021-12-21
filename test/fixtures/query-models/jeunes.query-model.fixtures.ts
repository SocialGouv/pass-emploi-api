import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-models'

export function unResumeActionDUnJeune(
  args: Partial<ResumeActionsDuJeuneQueryModel> = {}
): ResumeActionsDuJeuneQueryModel {
  const defaults: ResumeActionsDuJeuneQueryModel = {
    jeuneId: 'ABCDE',
    jeuneFirstName: 'John',
    jeuneLastName: 'Doe',
    todoActionsCount: 2,
    doneActionsCount: 0,
    inProgressActionsCount: 0
  }

  return { ...defaults, ...args }
}

export function listeDetailJeuneQueryModel(): DetailJeuneQueryModel[] {
  const defaults: DetailJeuneQueryModel[] = [
    {
      id: 'ABCDE',
      firstName: 'John',
      lastName: 'Doe',
      creationDate: '2021-11-11T08:03:30.000Z',
      isActivated: true
    }
  ]

  return defaults
}
