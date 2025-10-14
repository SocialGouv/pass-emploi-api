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
    // 1️⃣ Remove current primary key
    await queryInterface.sequelize.query(`
    ALTER TABLE superviseur DROP CONSTRAINT IF EXISTS superviseur_pkey;
  `)

    // 2️⃣ Add back structure column (temporarily nullable)
    await queryInterface.addColumn('superviseur', 'structure', {
      type: Sequelize.STRING,
      allowNull: true
    })

    // 3️⃣ Populate structure using data from 'conseiller' table
    await queryInterface.sequelize.query(`
    UPDATE superviseur s
    SET structure = c.structure
    FROM conseiller c
    WHERE s.email = c.email;
  `)

    // 4️⃣ Delete superviseurs that still have NULL structure (no match)
    await queryInterface.sequelize.query(`
    DELETE FROM superviseur WHERE structure IS NULL;
  `)

    // 5️⃣ Make structure non-nullable
    await queryInterface.changeColumn('superviseur', 'structure', {
      type: Sequelize.STRING,
      allowNull: false
    })

    // 6️⃣ Restore composite primary key
    await queryInterface.sequelize.query(`
    ALTER TABLE superviseur ADD PRIMARY KEY (email, structure);
  `)
  }
}
