import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

export const sequelize = new Sequelize({
  dialect:  'mysql',
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  logging:  env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max:     10,
    min:     2,
    acquire: 30000,
    idle:    10000,
  },
  define: {
    underscored:   true,
    timestamps:    true,
    paranoid:      true,     // soft deletes
    freezeTableName: false,
  },
});

export async function connectDB(): Promise<void> {
  await sequelize.authenticate();
  logger.info(`MySQL connected — ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
}
