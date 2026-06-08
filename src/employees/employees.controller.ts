import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { UseAuth } from '../auth/auth.decorator';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Funcionários')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registra um novo funcionário',
    description:
      'Cria o funcionário, seu endereço residencial e suas credenciais de acesso em uma única transação atômica.',
  })
  @ApiCreatedResponse({
    description: 'Funcionário cadastrado com sucesso.',
    type: Employee,
  })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.employeesService.create(createEmployeeDto);
    return new Employee(employee);
  }

  @ApiBearerAuth()
  @UseAuth()
  @Get()
  @ApiOperation({
    summary: 'Lista os funcionários com filtro de status.',
    description:
      'Retorna os funcionários permitindo filtrar por ativos, inativos ou todos através de query params.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filtragem por estado de registro. Padrão: active',
  })
  @ApiOkResponse({
    type: [Employee],
    description:
      'Listagem dos usuários corporativos devolvida de forma sanitizada.',
  })
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Employee[]> {
    const employees = await this.employeesService.findAll(status);
    return employees.map((employee) => new Employee(employee));
  }

  @ApiBearerAuth()
  @UseAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Busca um funcionário ativo por ID',
    description:
      'Busca os dados de perfil de um funcionário de forma restrita, retornando o CPF tratado dinamicamente no formato class-transformer.',
  })
  @ApiOkResponse({
    type: Employee,
    description: 'Usuário mapeado com sucesso.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID do funcionário',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const employee = await this.employeesService.findOne(id);
    return new Employee(employee);
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
    type: Employee,
    description: 'Modificações persistidas com sucesso.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID do funcionário',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employee = await this.employeesService.update(id, updateEmployeeDto);
    return new Employee(employee);
  }

  @ApiBearerAuth()
  @UseAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Desativa um funcionário (Soft Delete)',
    description:
      'Aplica a data de demissão, desativa as credenciais de login e invalida a sessão ativa no cache do Redis.',
  })
  @ApiOkResponse({
    description: 'Usuário removido das dependências ativas da plataforma.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID do funcionário.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.remove(id);
  }
}
