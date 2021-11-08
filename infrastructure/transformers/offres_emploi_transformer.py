from typing import List

from domain.offres_emploi.offre_emploi import OffreEmploi


def to_offres_emploi(offres_emploi_response: dict) -> List[OffreEmploi]:
    offres_emploi = []
    results = offres_emploi_response.get('resultats')

    if not results:
        return offres_emploi

    for offre in results:
        id = offre.get('id')
        titre = offre.get('intitule')
        type_contrat = offre.get('typeContrat')

        entreprise = offre.get('entreprise')
        nom_entreprise = entreprise.get('nom') if entreprise else None

        lieu_travail = offre.get('lieuTravail')
        localisation = {
            'nom': lieu_travail.get('libelle'),
            'code_postal': lieu_travail.get('codePostal'),
            'commune': lieu_travail.get('commune')
        } if lieu_travail else None

        offres_emploi.append(
            OffreEmploi(id, titre, type_contrat, nom_entreprise, localisation)
        )

    return offres_emploi
