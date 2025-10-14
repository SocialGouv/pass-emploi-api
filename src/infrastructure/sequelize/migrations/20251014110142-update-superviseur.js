'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1️⃣ Remove duplicates, keeping the first row per email
    await queryInterface.sequelize.query(`
      DELETE FROM superviseur
      WHERE ctid NOT IN (
        SELECT MIN(ctid)
        FROM superviseur
        GROUP BY email
      );
    `)

    // 2️⃣ Drop the old composite primary key
    await queryInterface.sequelize.query(`
      ALTER TABLE superviseur DROP CONSTRAINT IF EXISTS superviseur_pkey;
    `)

    // 3️⃣ Drop the structure column
    await queryInterface.removeColumn('superviseur', 'structure')

    // 4️⃣ Add new primary key on email
    await queryInterface.sequelize.query(`
      ALTER TABLE superviseur ADD PRIMARY KEY (email);
    `)
  },

  down: async (queryInterface, Sequelize) => {
    // 1️⃣ Remove current PK
    await queryInterface.sequelize.query(`
      ALTER TABLE superviseur DROP CONSTRAINT IF EXISTS superviseur_pkey;
    `)

    // 2️⃣ Add back structure column
    await queryInterface.addColumn('superviseur', 'structure', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    })

    // 3️⃣ Restore composite PK
    await queryInterface.sequelize.query(`
      ALTER TABLE superviseur ADD PRIMARY KEY (email, structure);
    `)
  }
}
