export class NotFound extends Error {
  constructor(id: string, type: string) {
    super(`La ressource ${type} d'id ${id} n'existe pas`)
  }
}
