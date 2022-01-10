module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('evenement_engagement', [
      {
        id: 1,
        categorie: 'Action',
        action: 'Création',
        id_utilisateur: '41',
        type_utilisateur: 'CONSEILLER',
        date_evenement: '2022-01-04T10:00:00.000Z'
      },
      {
        id: 2,
        categorie: 'Offre',
        action: 'Détail',
        id_utilisateur: '1',
        type_utilisateur: 'JEUNE',
        date_evenement: '2022-01-05T10:00:00.000Z'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
