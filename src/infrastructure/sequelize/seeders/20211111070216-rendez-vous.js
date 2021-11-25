module.exports = {
  async up(queryInterface) {
    for(let i = 0; i < 100; i++) {
      for(let j = 0; j < 100; j++) {
        await queryInterface.bulkInsert('rendez_vous', [
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Nils',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          },
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Nils',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          },
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Nils',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          },
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Téa',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          },
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Isaure',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          },
          {
            id: generateUUID(),
            titre: 'Rendez-vous conseiller',
            sous_titre: 'avec Théo',
            commentaire: 'Suivi des actions',
            modalite: 'Par téléphone',
            date: '2023-09-24Z10:00:00.000',
            duree: '30',
            id_jeune: j + i * 100,
            id_conseiller: i
          }
        ])
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rendez_vous', null, {})
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
