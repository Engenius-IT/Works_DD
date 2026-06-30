import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // CORS
    /*app.enableCors({
        origin: process.env.NEXTAUTH_URL || [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3004'
        ],
        credentials: true,
    });*/
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3004',
            process.env.NEXTAUTH_URL,
        ].filter(Boolean) as string[],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization',
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Swagger API documentation
    const config = new DocumentBuilder()
        .setTitle('JobSabuy API')
        .setDescription('Job Board Platform API — หางาน สมัครงาน ง่ายๆ สบายๆ')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication')
        .addTag('jobs', 'Job Listings')
        .addTag('companies', 'Company Profiles')
        .addTag('users', 'User Management')
        .addTag('search', 'Job Search')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3001;
    if (process.env.NODE_ENV !== 'production') {
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 API is ready at: http://localhost:${port}/api/v1`);
    } else {
        await app.listen(port);
    }
}
bootstrap();
