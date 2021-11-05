from typing import Optional, List

from domain.offres_emploi.offre_emploi import OffreEmploi


def to_offres_emploi(offres_emploi_response: dict) -> Optional[List[OffreEmploi]]:
    if not offres_emploi_response:
        return None

    results = offres_emploi_response.get('resultats')

    if not results:
        return None

    return [OffreEmploi(offre.get('intitule'), offre.get('description')) for offre in results]
