import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { paginatedResponse } from '../common/pagination/paginated-result';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { IndexWorkOrdersDto } from './dto/index-work-orders.dto';
import { serializeWorkOrder } from './dto/work-order-response.dto';
import { WorkOrdersService } from './work-orders.service';

const EMPTY_LIST_MESSAGE = 'No work orders matched the given filters.';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Get()
  async index(@Query() query: IndexWorkOrdersDto) {
    const result = await this.workOrders.filter(query);
    return paginatedResponse(result, serializeWorkOrder, EMPTY_LIST_MESSAGE);
  }

  @UseGuards(ThrottlerGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async store(@Body() dto: CreateWorkOrderDto) {
    return { data: serializeWorkOrder(await this.workOrders.create(dto)) };
  }
}
