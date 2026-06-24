import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) { }

    @Post('applications')
    async create(@Body() createApplicationDto: CreateApplicationDto, @CurrentUser() user: JwtPayload) {
        if (user.role !== 'JOBSEEKER') {
            throw new ForbiddenException('Only jobseekers can apply for jobs');
        }
        return this.applicationsService.create(createApplicationDto, user.sub);
    }

    @Get('applications/employer/recent')
    async getRecentApplications(@CurrentUser() user: JwtPayload) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can view recent applications');
        }
        return this.applicationsService.findRecentForEmployer(user.sub);
    }

    @Get('applications/my-applications')
    async getMyApplications(@CurrentUser() user: JwtPayload) {
        if (user.role !== 'JOBSEEKER') {
            throw new ForbiddenException('Only jobseekers can view their applications');
        }
        return this.applicationsService.findMyApplications(user.sub);
    }

    @Get('applications/employer/interviews')
    async getEmployerInterviews(@CurrentUser() user: JwtPayload) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can view interviews');
        }
        return this.applicationsService.findInterviewsForEmployer(user.sub);
    }

    @Get('applications/employer/all')
    async getAllApplications(@Query('jobId') jobId: string, @CurrentUser() user: JwtPayload) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can view applications');
        }
        return this.applicationsService.findAllForEmployer(user.sub, jobId || undefined);
    }

    @Get('applications/:id')
    async getApplication(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can view application details');
        }

        const isOwner = await this.applicationsService.verifyApplicationOwnership(id, user.sub);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to view this application');
        }

        return this.applicationsService.findOne(id);
    }

    @Get('jobs/:jobId/applications')
    async getJobApplications(@Param('jobId') jobId: string, @CurrentUser() user: JwtPayload) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can view applications');
        }

        const userId = user.sub;

        // Ensure the employer owns the job
        const isOwner = await this.applicationsService.verifyJobOwnership(jobId, userId);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to view these applications');
        }

        return this.applicationsService.findByJobId(jobId);
    }

    @Patch('applications/:id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
        @CurrentUser() user: JwtPayload
    ) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can update applications');
        }

        const userId = user.sub;

        // Ensure the employer owns the application's job
        const isOwner = await this.applicationsService.verifyApplicationOwnership(id, userId);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to update this application');
        }

        return this.applicationsService.updateStatus(id, updateApplicationStatusDto.status);
    }

    @Patch('applications/:id/interview')
    async scheduleInterview(
        @Param('id') id: string,
        @Body() body: { interviewDate: string },
        @CurrentUser() user: JwtPayload
    ) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can schedule interviews');
        }

        const isOwner = await this.applicationsService.verifyApplicationOwnership(id, user.sub);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to update this application');
        }

        return this.applicationsService.scheduleInterview(id, new Date(body.interviewDate));
    }

    @Patch('applications/:id/cancel-interview')
    async cancelInterview(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload
    ) {
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only employers can cancel interviews');
        }

        const isOwner = await this.applicationsService.verifyApplicationOwnership(id, user.sub);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to update this application');
        }

        return this.applicationsService.cancelInterview(id);
    }
}
