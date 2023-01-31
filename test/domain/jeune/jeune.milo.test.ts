import { expect } from '../../utils'
import { JeuneMilo } from '../../../src/domain/jeune/jeune.milo'

describe('Milo', () => {
  const situationsPrevuEmploi = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.EMPLOI
  }
  const situationsPrevuAlternance = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.CONTRAT_EN_ALTERNANCE
  }
  const situationsPrevuFormation = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.FORMATION
  }
  const situationsPrevuImmersion = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.IMMERSION_EN_ENTREPRISE
  }
  const situationsPrevuPmsmp = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.PMSMP
  }
  const situationsPrevuVolontariat = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
  }
  const situationsPrevuScolarite = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.SCOLARITE
  }
  const situationsPrevuDemandeur = {
    etat: JeuneMilo.EtatSituation.PREVU,
    categorie: JeuneMilo.CategorieSituation.DEMANDEUR_D_EMPLOI
  }
  const situationsEnCoursEmploi = {
    etat: JeuneMilo.EtatSituation.EN_COURS,
    categorie: JeuneMilo.CategorieSituation.EMPLOI
  }
  const situationsEnCoursScolarite = {
    etat: JeuneMilo.EtatSituation.EN_COURS,
    categorie: JeuneMilo.CategorieSituation.SCOLARITE
  }
  const situationsEnCoursDemandeur = {
    etat: JeuneMilo.EtatSituation.EN_COURS,
    categorie: JeuneMilo.CategorieSituation.DEMANDEUR_D_EMPLOI
  }
  const situationsTermineeEmploi = {
    etat: JeuneMilo.EtatSituation.TERMINE,
    categorie: JeuneMilo.CategorieSituation.EMPLOI
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
  const situationsTriees = JeuneMilo.trierSituations(situations)

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
      const situationCourante =
        JeuneMilo.trouverSituationCourante(situationsTriees)

      // Then
      expect(situationCourante).to.deep.equal(situationsEnCoursEmploi)
    })
    it('ne retourne rien quand aucune situation en cours', async () => {
      // When
      const situationCourante = JeuneMilo.trouverSituationCourante([
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
