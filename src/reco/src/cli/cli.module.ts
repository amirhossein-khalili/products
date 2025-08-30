import { Module } from '@nestjs/common';
import { RecoModule } from '../reco.module';
import { RecoCommand } from './reco-command';
import { ActionQuestion, NameQuestion } from './reco.questions';

@Module({
  imports: [RecoModule.forRoot()],
  providers: [RecoCommand, ActionQuestion, NameQuestion],
})
export class CliModule {}
