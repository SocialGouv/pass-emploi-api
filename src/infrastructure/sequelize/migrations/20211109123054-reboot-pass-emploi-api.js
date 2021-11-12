module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction({ isolationLevel: Sequelize.Transaction.SERIALIZABLE }, async (transaction) => {
      await queryInterface.createTable('conseiller', {
        id: {
          primaryKey: true,
          type: Sequelize.STRING,
          allowNull: false
        },
        nom: {
          type: Sequelize.STRING,
          allowNull: false
        },
        prenom: {
          type: Sequelize.STRING,
          allowNull: false
        }
      }, { transaction })

      await queryInterface.createTable('jeune', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },
        nom: {
          type: Sequelize.STRING,
          allowNull: false
        },
        prenom: {
          type: Sequelize.STRING,
          allowNull: false
        },
        idConseiller: {
          field: 'id_conseiller',
          type: Sequelize.STRING,
          references: {
            model: 'conseiller',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        pushNotificationToken: {
          field: 'push_notification_token',
          type: Sequelize.STRING,
          allowNull: true
        },
        dateDerniereActualisationToken: {
          field: 'date_derniere_actualisation_token',
          type: Sequelize.DATE,
          allowNull: true
        },
        dateCreation: {
          field: 'date_creation',
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction })

      await queryInterface.createTable('rendez_vous', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        idConseiller: {
          field: 'id_conseiller',
          type: Sequelize.STRING,
          references: {
            model: 'conseiller',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        idJeune: {
          field: 'id_jeune',
          type: Sequelize.STRING,
          references: {
            model: 'jeune',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        titre: {
          type: Sequelize.STRING(512),
          allowNull: false
        },
        sousTitre: {
          field: 'sous_titre',
          type: Sequelize.STRING(512),
          allowNull: false
        },
        commentaire: {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        modalite: {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        duree: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        dateSuppression: {
          field: 'date_suppression',
          type: Sequelize.DATE,
          allowNull: true
        }

      }, { transaction })

      await queryInterface.createTable('action', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        idJeune: {
          field: 'id_jeune',
          type: Sequelize.STRING,
          references: {
            model: 'jeune',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        idCreateur: {
          field: 'id_createur',
          type: Sequelize.STRING,
          allowNull: false
        },
        typeCreateur: {
          field: 'type_createur',
          type: Sequelize.STRING,
          allowNull: false
        },
        contenu: {
          type: Sequelize.STRING(1024),
          allowNull: false
        },
        commentaire: {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        statut: {
          type: Sequelize.STRING,
          allowNull: false
        },
        estVisibleParConseiller: {
          field: 'est_visible_par_conseiller',
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        dateCreation: {
          field: 'date_creation',
          type: Sequelize.DATE,
          allowNull: false
        },
        dateDerniereActualisation: {
          field: 'date_derniere_actualisation',
          type: Sequelize.DATE,
          allowNull: false
        },
        dateLimite: {
          field: 'date_limite',
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction })
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction({ isolationLevel: Sequelize.Transaction.SERIALIZABLE }, async (transaction) => {
      await queryInterface.dropTable('action', { transaction })
      await queryInterface.dropTable('rendez_vous', { transaction })
      await queryInterface.dropTable('jeune', { transaction })
      await queryInterface.dropTable('conseiller', { transaction })
    })
  }
}
