export interface DossierMiloDto {
  idDossier: number
  idJeune: string
  numeroDE: string
  adresse?: {
    numero: string
    libelleVoie: string
    complement: string
    codePostal: string
    commune: string
  }
  nomNaissance: string
  nomUsage: string
  prenom: string
  dateNaissance: string
  mail: string | null
  structureRattachement: {
    nomUsuel: string
    nomOfficiel: string
    codeStructure: string
  }
  accompagnementCEJ: {
    accompagnementCEJ: boolean
    dateDebut: string | null
    dateFinPrevue: string | null
    dateFinReelle: string | null
    premierAccompagnement: string | null
  }
  situations: [
    {
      etat: string
      dateFin: string | null
      categorieSituation: string
      codeRomeMetierPrepare: string | null
      codeRomePremierMetier: string
      codeRomeMetierExerce: string | null
    }
  ]
}
