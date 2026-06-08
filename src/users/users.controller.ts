import {
  Controller,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdatePasswordDto } from './dto/update.password.dto';
import { UseAuth } from '../auth/auth.decorator';
import { User } from './entities/user.entity';

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ToggleStatusDto } from './dto/toggle.status.dto';

@ApiTags('Credenciais de Usuários')
@ApiBearerAuth()
@UseAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera a senha de uma credencial',
    description:
      'Verifica se a nova senha não é igual à atual e atualiza o hash criptográfico no banco.',
  })
  @ApiOkResponse({
    description: 'Senha atualizada com sucesso.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID do usuário' })
  async updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(id, updatePasswordDto.newPassword);
    return { message: 'Senha atualizada com sucesso.' };
  }

  @Patch(':id/toggle-status')
  @ApiOperation({
    summary: 'Ativa ou bloqueia o login de um usuário',
    description:
      'Chaveia a flag isActive. Se a conta for desativada (false), a sessão correspondente no Redis é derrubada na hora.',
  })
  @ApiOkResponse({
    type: User,
    description: 'Status do usuário modificado com sucesso.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID do usuário alvo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', description: 'Novo estado da conta' },
      },
      required: ['isActive'],
    },
  })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Request() req,
    @Body() toggleStatusDto: ToggleStatusDto,
  ): Promise<User> {
    const currentUserId = req.user.sub;
    const updatedUser = await this.usersService.toggleStatus(
      targetId,
      currentUserId,
      toggleStatusDto.isActive,
    );
    return new User(updatedUser);
  }
}
