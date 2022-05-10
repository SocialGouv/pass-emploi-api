import {
  CategorieSituationMilo,
  EtatSituationMilo,
  Milo
} from 'src/domain/milo'
import { expect } from '../utils'

describe('Milo', () => {
  const situationsPrevuEmploi = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.EMPLOI
  }
  const situationsPrevuAlternance = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.CONTRAT_EN_ALTERNANCE
  }
  const situationsPrevuFormation = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.FORMATION
  }
  const situationsPrevuImmersion = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.IMMERSION_EN_ENTREPRISE
  }
  const situationsPrevuPmsmp = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.PMSMP
  }
  const situationsPrevuVolontariat = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
  }
  const situationsPrevuScolarite = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.SCOLARITE
  }
  const situationsPrevuDemandeur = {
    etat: EtatSituationMilo.PREVU,
    categorie: CategorieSituationMilo.DEMANDEUR_D_EMPLOI
  }
  const situationsEnCoursEmploi = {
    etat: EtatSituationMilo.EN_COURS,
    categorie: CategorieSituationMilo.EMPLOI
  }
  const situationsEnCoursScolarite = {
    etat: EtatSituationMilo.EN_COURS,
    categorie: CategorieSituationMilo.SCOLARITE
  }
  const situationsEnCoursDemandeur = {
    etat: EtatSituationMilo.EN_COURS,
    categorie: CategorieSituationMilo.DEMANDEUR_D_EMPLOI
  }
  const situationsTermineeEmploi = {
    etat: EtatSituationMilo.TERMINE,
    categorie: CategorieSituationMilo.EMPLOI
  }

  // Given
  const situations = [
    situationsPrevuScolarite,
    situationsPrevuEmploi,
    situationsTermineeEmploi,
    situationsPrevuPmsmp,
    situationsPrevuFormation,
    situationsPrevuDemandeur,
    situationsEnCoursEmploi,
    situationsPrevuAlternance,
    situationsPrevuImmersion,
    situationsPrevuVolontariat,
    situationsEnCoursDemandeur,
    situationsEnCoursScolarite
  ]

  // When
  const situationsTriees = Milo.trierSituations(situations)

  describe('trierSituations', () => {
    it('trie les situations par etat et categorie', async () => {
      // Then
      expect(situationsTriees).to.deep.equal([
        situationsEnCoursEmploi,
        situationsEnCoursScolarite,
        situationsEnCoursDemandeur,
        situationsPrevuEmploi,
        situationsPrevuAlternance,
        situationsPrevuFormation,
        situationsPrevuImmersion,
        situationsPrevuPmsmp,
        situationsPrevuVolontariat,
        situationsPrevuScolarite,
        situationsPrevuDemandeur,
        situationsTermineeEmploi
      ])
    })
  })
  describe('trouverSituationCourante', () => {
    it('retourne la situation en cours quand elle existe', async () => {
      // When
      const situationCourante = Milo.trouverSituationCourante(situationsTriees)

      // Then
      expect(situationCourante).to.deep.equal(situationsEnCoursEmploi)
    })
    it('ne retourne rien quand aucune situation en cours', async () => {
      // When
      const situationCourante = Milo.trouverSituationCourante([
        situationsPrevuScolarite,
        situationsPrevuEmploi,
        situationsTermineeEmploi,
        situationsPrevuPmsmp
      ])

      // Then
      expect(situationCourante).to.deep.equal(undefined)
    })
  })
})
