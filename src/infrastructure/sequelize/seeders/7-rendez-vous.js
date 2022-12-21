module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('rendez_vous', [
      {
        id: '20C8CA73-FD8B-4194-8D3C-80B6C9949DEB',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2020-09-24T10:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '9f093194-3309-40af-8d32-e9645b80bc15',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2022-09-24T10:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '77A9A9C5-A26A-4664-B07B-1356B6642D01',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2019-09-24T10:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e3',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T10:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e4',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T11:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e5',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T12:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e6',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Téa',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T13:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e7',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Isaure',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T14:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e8',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Théo',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T15:00:00.000',
        duree: '30',
        createur: '{"nom": "Tavernier", "prenom": "Nils", "id": "41"}'
      }
    ])
    await queryInterface.bulkInsert('rendez_vous_jeune_association', [
      {
        id_rendez_vous: '20C8CA73-FD8B-4194-8D3C-80B6C9949DEB',
        id_jeune: 'bobby'
      },
      {
        id_rendez_vous: '9f093194-3309-40af-8d32-e9645b80bc15',
        id_jeune: 'hermione'
      },
      {
        id_rendez_vous: '77A9A9C5-A26A-4664-B07B-1356B6642D01',
        id_jeune: 'bobby'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e3',
        id_jeune: 'bobby'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e4',
        id_jeune: 'bobby'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e5',
        id_jeune: 'bobby'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e6',
        id_jeune: '2'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e7',
        id_jeune: '3'
      },
      {
        id_rendez_vous: '89092e0a-1111-411b-ac32-4e8cb18498e8',
        id_jeune: '4'
      },
      {
        id_rendez_vous: '20C8CA73-FD8B-4194-8D3C-80B6C9949DEB',
        id_jeune: '2'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rendez_vous_jeune_association', null, {})
    await queryInterface.bulkDelete('rendez_vous', null, {})
  }
}
