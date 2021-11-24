module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('rendez_vous', [
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e6',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Téa',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24Z10:00:00.000',
        duree: '30',
        id_jeune: '2',
        id_conseiller: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e7',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Isaure',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24Z10:00:00.000',
        duree: '30',
        id_jeune: '3',
        id_conseiller: '1'
      },
      {
        id: '89092e0a-1111-411b-ac32-4e8cb18498e8',
        titre: 'Rendez-vous conseiller',
        sous_titre: 'avec Théo',
        commentaire: 'Suivi des actions',
        modalite: 'Par téléphone',
        date: '2023-09-24Z10:00:00.000',
        duree: '30',
        id_jeune: '4',
        id_conseiller: '2'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rendez_vous', null, {})
  }
}
