import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { AppModule } from '../../src/app.module';
import { AI_CLIENT } from '../../src/ai/clients/ai-client.interface';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { validationExceptionFactory } from '../../src/common/pipes/validation-exception-factory';
import { FakeAiClient } from '../support/fake-ai-client';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AI_CLIENT)
    .useClass(FakeAiClient)
    .compile();

  const app = moduleRef.createNestApplication();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  return app;
}
