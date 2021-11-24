module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('jeune', [
      {
        id: '2',
        prenom: 'Téa',
        nom: 'GIRARD',
        id_conseiller: '1',
        date_creation: '2021-11-24T10:00:00.000Z'
      },
      {
        id: '3',
        prenom: 'Isaure',
        nom: 'KORN LE BARS',
        id_conseiller: '1',
        date_creation: '2021-11-24T10:00:00.000Z'
      },
      {
        id: '4',
        prenom: 'Théo',
        nom: 'Usarch',
        id_conseiller: '2',
        date_creation: '2021-11-24T10:00:00.000Z'
      },
      {
        id: '5',
        prenom: 'Océane',
        nom: 'DEPLAIX',
        id_conseiller: '2',
        date_creation: '2021-11-24T10:00:00.000Z'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jeune', null, {})
  }
}
