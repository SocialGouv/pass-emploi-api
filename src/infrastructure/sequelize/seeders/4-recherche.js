module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('recherche', [
      {
        id: '6acfe166-dc05-4795-b4c4-6f88ab587c80',
        id_jeune: 'kele',
        titre: 'Recherche numéro 1',
        type: 'OFFRES_EMPLOI',
        metier: 'Suivi des actions',
        localisation: 'Paris',
        criteres: JSON.stringify({
          q: 'Devops',
          duree: [],
          rayon: null,
          commune: null,
          contrat: [],
          alternance: false,
          experience: [],
          departement: '75',
          debutantAccepte: null
        }),
        date_creation: '2023-02-24Z10:00:00.000',
        date_derniere_recherche: '2023-02-24Z10:00:00.000',
        etat_derniere_recherche: 'SUCCES'
      },
      {
        id: '8d5dcc49-ea65-4d2f-b8f8-37eba578b016',
        id_jeune: 'hermione',
        titre: 'Recherche numéro 2',
        type: 'OFFRES_EMPLOI',
        metier: 'Suivi des actions',
        localisation: 'Paris',
        criteres: JSON.stringify({
          duree: [],
          rayon: null,
          commune: null,
          contrat: [],
          alternance: false,
          experience: [],
          departement: null,
          debutantAccepte: null
        }),
        date_creation: '2023-03-24Z10:00:00.000',
        date_derniere_recherche: '2023-03-24Z10:00:00.000',
        etat_derniere_recherche: 'SUCCES'
      },
      {
        id: 'f0f66545-43cc-4b33-841f-e56bb69e2baa',
        id_jeune: 'kele',
        titre: 'Recherche numéro 3',
        type: 'OFFRES_IMMERSION',
        metier: 'Suivi des actions',
        localisation: 'Paris',
        criteres: JSON.stringify({
          lat: 48.830108,
          lon: 2.323026,
          rome: 'D1102',
          distance: null
        }),
        date_creation: '2021-03-25Z10:00:00.000',
        date_derniere_recherche: '2021-03-25Z10:00:00.000',
        etat_derniere_recherche: 'SUCCES'
      },
      {
        id: '95e73963-2e58-449b-ab76-4dbb62da3d9d',
        id_jeune: 'kele',
        titre: 'Recherche numéro 4',
        type: 'OFFRES_SERVICES_CIVIQUE',
        metier: 'Suivi des actions',
        localisation: 'Paris',
        criteres: JSON.stringify({
          lat: 47.779684,
          lon: 0.775825,
          domaine: null,
          distance: null,
          dateDeDebutMinimum: null
        }),
        date_creation: '2023-03-24Z10:00:00.000',
        date_derniere_recherche: '2023-03-24Z10:00:00.000',
        etat_derniere_recherche: 'ECHEC'
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('recherche', null, {})
  }
}
