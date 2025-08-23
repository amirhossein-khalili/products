import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RecoService } from './reco.service';
import { Document } from 'mongoose';
import { IMetadata } from 'com.chargoon.cloud.svc.common';

@Controller()
export class RecoController<T extends Document> {
  constructor(private readonly recoService: RecoService<T>) {}

  @Get()
  public async findAll() {
    return this.recoService.findAllIds();
  }

  @Get(':id')
  public async findById(@Param('id') id: string) {
    return this.recoService.findById(id);
  }

  @Get('write/:id')
  public async findOneByIdFromWrite(
    @Param('id') id: string,
    @Query() meta: IMetadata,
  ) {
    try {
      return await this.recoService.findOneByIdFromWrite(id, meta);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_IMPLEMENTED);
    }
  }
}
