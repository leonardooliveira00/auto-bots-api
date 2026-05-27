import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UseAuth } from '../auth/auth.decorator';
import { User } from './entities/user.entity';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Funcionários / Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registra um novo funcionário',
    description:
      'Rota pública para cadastro inicial de administradores ou mecânicos. O CPF é higienizado na entrada, salvo mascarado (LGPD-Ready) e os dados de endereço são tratados em cascata.',
  })
  @ApiCreatedResponse({
    description:
      'Funcionário cadastrado com sucesso na base de dados corporativa.',
    type: User,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersService.create(createUserDto);
    return new User(user);
  }

  @ApiBearerAuth()
  @UseAuth()
  @Get()
  @ApiOperation({
    summary: 'Lista todos os funcionários cadastrados',
    description:
      'Exibe a listagem completa da equipe interna da oficina mecânica, aplicando ocultação reativa de hashes de segurança.',
  })
  @ApiOkResponse({
    type: [User],
    description:
      'Listagem dos usuários corporativos devolvida de forma sanitizada.',
  })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new User(user));
  }

  @ApiBearerAuth()
  @UseAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Busca um funcionário por ID',
    description:
      'Busca os dados de perfil de um funcionário de forma restrita, retornando o CPF tratado dinamicamente no formato class-transformer.',
  })
  @ApiOkResponse({ type: User, description: 'Usuário mapeado com sucesso.' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID do usuário corporativo',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return new User(user);
  }

  @ApiBearerAuth()
  @UseAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza o perfil do colaborador',
    description:
      'Permite alterar credenciais de contato ou dados residenciais do usuário cadastrado.',
  })
  @ApiOkResponse({
    type: User,
    description: 'Modificações persistidas com sucesso.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return new User(user);
  }

  @ApiBearerAuth()
  @UseAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Desativa/Exclui um funcionário',
    description:
      'Derruba o vínculo do colaborador no sistema para bloquear acessos futuros nas políticas de segurança.',
  })
  @ApiOkResponse({
    description: 'Usuário removido das dependências ativas da plataforma.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
