'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex('action', ['id_jeune'], {
        transaction,
        name: 'idx_action_id_jeune'
      })
      await queryInterface.addIndex('jeune', ['id_conseiller'], {
        transaction,
        name: 'idx_jeune_id_conseiller'
      })
      await queryInterface.addIndex('recherche', ['id_jeune'], {
        transaction,
        name: 'idx_recherche_id_jeune'
      })
      await queryInterface.addIndex('rendez_vous', ['id_jeune'], {
        transaction,
        name: 'idx_rendez_vous_id_jeune'
      })
      await queryInterface.addIndex('favori_offre_emploi', ['id_jeune'], {
        transaction,
        name: 'idx_favori_offre_emploi_id_jeune'
      })
      await queryInterface.addIndex('favori_offre_immersion', ['id_jeune'], {
        transaction,
        name: 'idx_favori_offre_immersion_id_jeune'
      })
      await queryInterface.addIndex('transfert_conseiller', ['id_jeune'], {
        transaction,
        name: 'idx_transfert_conseiller_id_jeune'
      })
      await queryInterface.addIndex(
        'transfert_conseiller',
        ['id_conseiller_source'],
        {
          transaction,
          name: 'idx_transfert_conseiller_id_conseiller_source'
        }
      )
      await queryInterface.addIndex(
        'transfert_conseiller',
        ['id_conseiller_cible'],
        {
          transaction,
          name: 'idx_transfert_conseiller_id_conseiller_cible'
        }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex('action', 'idx_action_id_jeune', {
        transaction
      })
      await queryInterface.removeIndex('jeune', 'idx_jeune_id_conseiller', {
        transaction
      })
      await queryInterface.removeIndex('recherche', 'idx_recherche_id_jeune', {
        transaction
      })
      await queryInterface.removeIndex(
        'rendez_vous',
        'idx_rendez_vous_id_jeune',
        {
          transaction
        }
      )
      await queryInterface.removeIndex(
        'favori_offre_emploi',
        'idx_favori_offre_emploi_id_jeune',
        {
          transaction
        }
      )
      await queryInterface.removeIndex(
        'favori_offre_immersion',
        'idx_favori_offre_immersion_id_jeune',
        {
          transaction
        }
      )
      await queryInterface.removeIndex(
        'transfert_conseiller',
        'idx_transfert_conseiller_id_jeune',
        {
          transaction
        }
      )
      await queryInterface.removeIndex(
        'transfert_conseiller',
        'idx_transfert_conseiller_id_conseiller_cible',
        {
          transaction
        }
      )
      await queryInterface.removeIndex(
        'transfert_conseiller',
        'idx_transfert_conseiller_id_conseiller_source',
        {
          transaction
        }
      )
    })
  }
}
