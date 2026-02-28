import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Replace the line below with your actual string from Neon
    url: "postgresql://neondb_owner:npg_dto2LGpeHYg1@ep-patient-heart-a1u3bvx7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});