export interface RendezVousQueryModel {
  id: string
  title: string
  comment?: string
  date: Date
  duration: number
  modality: string
}

export interface RendezVousConseillerQueryModel {
  futurs: RendezVousQueryModel[]
  passes: RendezVousQueryModel[]
}
