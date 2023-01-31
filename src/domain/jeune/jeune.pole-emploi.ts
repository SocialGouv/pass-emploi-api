export interface JeunePoleEmploi {
  id: string
  idAuthentification: string
  pushNotificationToken: string
}

export namespace JeunePoleEmploi {
  export interface Repository {
    findAll(offset: number, limit: number): Promise<JeunePoleEmploi[]>
  }
}
