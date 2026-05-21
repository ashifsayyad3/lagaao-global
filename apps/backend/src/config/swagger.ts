import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Lagaao API',
      version: '1.0.0',
      description: 'REST API for Lagaao.com — AI-powered multi-category ecommerce & marketplace',
      contact: { name: 'Lagaao Team', email: 'dev@lagaao.com' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}/api/v1`, description: 'Local development' },
      { url: 'https://lagaao.com/api/v1',           description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (15 min). Obtain from POST /auth/login.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'httpOnly refresh token cookie (7 days).',
        },
      },
      schemas: {
        // ── Common ──────────────────────────────────────────────
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        PaginatedMeta: {
          type: 'object',
          properties: {
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            limit:      { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        // ── Auth ────────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Asif Sayyad' },
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, example: 'Secret@123' },
            phone:    { type: 'string', example: '9876543210' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:         { type: 'integer' },
                name:       { type: 'string' },
                email:      { type: 'string' },
                role:       { type: 'string', enum: ['customer','vendor','admin','super_admin'] },
                isVerified: { type: 'boolean' },
              },
            },
          },
        },
        // ── Product ─────────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            id:               { type: 'integer' },
            name:             { type: 'string' },
            slug:             { type: 'string' },
            basePrice:        { type: 'number' },
            salePrice:        { type: 'number', nullable: true },
            rating:           { type: 'number' },
            reviewCount:      { type: 'integer' },
            primaryImage:     { type: 'string', nullable: true },
            status:           { type: 'string', enum: ['draft','active','inactive','archived'] },
          },
        },
        // ── Order ───────────────────────────────────────────────
        Order: {
          type: 'object',
          properties: {
            id:           { type: 'integer' },
            orderNumber:  { type: 'string' },
            status:       { type: 'string' },
            total:        { type: 'number' },
            paymentStatus:{ type: 'string', enum: ['pending','paid','failed','refunded'] },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth',       description: 'Authentication & tokens' },
      { name: 'Users',      description: 'User profiles & addresses' },
      { name: 'Products',   description: 'Product catalog' },
      { name: 'Categories', description: 'Category hierarchy' },
      { name: 'Brands',     description: 'Brands' },
      { name: 'Search',     description: 'Full-text & AI search' },
      { name: 'Cart',       description: 'Shopping cart' },
      { name: 'Checkout',   description: 'Pricing & checkout' },
      { name: 'Orders',     description: 'Order management' },
      { name: 'Vendor',     description: 'Vendor / marketplace' },
      { name: 'CMS',        description: 'Banners, blog, announcements' },
      { name: 'AI',         description: 'Recommendations & AI chat' },
      { name: 'Analytics',  description: 'Admin analytics (protected)' },
    ],
  },
  // Pick up JSDoc @swagger annotations from all route files
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
