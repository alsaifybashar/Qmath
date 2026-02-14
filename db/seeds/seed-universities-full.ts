
import { db } from '../drizzle';
import { universities } from '../schema';
import { eq } from 'drizzle-orm';

const universitiesList = [
    "Blekinge Institute of Technology",
    "Chalmers University of Technology",
    "Dalarna University",
    "Halmstad University",
    "Johannelund School of Theology",
    "Jönköping University",
    "Karlstad University",
    "Karolinska Institutet",
    "Konstfack, University of Arts, Crafts and Design",
    "Kristianstad University",
    "KTH Royal Institute of Technology",
    "Linköping University",
    "Linnaeus University",
    "Luleå University of Technology",
    "Lund University",
    "Mälardalen University",
    "Malmö University",
    "Marie Cederschiöld University",
    "Mid Sweden University",
    "The Newman Institute",
    "Örebro University",
    "Royal College of Music",
    "Royal Institute of Art",
    "Södertörn University in Stockholm",
    "Sophiahemmet University",
    "Stockholm School of Economics",
    "Stockholm University",
    "Stockholm University of the Arts",
    "Swedish Defence University",
    "Swedish Red Cross University",
    "The Swedish School of Sport and Health Sciences",
    "Swedish University of Agricultural Sciences",
    "Umeå University",
    "University of Borås",
    "University College Stockholm",
    "University of Gävle",
    "University of Gothenburg",
    "University of Skövde",
    "University West",
    "Uppsala University"
];

async function seedUniversities() {
    console.log('🌱 Seeding specific universities...');

    for (const name of universitiesList) {
        const existing = await db.query.universities.findFirst({
            where: eq(universities.name, name)
        });

        if (!existing) {
            await db.insert(universities).values({
                name,
                country: 'Sweden'
            });
            console.log(`   ✓ Inserted: ${name}`);
        } else {
            console.log(`   • Skipped (exists): ${name}`);
        }
    }

    console.log('\n✅ University seeding complete!');
    process.exit(0);
}

seedUniversities().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
