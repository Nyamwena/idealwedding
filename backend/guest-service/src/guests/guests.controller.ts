import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGuestDto, UpdateGuestDto } from './dto/guest.dto';
import { GuestsService } from './guests.service';

@ApiTags('guests')
@Controller('guests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create guest entry' })
  @ApiResponse({ status: 201, description: 'Guest created' })
  async create(@Request() req, @Body() createGuestDto: CreateGuestDto) {
    const guest = await this.guestsService.create(req.user.id, createGuestDto);
    return { success: true, data: guest };
  }

  @Get()
  @ApiOperation({ summary: 'List guests by user' })
  async listByUser(@Request() req) {
    const guests = await this.guestsService.listByUser(req.user.id);
    return { success: true, data: guests };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update guest entry' })
  async update(@Request() req, @Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    const guest = await this.guestsService.update(req.user.id, id, updateGuestDto);
    return { success: true, data: guest };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete guest entry' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.guestsService.remove(req.user.id, id);
    return { success: true };
  }
}
