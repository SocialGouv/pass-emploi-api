from model.offre_emploi import OffreEmploi


def to_offres_emploi(offres_emploi_response: dict) -> [OffreEmploi]:
    results = offres_emploi_response['resultats']
    return [OffreEmploi(offre['intitule'], offre['description']) for offre in results]
