import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../drizzle';
import { users } from '../schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
    try {
        console.log('🔐 Seeding admin user...');

        const adminEmail = 'admin@qmath.se';
        const adminPassword = 'admin123456';

        // Check if admin already exists
        const existingAdmin = await db.query.users.findFirst({
            where: eq(users.email, adminEmail),
        });

        if (existingAdmin) {
            // Update existing user to admin role
            await db.update(users)
                .set({ role: 'admin' })
                .where(eq(users.email, adminEmail));
            console.log(`✅ Updated existing user ${adminEmail} to admin role`);
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await db.insert(users).values({
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin User',
                role: 'admin',
            });

            console.log(`✅ Created admin user: ${adminEmail}`);
        }

        console.log('\n📝 Admin credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('\n✨ Admin user ready!\n');
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
