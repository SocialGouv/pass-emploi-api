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
        id: 'a45665e1-df8a-4ad8-a34b-b972d3420669',
        prenom: 'Albert',
        nom: 'Durant',
        structure: 'MILO',
        email: 'conseiller.technique.milo.passemploi@gmail.com',
        id_authentification: '8f4118cc-525a-404b-ac8b-c1f36974c7ec',
        notifications_sonores: false,
        id_agence: '9999',
        id_structure_milo: '80620S00'
      },
      {
        id: '20097302-448d-4048-a0ae-306964aab60e',
        prenom: 'Bruno',
        nom: 'Dumont',
        structure: 'MILO',
        id_authentification: 'e6d4a5bf-0189-4581-8350-f772bca0d4a1',
        notifications_sonores: false,
        id_structure_milo: '80620S00'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conseiller', null, {})
  }
}
