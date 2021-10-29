from model.offre_emploi import OffreEmploi


def to_offres_emploi(offres_emploi_response: dict) -> [OffreEmploi]:
    if not offres_emploi_response:
        return []

    results = offres_emploi_response['resultats']
    return [OffreEmploi(offre.get('intitule'), offre.get('description')) for offre in results]
