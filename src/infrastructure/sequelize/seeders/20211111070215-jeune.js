module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('jeune', [
      {
        id: '1',
        prenom: 'Kenji',
        nom: 'Lefameux',
        id_conseiller: '1',
        date_creation: '2021-09-24T10:00:00.000Z'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jeune', null, {})
  }
}
