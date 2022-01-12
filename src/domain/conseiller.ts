import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  email?: string
}

export const ConseillersRepositoryToken = 'Conseiller.Repository'

export namespace Conseiller {
  export interface Repository {
    get(id: string): Promise<Conseiller | undefined>
    getAllIds(): Promise<string[]>
    getQueryModelById(
      id: string
    ): Promise<DetailConseillerQueryModel | undefined>
    envoyerUnRappelParMail(
      idConseiller: string,
      nombreDeConversationNonLues: number
    ): Promise<void>
  }
}
