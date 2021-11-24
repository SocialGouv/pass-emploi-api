module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('conseiller', [
      {
        id: '1',
        prenom: 'Nils',
        nom: 'Tavernier'
      },
      {
        id: '2',
        prenom: 'Virginie',
        nom: 'Renoux'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
