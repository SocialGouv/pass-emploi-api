export const ConseillerMiloRepositoryToken = 'ConseillerMilo.Repository'

export interface ConseillerMilo {
  idStructure: string
}

export namespace ConseillerMilo {
  export interface Repository {
    get(idConseiller: string): Promise<ConseillerMilo | undefined>
  }
}
