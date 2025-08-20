import { Body, Controller, Post } from '@nestjs/common';
import { RecoService } from './reco.service';

@Controller('reco')
export class RecoController {
  constructor(private readonly recoService: RecoService) {}

  @Post()
  public async reco(@Body() body) {
    const { id } = body;
    return await this.recoService.checkSingleId(id);
  }
}
