module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('conseiller', [
      {
        id: '1',
        prenom: 'Nils',
        nom: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '1'
      },
      {
        id: '2',
        prenom: 'Virginie',
        nom: 'Renoux',
        structure: 'PASS_EMPLOI',
        id_authentification: '2'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
