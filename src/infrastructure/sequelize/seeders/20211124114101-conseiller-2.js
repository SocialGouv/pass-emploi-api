module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('conseiller', [
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
