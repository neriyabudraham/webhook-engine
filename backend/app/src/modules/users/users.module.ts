import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UserController } from './users.controller'; // תוקן ליחיד
import { SourcesController } from './sources.controller';
import { DestinationsController } from './destinations.controller';
import { ApiKeysController } from './api-keys.controller';

@Module({
  controllers: [
    UserController, // תוקן ליחיד
    SourcesController, 
    DestinationsController,
    ApiKeysController 
  ],
  providers: [PrismaService],
  exports: [],
})
export class UsersModule {}
