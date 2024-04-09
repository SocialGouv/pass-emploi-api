'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint(
      'jeune_milo_a_archiver',
      'jeune_milo_a_archiver_id_jeune_fkey'
    )
    await queryInterface.addConstraint('jeune_milo_a_archiver', {
      type: 'foreign key',
      fields: ['id_jeune'],
      name: 'jeune_milo_a_archiver_id_jeune_fkey',
      references: {
        table: 'jeune',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'jeune_milo_a_archiver',
      'jeune_milo_a_archiver_id_jeune_fkey'
    )
    await queryInterface.addConstraint('jeune_milo_a_archiver', {
      type: 'foreign key',
      fields: ['id_jeune'],
      name: 'jeune_milo_a_archiver_id_jeune_fkey',
      references: {
        table: 'jeune',
        field: 'id'
      }
    })
  }
}
