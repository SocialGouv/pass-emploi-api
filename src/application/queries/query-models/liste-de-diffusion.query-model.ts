export class ListeDeDiffusionQueryModel {
  id: string
  titre: string
  dateDeCreation: Date
  beneficiaires: Array<{
    id: string
    nom: string
    prenom: string
    estDansLePortefeuille?: boolean
  }>
}
