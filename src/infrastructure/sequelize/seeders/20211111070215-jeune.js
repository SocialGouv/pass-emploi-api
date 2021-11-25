module.exports = {
  async up(queryInterface) {
    for(let i = 0; i < 100; i++) {
      for(let j = 0; j < 100; j++) {
        await queryInterface.bulkInsert('jeune', [
          {
            id: j + i * 100,
            prenom: 'Kenji' + j + i,
            nom: 'Lefameux' + j + i,
            id_conseiller: i,
            date_creation: '2021-09-24T10:00:00.000Z'
          }])
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jeune', null, {})
  }
}
