module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('conseiller', [
      {
        id: '40',
        prenom: 'TEST',
        nom: 'TEST',
        email: 'test@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '40',
        notifications_sonores: false
      },
      {
        id: '41',
        prenom: 'Nils',
        nom: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '41',
        notifications_sonores: true
      },
      {
        id: '42',
        prenom: 'Virginie',
        nom: 'Renoux',
        structure: 'PASS_EMPLOI',
        id_authentification: '42',
        notifications_sonores: false
      },
      {
        id: 'e04bb080-5805-402e-a527-0f9d2ee0840f',
        prenom: 'Recette',
        nom: 'Renoux',
        structure: 'POLE_EMPLOI',
        id_authentification: 'e04bb080-5805-402e-a527-0f9d2ee0840f',
        notifications_sonores: false
      },
      {
        id: 'b9ceb634-57a4-486e-bada-85cf82f1ad20',
        prenom: 'Claire',
        nom: 'Dupond',
        structure: 'MILO',
        id_authentification: 'cdace196-2930-4cf0-b9c2-17344a0d7178',
        notifications_sonores: false
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
