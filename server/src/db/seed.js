// ==============================================================================
// JanSahay AI — Production Database Seeder
// Seeds PostgreSQL via Prisma ORM when available, and updates local fallback
// ==============================================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initialSeedData } from './seedData.js';
import { prisma, checkPrismaConnectivity } from './prismaClient.js';
import db from './database.js';

dotenv.config();

export const seedDatabase = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isPrismaUp = await checkPrismaConnectivity();

  console.log('==================================================================');
  console.log('🌱 JanSahay AI Database Seeder (Prisma ORM)');
  console.log(`   Engine:      ${isPrismaUp ? 'PostgreSQL 16 (via Prisma)' : 'Local JSON Fallback'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('==================================================================');

  // Generate random credentials for dev demo users if in development
  const demoCredentials = [];
  let seededUsers = [];
  let seededProfiles = [];

  if (!isProduction) {
    const rawDemoUsers = [
      { id: 1, name: 'Government Administrator', email: 'admin@jansahay.gov.in', role: 'ADMIN' },
      { id: 2, name: 'Rahul Patil', email: 'student@jansahay.ai', role: 'CITIZEN' },
      { id: 3, name: 'Ramesh Shinde', email: 'farmer@jansahay.ai', role: 'CITIZEN' },
      { id: 4, name: 'Priya Deshmukh', email: 'business@jansahay.ai', role: 'CITIZEN' }
    ];

    console.log('------------------------------------------------------------------');
    console.log('🔑 [DEV SEED] Generated Random Demo Credentials (NODE_ENV=development):');
    
    for (const u of rawDemoUsers) {
      const randomPassword = `Jan_${crypto.randomBytes(6).toString('hex')}`;
      const passwordHash = bcrypt.hashSync(randomPassword, 10);
      demoCredentials.push({ email: u.email, role: u.role, password: randomPassword });
      seededUsers.push({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        createdAt: new Date().toISOString()
      });
      console.log(`   • [${u.role.padEnd(7)}] ${u.email.padEnd(25)} -> Password: ${randomPassword}`);
    }
    console.log('   ⚠️  Zero demo accounts are created in production mode.');
    console.log('------------------------------------------------------------------');

    seededProfiles = initialSeedData.profiles || [];
  } else {
    console.log('🔒 [PROD SEED] Production mode active: Zero demo accounts seeded.');
  }

  // --- 1. Seed via Prisma if PostgreSQL is available ---
  if (isPrismaUp) {
    try {
      console.log('[Prisma] Seeding Users and Profiles...');
      for (const u of seededUsers) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: { name: u.name, role: u.role, passwordHash: u.passwordHash },
          create: {
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role
          }
        });
      }

      for (const p of seededProfiles) {
        await prisma.profile.upsert({
          where: { userId: p.userId },
          update: {
            category: p.category,
            state: p.state,
            district: p.district,
            occupation: p.occupation,
            incomeRange: p.incomeRange,
            educationLevel: p.educationLevel,
            course: p.course,
            currentYear: p.currentYear,
            instituteName: p.instituteName,
            farmingType: p.farmingType,
            cropActivity: p.cropActivity,
            landArea: p.landArea ? parseFloat(p.landArea) : null,
            landOwnership: p.landOwnership,
            businessType: p.businessType,
            businessStage: p.businessStage,
            msmeStatus: p.msmeStatus,
            businessDescription: p.businessDescription,
            profileComplete: p.profileComplete || false
          },
          create: {
            userId: p.userId,
            category: p.category,
            state: p.state,
            district: p.district,
            occupation: p.occupation,
            incomeRange: p.incomeRange,
            educationLevel: p.educationLevel,
            course: p.course,
            currentYear: p.currentYear,
            instituteName: p.instituteName,
            farmingType: p.farmingType,
            cropActivity: p.cropActivity,
            landArea: p.landArea ? parseFloat(p.landArea) : null,
            landOwnership: p.landOwnership,
            businessType: p.businessType,
            businessStage: p.businessStage,
            msmeStatus: p.msmeStatus,
            businessDescription: p.businessDescription,
            profileComplete: p.profileComplete || false
          }
        });
      }

      console.log(`[Prisma] Seeding ${initialSeedData.schemes?.length || 0} verified schemes & rules...`);
      for (const s of (initialSeedData.schemes || [])) {
        const createdScheme = await prisma.scheme.upsert({
          where: { id: s.id },
          update: {
            name: s.name,
            code: s.code || `SCHEME_${s.id}`,
            category: s.category || 'General',
            department: s.department || 'Government of India / State',
            governmentLevel: s.governmentLevel || s.level || 'CENTRAL',
            state: s.state || 'All India',
            targetBeneficiaries: s.targetBeneficiaries || s.targetAudience || 'Citizens',
            summary: s.summary || s.description?.slice(0, 200) || '',
            description: s.description || '',
            benefit: s.benefit || s.benefits || '',
            maxBenefitAmount: s.maxBenefitAmount ? parseFloat(s.maxBenefitAmount) : null,
            sourceUrl: s.sourceUrl || s.officialPortalUrl || s.applicationUrl || 'https://www.india.gov.in',
            applicationSteps: s.applicationSteps || [],
            requiredDocuments: s.requiredDocuments || [],
            lastVerifiedAt: s.lastVerifiedAt || '2026-03-01',
            active: s.active !== false,
            verificationStatus: s.verificationStatus || 'VERIFIED'
          },
          create: {
            id: s.id,
            name: s.name,
            code: s.code || `SCHEME_${s.id}`,
            category: s.category || 'General',
            department: s.department || 'Government of India / State',
            governmentLevel: s.governmentLevel || s.level || 'CENTRAL',
            state: s.state || 'All India',
            targetBeneficiaries: s.targetBeneficiaries || s.targetAudience || 'Citizens',
            summary: s.summary || s.description?.slice(0, 200) || '',
            description: s.description || '',
            benefit: s.benefit || s.benefits || '',
            maxBenefitAmount: s.maxBenefitAmount ? parseFloat(s.maxBenefitAmount) : null,
            sourceUrl: s.sourceUrl || s.officialPortalUrl || s.applicationUrl || 'https://www.india.gov.in',
            applicationSteps: s.applicationSteps || [],
            requiredDocuments: s.requiredDocuments || [],
            lastVerifiedAt: s.lastVerifiedAt || '2026-03-01',
            active: s.active !== false,
            verificationStatus: s.verificationStatus || 'VERIFIED'
          }
        });

        // Seed scheme rules if present
        if (s.eligibilityRules && Array.isArray(s.eligibilityRules)) {
          await prisma.schemeRule.deleteMany({ where: { schemeId: createdScheme.id } });
          for (const r of s.eligibilityRules) {
            await prisma.schemeRule.create({
              data: {
                schemeId: createdScheme.id,
                field: r.field || 'category',
                operator: r.operator || 'EQUALS',
                value: String(r.value || ''),
                description: r.description || '',
                required: r.required !== false && r.isMandatory !== false
              }
            });
          }
        }
      }

      console.log(`[Prisma] Seeding ${initialSeedData.documentGuides?.length || 0} document guides...`);
      for (const g of (initialSeedData.documentGuides || [])) {
        await prisma.documentGuide.upsert({
          where: { documentType: g.documentType },
          update: {
            title: g.title,
            simpleDescription: g.simpleDescription,
            applicableState: g.applicableState || 'Maharashtra',
            issuingAuthority: g.issuingAuthority,
            eligibilityOrPrerequisites: g.eligibilityOrPrerequisites || '',
            requiredSupportingDocuments: g.requiredSupportingDocuments || [],
            applicationSteps: g.applicationSteps || [],
            applicationMethod: g.applicationMethod || 'BOTH',
            officialApplicationUrl: g.officialApplicationUrl,
            officialInformationUrl: g.officialInformationUrl,
            possibleFees: g.possibleFees || '₹33.60',
            expectedProcessingTime: g.expectedProcessingTime || '15 working days',
            lastVerifiedAt: g.lastVerifiedAt || '2026-03-01',
            verificationStatus: g.verificationStatus || 'VERIFIED',
            publicationStatus: g.publicationStatus || 'PUBLISHED',
            additionalNotes: g.additionalNotes || null
          },
          create: {
            documentType: g.documentType,
            title: g.title,
            simpleDescription: g.simpleDescription,
            applicableState: g.applicableState || 'Maharashtra',
            issuingAuthority: g.issuingAuthority,
            eligibilityOrPrerequisites: g.eligibilityOrPrerequisites || '',
            requiredSupportingDocuments: g.requiredSupportingDocuments || [],
            applicationSteps: g.applicationSteps || [],
            applicationMethod: g.applicationMethod || 'BOTH',
            officialApplicationUrl: g.officialApplicationUrl,
            officialInformationUrl: g.officialInformationUrl,
            possibleFees: g.possibleFees || '₹33.60',
            expectedProcessingTime: g.expectedProcessingTime || '15 working days',
            lastVerifiedAt: g.lastVerifiedAt || '2026-03-01',
            verificationStatus: g.verificationStatus || 'VERIFIED',
            publicationStatus: g.publicationStatus || 'PUBLISHED',
            additionalNotes: g.additionalNotes || null
          }
        });
      }

      console.log(`[Prisma] Seeding ${initialSeedData.updates?.length || 0} policy updates...`);
      for (const u of (initialSeedData.updates || [])) {
        await prisma.policyUpdate.upsert({
          where: { id: u.id },
          update: {
            title: u.title,
            description: u.description,
            category: u.category,
            source: u.source,
            sourceUrl: u.sourceUrl || null,
            publishedDate: u.publishedDate || u.date || new Date().toISOString().split('T')[0],
            relevanceTags: u.relevanceTags || null,
            active: u.active !== false,
            isLive: u.isLive || false
          },
          create: {
            id: u.id,
            title: u.title,
            description: u.description,
            category: u.category,
            source: u.source,
            sourceUrl: u.sourceUrl || null,
            publishedDate: u.publishedDate || u.date || new Date().toISOString().split('T')[0],
            relevanceTags: u.relevanceTags || null,
            active: u.active !== false,
            isLive: u.isLive || false
          }
        });
      }

      console.log('✅ [Prisma] Seeding completed successfully.');
    } catch (prismaErr) {
      console.error('❌ [Prisma] Seeding error:', prismaErr.message);
    }
  }

  // --- 2. Seed Local Store for Offline / In-Memory Operation ---
  db.data.users = seededUsers;
  db.data.profiles = seededProfiles;
  db.data.schemes = initialSeedData.schemes || [];
  db.data.documentGuides = initialSeedData.documentGuides || [];
  db.data.updates = initialSeedData.updates || [];
  db.save();

  console.log(`✅ [Local DB] Seeded ${db.data.schemes.length} schemes, ${db.data.documentGuides.length} guides, ${db.data.updates.length} policy updates.`);
  return { success: true };
};

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}
