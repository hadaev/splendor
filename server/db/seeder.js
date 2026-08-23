const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');

async function seeder(sequelize) {
  const seedersGlob = path
    .resolve(__dirname, '../seeders/*.js')
    .split(path.sep)
    .join(path.posix.sep);

  const umzugSeeder = new Umzug({
    // Resolve relative to this file, not to the directory from which Node was started.
    migrations: { glob: seedersGlob },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData' }),
    logger: console,
  });

  // Checks migrations and run them if they are not already applied. To keep
  // track of the executed migrations, a table (and sequelize model) called SequelizeMeta
  // will be automatically created (if it doesn't exist already) and parsed.
  try {
    const seeds = await umzugSeeder.up();
    console.info(`${seeds.length} seeds has been executed`);
  } catch (e) {
    console.error(`Cannot apply seeds: ${e}`);
    await umzugSeeder.down();
    process.exit(1);
  }
}

module.exports = seeder;
