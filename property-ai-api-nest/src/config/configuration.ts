export interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  bcryptSaltRounds: number;
  propertySummaryCacheTtlSeconds: number;
  gemini: {
    apiKey: string;
    model: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  database: {
    url:
      process.env.DATABASE_URL ??
      'postgres://property_ai:property_ai@localhost:5432/property_ai',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  propertySummaryCacheTtlSeconds: parseInt(
    process.env.PROPERTY_SUMMARY_CACHE_TTL_SECONDS ?? '900',
    10,
  ),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  },
});
