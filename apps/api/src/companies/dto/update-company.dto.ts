import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() companyType?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() bgUrl?: string;
}
