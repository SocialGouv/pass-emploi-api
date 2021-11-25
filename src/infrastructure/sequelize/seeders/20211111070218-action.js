module.exports = {
  async up(queryInterface) {
    for(let i = 0; i < 100; i++) {
      for(let j = 0; j < 100; j++) {
        await queryInterface.bulkInsert('action', [
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'not_started',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune: j + i * 100,
            est_visible_par_conseiller: true,
            id_createur: j,
            type_createur: 'conseiller'
          },
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'in_progress',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune: j + i * 100,
            est_visible_par_conseiller: true,
            id_createur: j,
            type_createur: 'conseiller'
          },
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'done',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune: j + i * 100,
            est_visible_par_conseiller: true,
            id_createur: i,
            type_createur: 'jeune'
          },
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'not_started',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune: '2',
            est_visible_par_conseiller: true,
            id_createur: '1',
            type_createur: 'conseiller'
          },
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'in_progress',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune:i,
            est_visible_par_conseiller: true,
            id_createur: i,
            type_createur: 'jeune'
          },
          {
            id: generateUUID(),
            contenu: 'Suivre une formation',
            commentaire: 'Consulter le catalogue des formations',
            statut: 'done',
            date_creation: '2023-09-24Z10:00:00.000',
            date_derniere_actualisation: '2023-09-25Z10:00:00.000',
            id_jeune: j + i * 100,
            est_visible_par_conseiller: true,
            id_createur: j,
            type_createur: 'conseiller'
          }
        ])
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('action', null, {})
  }
}

function generateUUID() { // Public Domain/MIT
  var d = new Date().getTime();//Timestamp
  var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16;//random number between 0 and 16
    if(d > 0){//Use timestamp until depleted
      r = (d + r)%16 | 0;
      d = Math.floor(d/16);
    } else {//Use microseconds since page-load if supported
      r = (d2 + r)%16 | 0;
      d2 = Math.floor(d2/16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}