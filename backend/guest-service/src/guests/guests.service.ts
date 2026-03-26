import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGuestDto, UpdateGuestDto } from './dto/guest.dto';
import { Guest } from './entities/guest.entity';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async create(userId: string, createGuestDto: CreateGuestDto): Promise<Guest> {
    const guest = this.guestRepository.create({
      ...createGuestDto,
      userId,
    });
    return this.guestRepository.save(guest);
  }

  async listByUser(userId: string): Promise<Guest[]> {
    return this.guestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(userId: string, id: string, updateGuestDto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.guestRepository.findOne({ where: { id, userId } });
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }
    Object.assign(guest, updateGuestDto);
    return this.guestRepository.save(guest);
  }

  async remove(userId: string, id: string): Promise<void> {
    const guest = await this.guestRepository.findOne({ where: { id, userId } });
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }
    await this.guestRepository.remove(guest);
  }
}
