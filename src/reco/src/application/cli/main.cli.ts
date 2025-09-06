import 'dotenv/config';
// or:
// import dotenv from 'dotenv';
// dotenv.config();

import { CommandFactory } from 'nest-commander';
import * as path from 'path';
import * as fs from 'fs';
import { RecoCliConfig } from '../dtos/reco-cli-config.dto';
import { RecoModule } from '../../reco.module';

async function loadOptions(): Promise<RecoCliConfig> {
  const configPath =
    process.env.RECO_CLI_CONFIG ||
    path.join(process.cwd(), 'reco.cli.config.js');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Reco CLI config not found at: ${configPath}. Set RECO_CLI_CONFIG or create reco.cli.config.js`,
    );
  }

  const mod = await import(pathToFileUrl(configPath).toString()).catch(
    async () => await import(configPath),
  );
  return (mod.default || mod.options || mod) as RecoCliConfig;
}

function pathToFileUrl(p: string): URL {
  const absolute = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  return new URL('file://' + absolute);
}

async function bootstrap() {
  const options = await loadOptions();
  await CommandFactory.run(RecoModule.forRoot(options), ['error']);
}

bootstrap();
