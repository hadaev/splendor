const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');

async function migrator(sequelize) {
  const migrationsGlob = path
    .resolve(__dirname, '../migrations/*.js')
    .split(path.sep)
    .join(path.posix.sep);

  const umzug = new Umzug({
    // Resolve relative to this file, not to the directory from which Node was started.
    migrations: { glob: migrationsGlob },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  // Checks migrations and run them if they are not already applied. To keep
  // track of the executed migrations, a table (and sequelize model) called SequelizeMeta
  // will be automatically created (if it doesn't exist already) and parsed.
  try {
    const migrations = await umzug.up();
    console.info(`${migrations.length} migrations has been executed`);
  } catch (e) {
    console.error(`Cannot run migrations: ${e}`);
    await umzug.down();
    process.exit(1);
  }
}

module.exports = migrator;
