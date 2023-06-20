import { Suggestion } from './suggestion'

export interface Diagoriente {
  tag: Tag
  id: string
  favorited: boolean
}

interface Tag {
  code: string
  id: string
  title: string
}

export interface DiagorienteLocation {
  libelle: string
  type: Suggestion.TypeLocalisation
  code: string
  latitude?: number
  longitude?: number
}
