module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('conseiller', [
      {
        id: '40',
        prenom: 'TEST',
        nom: 'TEST',
        email: 'test@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '40'
      },
      {
        id: '41',
        prenom: 'Nils',
        nom: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '41'
      },
      {
        id: '42',
        prenom: 'Virginie',
        nom: 'Renoux',
        structure: 'PASS_EMPLOI',
        id_authentification: '42'
      },
      {
        id: 'e04bb080-5805-402e-a527-0f9d2ee0840f',
        prenom: 'Recette',
        nom: 'Renoux',
        structure: 'POLE_EMPLOI',
        id_authentification: 'e04bb080-5805-402e-a527-0f9d2ee0840f'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
