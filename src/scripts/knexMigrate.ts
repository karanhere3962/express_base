import * as fs from "fs";
import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import knexConfig from "../../knexfile";
import { commonConfig, logger, getTenantSchemaNames, db } from "../setup";
import { execSync } from "child_process";

// Define interfaces for the command line arguments
interface CommonOptions {
  _?: string[];
  env: string;
  type: string;
  schema: string;
}

interface MigrationMakeArgs extends CommonOptions {
  name: string; // This is specific to the 'make' command
}

interface MigrationsMigrateArgs extends CommonOptions {
  // No additional arguments for 'migrate', just using CommonOptions
}

// Define the overall arguments type
type MyArguments = MigrationMakeArgs | MigrationsMigrateArgs;

// Setup yargs with specific command configurations
const argv = yargs(hideBin(process.argv))
  .scriptName("knexMigrate")
  .usage("$0 make <name> [args]")
  .usage("$0 migrate [args]")
  .command<MigrationMakeArgs>(
    "make",
    "Create a new migration file",
    (yargs) => {
      return yargs.positional("name", {
        type: "string",
        demandOption: true,
        alias: "n",
        description: "Name of the migration",
      });
    }
  )
  .command<MigrationsMigrateArgs>("migrate", "Run all pending migrations")
  .options({
    env: {
      type: "string",
      default: "development",
      alias: "environment",
      description:
        "Environment. Possible values: development, staging, production.",
    },
    type: {
      type: "string",
      default: "public",
      alias: "t",
      description:
        "Where to create the migration file. Possible values: public, tenant, common. Default is 'public'.",
    },
    schema: {
      type: "string",
      default: "",
      alias: "tenant",
      description:
        "Where the migration should be run. Possible values are 'public', 'tenant' and 'common'. Default is ''.",
    },
  })
  .help()
  .parseSync() as MyArguments;

const getMigrationTemplate = (
  schema: string | undefined = undefined
) => `import { Knex } from 'knex';
import { logger } from '../../../setup';

const tenantSchema = ${
  schema ? '"' + schema + '"' : 'process.env.TENANT_SCHEMA || "public"'
};
logger.debug("Running migration in schema:", tenantSchema)

exports.up = async (knex: Knex) => {
// TODO: write migration here
return knex.schema.withSchema(tenantSchema)
};

exports.down = async (knex: Knex) => {
// TODO: write rollback here
return knex.schema.withSchema(tenantSchema)
};`;
export async function generateMigrationScript({
  name,
  env,
  schema,
  type,
}: MigrationMakeArgs) {
  await db.raw(`CREATE SCHEMA IF NOT EXISTS "knex_migrations";`);
  if (!name) {
    throw new Error("Please provide a migration name.");
  }
  const environmentConfig = knexConfig[env];
  if (!environmentConfig) {
    logger.error(`No knex configuration found for environment: ${env}`);
    return;
  }
  const fullDirectoryPath = path.join(commonConfig.migrations.directory, type);
  // Check if directory exists, create if not
  if (!fs.existsSync(fullDirectoryPath)) {
    fs.mkdirSync(fullDirectoryPath, { recursive: true });
    logger.debug(`Directory created: ${fullDirectoryPath}`);
  }
  const datePrefix = new Date()
    .toISOString()
    .replace(/[:\-T\.Z]/g, "")
    .slice(0, 14);
  const filename = `${datePrefix}_${name}.ts`;
  const fullPath = path.join(fullDirectoryPath, filename);
  fs.writeFileSync(fullPath, getMigrationTemplate(schema));
}

function getLastDirectoryName(directoryPath: string): string {
  // Normalize the path to remove the trailing slash, if any
  if (directoryPath.endsWith(path.sep)) {
    directoryPath = directoryPath.slice(0, -1);
  }
  return path.basename(directoryPath);
}

export function getKnexMigrationTableName(
  env: string,
  schema: string,
  type: string
): string {
  return knexConfig[env].migrations?.tableName + "_" + schema + "_" + type;
}

export function runMigrationFor(
  env: string,
  schema: string,
  migrationDirectory: string
) {
  const type = getLastDirectoryName(migrationDirectory);
  const knexMigrationTable = getKnexMigrationTableName(env, schema, type);

  if (!fs.existsSync(migrationDirectory)) {
    fs.mkdirSync(migrationDirectory, { recursive: true });
    logger.debug(`Directory created: ${migrationDirectory}`);
  }
  const migrationCommand = `npx knex migrate:latest --env ${env} --migrations-directory ${migrationDirectory} --migrations-table-name ${knexMigrationTable}`;
  execSync(migrationCommand, {
    env: {
      ...process.env,
      TENANT_SCHEMA: schema,
      NODE_ENV: env,
    },
  });
  logger.debug(`Migrations run for command: ${migrationCommand}`);
}

export async function runMigrations({
  env,
  type,
  schema,
}: MigrationsMigrateArgs) {
  await db.raw(`CREATE SCHEMA IF NOT EXISTS "knex_migrations";`);
  const environmentConfig = knexConfig[env];
  if (!environmentConfig) {
    logger.error(`No knex configuration found for environment: ${env}`);
    return;
  }
  let migrationDirectoryPaths: string[];
  let schemasForMigration: string[];

  switch (type) {
    case "public":
      migrationDirectoryPaths = [
        path.join(commonConfig.migrations.directory, type),
        path.join(commonConfig.migrations.directory, "common"),
      ];
      schemasForMigration = ["public"];
      break;
    case "tenant":
      migrationDirectoryPaths = [
        path.join(commonConfig.migrations.directory, type),
        path.join(commonConfig.migrations.directory, "common"),
      ];
      schemasForMigration = schema ? [schema] : getTenantSchemaNames();
      break;
    case "common":
      migrationDirectoryPaths = [
        path.join(commonConfig.migrations.directory, "common"),
      ];
      schemasForMigration = ["public", ...getTenantSchemaNames()];
      break;
    default:
      logger.error(
        "Invalid type. The type must be one of 'public', 'tenant', or 'common'."
      );
      process.exit(1);
  }
  logger.debug("Running migrations for schemas:", schemasForMigration);
  logger.debug("Migration directories:", migrationDirectoryPaths);

  migrationDirectoryPaths.forEach((migrationDirectory) => {
    schemasForMigration.forEach((schema) => {
      runMigrationFor(env, schema, migrationDirectory);
    });
  });
}

logger.debug(argv);

if (require.main === module) {
  if (!argv._ || argv._.length === 0) {
    logger.error(
      "No command provided. Please provide a command. Use 'knexMigrate --help' for more information."
    );
    process.exit(1);
  }
  if (["development", "staging", "production"].indexOf(argv.env) === -1) {
    logger.error(
      "Invalid environment. The environment must be one of 'development', 'staging', or 'production'."
    );
    process.exit(1);
  }
  switch (argv._[0]) {
    case "make":
      if (argv._.length < 2) {
        logger.error(
          "Please provide a migration name. Use 'knexMigrate make --help' for more information."
        );
        process.exit(1);
      }
      generateMigrationScript({
        name: argv._[1],
        env: argv.env,
        schema: argv.schema,
        type: argv.type,
      }).then(() => db.destroy());
      break;
    case "migrate":
      // Run migrations
      runMigrations({
        env: argv.env,
        schema: argv.schema,
        type: argv.type,
      }).then(() => db.destroy());
      break;
    default:
      logger.error(
        "Invalid command. The command must be one of 'make' or 'migrate'."
      );
      break;
  }
}
