import 'dotenv/config';
import { CommandFactory } from 'nest-commander';
import * as path from 'path';
import * as fs from 'fs';
import { RecoCliConfig } from '../dtos/reconciliation-cli-config.dto';
import { RecoModule } from '../../reconciliation.module';

/**
 * Loads the Reco CLI config from the environment variables or the default config file.
 * @returns The Reco CLI config.
 */
async function loadOptions(): Promise<RecoCliConfig> {
  const configPath =
    process.env.RECO_CLI_CONFIG ||
    path.join(process.cwd(), 'reconciliation.cli.config.js');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Reco CLI config not found at: ${configPath}. Set RECO_CLI_CONFIG or create reconciliation.cli.config.js`,
    );
  }

  const mod = await import(pathToFileUrl(configPath).toString()).catch(
    async () => await import(configPath),
  );
  return (mod.default || mod.options || mod) as RecoCliConfig;
}

/**
 * Converts a path to a file URL.
 * @param p The path to convert.
 * @returns The file URL.
 */
function pathToFileUrl(p: string): URL {
  const absolute = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  return new URL('file://' + absolute);
}

/**
 * Bootstraps the Reco CLI.
 */
async function bootstrap() {
  const options = await loadOptions();
  await CommandFactory.run(RecoModule.forRoot(options), ['error']);
}

bootstrap();
