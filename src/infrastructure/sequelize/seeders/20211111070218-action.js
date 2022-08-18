module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert('action', [
      {
        id: '6c7b1c4b-5ba7-443b-b46c-1ccd67907329',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'not_started',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'bobby',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'conseiller',
        createur: JSON.stringify({
          nom: 'Tavernier',
          prenom: 'Nils',
          id: '41'
        })
      },
      {
        id: '655b0837-9d81-4d4b-8391-2ec9e87879e8',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'in_progress',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'bobby',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'conseiller',
        createur: JSON.stringify({
          nom: 'Tavernier',
          prenom: 'Nils',
          id: '41'
        })
      },
      {
        id: '3a309fd2-a8c6-4350-b31a-e490a3887d36',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'done',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'bobby',
        est_visible_par_conseiller: true,
        id_createur: '1',
        type_createur: 'jeune',
        createur: JSON.stringify({
          nom: 'Lefameux',
          prenom: 'Kenji',
          id: '1'
        })
      },
      {
        id: '6c7b1c4b-5ba7-443b-b46c-1ccd67907320',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'not_started',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: '2',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'conseiller',
        createur: JSON.stringify({
          nom: 'Tavernier',
          prenom: 'Nils',
          id: '41'
        })
      },
      {
        id: '655b0837-9d81-4d4b-8391-2ec9e87879e9',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'in_progress',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: '2',
        est_visible_par_conseiller: true,
        id_createur: '2',
        type_createur: 'jeune',
        createur: JSON.stringify({
          nom: '',
          prenom: '',
          id: '2'
        })
      },
      {
        id: '3a309fd2-a8c6-4350-b31a-e490a3887d37',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'done',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: '4',
        est_visible_par_conseiller: true,
        id_createur: '42',
        type_createur: 'conseiller',
        createur: JSON.stringify({
          nom: '',
          prenom: '',
          id: '42'
        })
      },
      {
        id: '71f62564-49e4-4adf-a0d6-7afa3ffdf94d',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'done',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'hermione',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'conseiller',
        createur: JSON.stringify({
          nom: 'Doe',
          prenom: 'John',
          id: '41'
        })
      },
      {
        id: '393a0c1c-b344-4bde-8a5a-75d2918f9172',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'not_started',
        date_creation: '2023-09-24Z10:00:00.000',
        date_echeance: '2023-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'hermione',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'jeune',
        createur: JSON.stringify({
          nom: 'Granger',
          prenom: 'Hermione',
          id: 'hermione'
        })
      }
      ,
      {
        id: 'a61ec7c5-affe-4bf4-8207-61528f7e3739',
        contenu: 'Suivre une formation',
        description: 'Consulter le catalogue des formations',
        statut: 'not_started',
        date_creation: '2021-09-24Z10:00:00.000',
        date_echeance: '2021-12-24Z10:00:00.000',
        date_derniere_actualisation: '2023-09-25Z10:00:00.000',
        id_jeune: 'hermione',
        est_visible_par_conseiller: true,
        id_createur: '41',
        type_createur: 'jeune',
        createur: JSON.stringify({
          nom: 'Granger',
          prenom: 'Hermione',
          id: 'hermione'
        })
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('action', null, {})
  }
}
