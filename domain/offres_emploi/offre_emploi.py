from typing import Optional


class OffreEmploi:

    def __init__(
            self,
            id: str,
            title: str,
            type_contrat: str,
            nom_entreprise: Optional[str],
            localisation: Optional[dict]
    ):
        self.id = id
        self.title = title
        self.type_contrat = type_contrat
        self.nom_entreprise = nom_entreprise
        self.localisation = localisation
