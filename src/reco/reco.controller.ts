import { Controller, Get, Param } from '@nestjs/common';
import { RecoService } from './reco.service';
import { Document } from 'mongoose';

// دکوریتور @Controller() خالی می‌ماند چون مسیر به صورت داینامیک تنظیم می‌شود
@Controller()
export class RecoController<T extends Document> {
  // سرویس عمومی به کنترلر تزریق می‌شود
  constructor(private readonly recoService: RecoService<T>) {}

  @Get()
  public async findAll() {
    return this.recoService.findAllIds();
  }

  @Get(':id')
  public async findById(@Param('id') id: string) {
    return this.recoService.findById(id);
  }
}
