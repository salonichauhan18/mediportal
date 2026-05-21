import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('storage')
@Controller('storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate a signed URL for file upload (S3 Mock)' })
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    return this.storageService.getUploadUrl(fileName, fileType);
  }
}
