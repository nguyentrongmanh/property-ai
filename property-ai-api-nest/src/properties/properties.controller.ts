import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { paginatedResponse } from '../common/pagination/paginated-result';
import { CreatePropertyDto } from './dto/create-property.dto';
import { IndexPropertiesDto } from './dto/index-properties.dto';
import { serializeBuilding } from './dto/property-response.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

const EMPTY_LIST_MESSAGE = 'No properties matched the given filters.';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  async index(@Query() query: IndexPropertiesDto) {
    const result = await this.properties.filter(query);
    return paginatedResponse(result, serializeBuilding, EMPTY_LIST_MESSAGE);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async store(@Body() dto: CreatePropertyDto) {
    return { data: serializeBuilding(await this.properties.create(dto)) };
  }

  @Get('stats')
  async stats() {
    return { data: await this.properties.statsByCity() };
  }

  @UseGuards(ThrottlerGuard)
  @Get(':id/summary')
  async summary(@Param('id') id: string) {
    return {
      data: { property_id: id, summary: await this.properties.summary(id) },
    };
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    return { data: serializeBuilding(await this.properties.detail(id)) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return { data: serializeBuilding(await this.properties.update(id, dto)) };
  }
}
