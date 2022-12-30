import { expect } from '../../../utils'
import { MiloJeune } from '../../../../src/domain/partenaire/milo/milo.jeune'

describe('Milo', () => {
  const situationsPrevuEmploi = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.EMPLOI
  }
  const situationsPrevuAlternance = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.CONTRAT_EN_ALTERNANCE
  }
  const situationsPrevuFormation = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.FORMATION
  }
  const situationsPrevuImmersion = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.IMMERSION_EN_ENTREPRISE
  }
  const situationsPrevuPmsmp = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.PMSMP
  }
  const situationsPrevuVolontariat = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
  }
  const situationsPrevuScolarite = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.SCOLARITE
  }
  const situationsPrevuDemandeur = {
    etat: MiloJeune.EtatSituation.PREVU,
    categorie: MiloJeune.CategorieSituation.DEMANDEUR_D_EMPLOI
  }
  const situationsEnCoursEmploi = {
    etat: MiloJeune.EtatSituation.EN_COURS,
    categorie: MiloJeune.CategorieSituation.EMPLOI
  }
  const situationsEnCoursScolarite = {
    etat: MiloJeune.EtatSituation.EN_COURS,
    categorie: MiloJeune.CategorieSituation.SCOLARITE
  }
  const situationsEnCoursDemandeur = {
    etat: MiloJeune.EtatSituation.EN_COURS,
    categorie: MiloJeune.CategorieSituation.DEMANDEUR_D_EMPLOI
  }
  const situationsTermineeEmploi = {
    etat: MiloJeune.EtatSituation.TERMINE,
    categorie: MiloJeune.CategorieSituation.EMPLOI
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
  const situationsTriees = MiloJeune.trierSituations(situations)

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
        MiloJeune.trouverSituationCourante(situationsTriees)

      // Then
      expect(situationCourante).to.deep.equal(situationsEnCoursEmploi)
    })
    it('ne retourne rien quand aucune situation en cours', async () => {
      // When
      const situationCourante = MiloJeune.trouverSituationCourante([
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
