import { Injectable } from '@nestjs/common';
import { BuildingSummaryInputDto } from '../dto/building-summary-input.dto';

@Injectable()
export class BuildingSummaryPromptBuilder {
  build(input: BuildingSummaryInputDto): string {
    const { building, openWorkOrders } = input;

    const facts = [
      ['Name', building.name],
      ['Type', building.type],
      ['Status', building.status],
      ['City', building.city],
      ['Units', building.units],
      ['Occupancy rate', building.occupancyRate],
      [
        'Amenities',
        building.amenities && building.amenities.length > 0
          ? building.amenities.join(', ')
          : null,
      ],
    ]
      .map(([label, value]) => `${label}: ${value ?? 'not recorded'}`)
      .join('\n');

    const workOrders =
      openWorkOrders.length === 0
        ? 'None'
        : openWorkOrders
            .map(
              (workOrder) =>
                `- [${workOrder.priority}] ${workOrder.title} (${workOrder.category})`,
            )
            .join('\n');

    return `You write short operational summaries for property managers.

Write a single paragraph (3-4 sentences, plain text, no markdown) summarising
the building below and its open maintenance work orders. Mention the overall
state of the building and call out the most urgent open issues first. If data
is marked "not recorded", do not invent it.

Building:
${facts}

Open work orders:
${workOrders}`;
  }
}
