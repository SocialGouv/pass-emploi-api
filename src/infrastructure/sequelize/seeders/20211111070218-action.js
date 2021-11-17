module.exports = {
  async up (queryInterface) {
    return queryInterface.bulkInsert('action', [{
      id: '6c7b1c4b-5ba7-443b-b46c-1ccd67907329',
      contenu: 'Suivre une formation',
      commentaire: 'Consulter le catalogue des formations',
      statut: 'not_started',
      date_creation: '2023-09-24Z10:00:00.000',
      date_derniere_actualisation: '2023-09-25Z10:00:00.000',
      id_jeune: '1',
      est_visible_par_conseiller: true,
      id_createur: '1',
      type_createur: 'conseiller'
    }, {
      id: '655b0837-9d81-4d4b-8391-2ec9e87879e8',
      contenu: 'Suivre une formation',
      commentaire: 'Consulter le catalogue des formations',
      statut: 'in_progress',
      date_creation: '2023-09-24Z10:00:00.000',
      date_derniere_actualisation: '2023-09-25Z10:00:00.000',
      id_jeune: '1',
      est_visible_par_conseiller: true,
      id_createur: '1',
      type_createur: 'conseiller'
    }, {
      id: '3a309fd2-a8c6-4350-b31a-e490a3887d36',
      contenu: 'Suivre une formation',
      commentaire: 'Consulter le catalogue des formations',
      statut: 'done',
      date_creation: '2023-09-24Z10:00:00.000',
      date_derniere_actualisation: '2023-09-25Z10:00:00.000',
      id_jeune: '1',
      est_visible_par_conseiller: true,
      id_createur: '1',
      type_createur: 'jeune'
    }])
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('action', null, {})
  }
}
