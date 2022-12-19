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
        id: '972d013d-3781-418a-9b8d-1e288f346b45',
        prenom: 'Albert',
        nom: 'Durant',
        structure: 'MILO',
        email: 'conseiller.technique.milo.passemploi@gmail.com',
        id_authentification: '41e460e8-3db3-41b4-af91-0fe02f131d99',
        notifications_sonores: false,
        id_agence: '9999'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
