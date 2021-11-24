import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { ResumeActionsDuJeuneQueryModel } from '../../../src/domain/jeune'

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
      creationDate: '2021-11-11T08:03:30.000Z'
    }
  ]

  return defaults
}
