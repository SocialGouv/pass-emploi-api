module.exports = {
  async up(queryInterface) {
    for(let i = 0; i < 100; i++) {
      await queryInterface.bulkInsert('conseiller', [
        {
          id: i,
          prenom: 'Nils' + 1,
          nom: 'Tavernier' + 1
        }])
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
