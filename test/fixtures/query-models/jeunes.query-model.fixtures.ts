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
