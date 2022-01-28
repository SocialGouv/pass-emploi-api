module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('rendez_vous', [
      {
        id: '20C8CA73-FD8B-4194-8D3C-80B6C9949DEB',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2020-09-24T10:00:00.000',
        duree: '30',
        id_jeune: '1'
      },
      {
        id: '77A9A9C5-A26A-4664-B07B-1356B6642D01',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2019-09-24T10:00:00.000',
        duree: '30',
        id_jeune: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e3',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T10:00:00.000',
        duree: '30',
        id_jeune: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e4',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T11:00:00.000',
        duree: '30',
        id_jeune: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e5',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Nils',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T12:00:00.000',
        duree: '30',
        id_jeune: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e6',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Téa',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T13:00:00.000',
        duree: '30',
        id_jeune: '2'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e7',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Isaure',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T14:00:00.000',
        duree: '30',
        id_jeune: '3'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e8',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Théo',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24T15:00:00.000',
        duree: '30',
        id_jeune: '4'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rendez_vous', null, {})
  }
}
