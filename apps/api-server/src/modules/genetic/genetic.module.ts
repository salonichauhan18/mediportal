import { Module } from '@nestjs/common';
import { GeneticService } from './genetic.service';
import { GeneticController } from './genetic.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GeneticService],
  controllers: [GeneticController],
  exports: [GeneticService],
})
export class GeneticModule {}
