module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('jeune', [
      {
        id: 'bobby',
        prenom: 'Kenji',
        nom: 'Lefameux',
        id_conseiller: '41',
        date_creation: '2021-09-24T10:00:00.000Z',
        email: 'kenji.lefameux@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: 'bobby'
      },
      {
        id: '2',
        prenom: 'Téa',
        nom: 'GIRARD',
        id_conseiller: '41',
        date_creation: '2021-11-24T10:00:00.000Z',
        email: 'tea.girard@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '2'
      },
      {
        id: '3',
        prenom: 'Isaure',
        nom: 'KORN LE BARS',
        id_conseiller: '41',
        date_creation: '2021-11-24T10:00:00.000Z',
        email: 'isaure.korn-le-bars@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '3'
      },
      {
        id: '4',
        prenom: 'Théo',
        nom: 'Usarch',
        id_conseiller: '42',
        date_creation: '2021-11-24T10:00:00.000Z',
        email: 'theo.usarch@passemploi.com',
        structure: 'PASS_EMPLOI',
        id_authentification: '4'
      },
      {
        id: '5',
        prenom: 'Océane',
        nom: 'DEPLAIX',
        id_conseiller: '42',
        date_creation: '2021-11-24T10:00:00.000Z',
        email: 'jeune.milo.passemploi@gmail.com',
        structure: 'MILO'
      },
      {
        id: 'hermione',
        prenom: 'Hermione',
        nom: 'Granger',
        id_conseiller: '41',
        date_creation: '2021-11-24T10:00:00.000Z',
        email: 'hermione.granger@hogwart.co.uk',
        structure: 'PASS_EMPLOI',
        id_authentification: 'hermione'
      },
      {
        id: '5C02587A-D341-4E6D-B5A0-574733D0EBB9',
        prenom: 'Dupont',
        nom: 'Kenji',
        id_conseiller: '972d013d-3781-418a-9b8d-1e288f346b45',
        date_creation: '2021-11-24T10:00:00.000Z',
        date_premiere_connexion: '2021-11-24T10:00:00.000Z',
        email: 'jeune.milo.passemploi@gmail.com',
        structure: 'MILO',
        id_authentification: 'e74450ed-3ec3-4a0d-b9e4-c0701aa24b2d'
      },
      {
        id: 'e3f01482-8105-4306-ae93-527da1d72c90',
        prenom: 'Sylvain',
        nom: 'OLMETA',
        id_conseiller: '972d013d-3781-418a-9b8d-1e288f346b45',
        date_creation: '2021-11-24T10:00:00.000Z',
        date_premiere_connexion: '2021-11-24T10:00:00.000Z',
        email: 'thomas.tourret@octo.com',
        structure: 'MILO',
        id_authentification: 'd3788357-bba0-491e-8e86-c417cd1a0ca0'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jeune', null, {})
  }
}