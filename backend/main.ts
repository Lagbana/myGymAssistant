import { NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { } from 'nest-morgan'

async function bootstrap() {
  const appOptions = { cors: true, logger: console, bodyParser: true }
  const app = await NestFactory.create(AppModule, appOptions);
  // app.setGlobalPrefix('api/v1')
  // app.useGlobalFilters(new NotFoundException())

  const options = new DocumentBuilder()
    .setTitle('MyGymAssistant')
    .setDescription('The myGymAssistant API description')
    .setVersion('1.0')
    .addTag('Api')
    .build();
  
  const document = SwaggerModule.createDocument(app, options,
  //   {
  //   operationIdFactory: (
  //     controllerKey: string,
  //     methodKey: string
  //   ) => methodKey
  // }
  );
  SwaggerModule.setup('/docs', app, document);

  await app.listen(3000);
}
bootstrap();
