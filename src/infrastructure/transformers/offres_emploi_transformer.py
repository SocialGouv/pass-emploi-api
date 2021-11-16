from typing import Optional

from src.application.queries.query_models.offre_emploi_query_model import OffreEmploiQueryModel
from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel


def to_offres_emploi_query_model(page: int, limit: int, offres_emploi_response: dict) -> OffresEmploiQueryModel:
    pagination = {
        'page': page,
        'limit': limit,
        'resultsSize': 0
    }
    offres_emploi = []

    results = offres_emploi_response.get('resultats')

    if results:
        for offre in results:
            entreprise = offre.get('entreprise')
            lieu_travail = offre.get('lieuTravail')

            result = {
                'id': offre.get('id'),
                'titre': offre.get('intitule'),
                'typeContrat': offre.get('typeContrat'),
                'duree': offre.get('dureeTravailLibelleConverti'),
                'nomEntreprise': entreprise.get('nom') if entreprise else None,
                'localisation': {
                    'nom': lieu_travail.get('libelle'),
                    'codePostal': lieu_travail.get('codePostal'),
                    'commune': lieu_travail.get('commune')
                } if lieu_travail else None
            }

            offres_emploi.append(
                result
            )

    pagination['resultsSize'] = len(offres_emploi)
    return OffresEmploiQueryModel(pagination, results=offres_emploi)


def to_offre_emploi_query_model(offre_emploi_response: dict) -> Optional[OffreEmploiQueryModel]:
    id_offre = offre_emploi_response.get('id')

    if not id_offre:
        return None

    contact_section = offre_emploi_response.get('contact')
    contact_url = contact_section.get('urlPostulation') if contact_section else None
    origine_section = offre_emploi_response.get('origineOffre')
    origine_url = origine_section.get('urlOrigine') if origine_section else None

    url_redirect = contact_url if contact_url else origine_url

    return OffreEmploiQueryModel(id_offre, url_redirect, data=offre_emploi_response)
