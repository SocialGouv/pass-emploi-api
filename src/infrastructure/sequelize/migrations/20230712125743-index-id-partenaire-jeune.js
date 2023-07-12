'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('jeune', ['id_partenaire'], {
      name: 'idx_jeune_id_partenaire'
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('jeune', 'idx_jeune_id_partenaire')
  }
}
