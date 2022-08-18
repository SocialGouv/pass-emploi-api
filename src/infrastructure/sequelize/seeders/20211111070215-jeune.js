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
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jeune', null, {})
  }
}
