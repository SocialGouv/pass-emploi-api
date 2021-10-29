from unittest import mock

from config import PASS_EMPLOI_DEV_URL


@mock.patch('repositories.offres_emploi_repository.OffresEmploiAPIDatasource.get_offres_emploi')
def test_offres_emploi(mocked_offres_emploi, client):
    mocked_resultats = [
        {
            "id": "4369834",
            "intitule": "Technicien Informatique H/F",
            "description": "OFFRE1: \n description1",
            "dateCreation": "2021-10-28T14:01:33.000Z",
            "dateActualisation": "2021-10-28T14:01:33.000Z",
            "lieuTravail": {
                "libelle": "51 - REIMS",
                "latitude": 49.250859,
                "longitude": 4.053047,
                "codePostal": "51100",
                "commune": "51454"
            },
            "romeCode": "I1401",
            "romeLibelle": "Maintenance informatique et bureautique",
            "appellationlibelle": "Technicien(ne) d'assistance à la clientèle en informatique",
            "entreprise": {
                "nom": "L'offre RH",
                "description": "L'offre RH, Cabinet de Conseil en Recrutement est spécialisé dans le recrutement de profils Tertiaire, Ingénierie et Cadre.\n\nNotre client : Filiale d'un grand groupe, sa vocation est d'assurer l'installation et la maintenance des matériels informatiques et monétiques, pour des agences commerciales ainsi que pour leurs clients.\n\nEn développement depuis plus de 25 ans, l'entreprise comporte aujourd'hui plus de 750 salariés en constante formation.\n\nDans le c...",
                "entrepriseAdaptee": False
            },
            "typeContrat": "CDD",
            "typeContratLibelle": "Contrat à durée déterminée - 6 Mois",
            "natureContrat": "Contrat travail",
            "experienceExige": "D",
            "experienceLibelle": "Débutant accepté",
            "salaire": {
                "libelle": "Mensuel de 1600,00 Euros ï¿½ 1800,00 Euros"
            },
            "dureeTravailLibelle": "35 H  Horaires normaux",
            "dureeTravailLibelleConverti": "Temps plein",
            "alternance": False,
            "nombrePostes": 1,
            "accessibleTH": False,
            "qualificationCode": "7",
            "qualificationLibelle": "Technicien",
            "origineOffre": {
                "origine": "2",
                "urlOrigine": "https://candidat.pole-emploi.fr/offres/recherche/detail/4369834",
                "partenaires": [
                    {
                        "nom": "BEETWEEN",
                        "url": "https://candidature.beetween.com/apply/job/ngpj1ixik18/technicien-informatique-en-itinerance-h-f",
                        "logo": "https://www.pole-emploi.fr/static/img/partenaires/beetween80.png"
                    }
                ]
            }
        },
        {
            "id": "4162319",
            "intitule": "Technicien support applicatif",
            "description": "OFFRE2: \n description2",
            "dateCreation": "2021-10-25T07:58:35.000Z",
            "dateActualisation": "2021-10-25T07:58:35.000Z",
            "lieuTravail": {
                "libelle": "49 - Maine et Loire"
            },
            "romeCode": "I1401",
            "romeLibelle": "Maintenance informatique et bureautique",
            "appellationlibelle": "Technicien / Technicienne de maintenance en informatique",
            "entreprise": {
                "nom": "ITANCIA",
                "entrepriseAdaptee": False
            },
            "typeContrat": "CDI",
            "typeContratLibelle": "Contrat à durée indéterminée",
            "natureContrat": "Contrat travail",
            "experienceExige": "E",
            "experienceLibelle": "Expérience exigée de 2 An(s)",
            "salaire": {
                "commentaire": "A partir de 28 k€ brut annuel"
            },
            "alternance": False,
            "nombrePostes": 1,
            "accessibleTH": False,
            "qualificationCode": "8",
            "qualificationLibelle": "Agent de maîtrise",
            "secteurActivite": "95",
            "secteurActiviteLibelle": "Réparation de produits électroniques grand public",
            "origineOffre": {
                "origine": "2",
                "urlOrigine": "https://candidat.pole-emploi.fr/offres/recherche/detail/4162319",
                "partenaires": [
                    {
                        "nom": "APEC",
                        "url": "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/167029206W?xtor=AL-406",
                        "logo": "https://www.pole-emploi.fr/static/img/partenaires/apec80.png"
                    }
                ]
            }
        }
    ]
    mocked_offres_emploi.return_value = {
        "resultats": mocked_resultats
    }

    response = client.get(f'{PASS_EMPLOI_DEV_URL}/offres-emploi')
    assert response.status_code == 200
    mocked_offres_emploi.assert_called_once()
    print(response.data)
    assert response.data == b'[{"title": "Technicien Informatique H/F", "description": "OFFRE1: \\n description1"},' \
                            b' {"title": "Technicien support applicatif", "description": "OFFRE2: \\n description2"}]'
