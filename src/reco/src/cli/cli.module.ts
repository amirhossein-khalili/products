import { Module } from '@nestjs/common';
import { ActionQuestion, NameQuestion } from './reco.questions';
import { CliReportGenerator } from './cli-report-generator.service';
import { RecoCommand } from './reco-command';
import { AppModule } from 'src/app.module';

@Module({
  imports: [AppModule],
  providers: [RecoCommand, ActionQuestion, NameQuestion, CliReportGenerator],
})
export class CliModule {}
