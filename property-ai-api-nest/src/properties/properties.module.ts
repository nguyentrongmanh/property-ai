import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Building } from './entities/building.entity';
import { PropertySummaryCacheService } from './property-summary-cache.service';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { PropertiesService } from './properties.service';

@Module({
  imports: [TypeOrmModule.forFeature([Building]), AiModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository, PropertySummaryCacheService],
  exports: [PropertiesRepository, PropertySummaryCacheService],
})
export class PropertiesModule {}
