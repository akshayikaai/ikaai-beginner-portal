import { PrismaClient } from '@prisma/client';
import { SEED_USERS, SEED_PROGRAMMES, SEED_ENROLLMENTS } from '../src/lib/seed-data';

const prisma = new PrismaClient();

async function main() {
  // Production security guard as strictly specified
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: Seeding demo accounts with static passwords is strictly blocked in production environments.'
    );
  }

  console.log('🌱 Starting Ikaai Academy database seeding...');

  // 1. Seed Users
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash: user.passwordHash,
        tokenVersion: user.tokenVersion,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash: user.passwordHash,
        tokenVersion: user.tokenVersion,
      },
    });
  }
  console.log(`✅ Seeded ${SEED_USERS.length} demo users`);

  // 2. Seed Programmes, Modules, Resources, Quizzes, FAQs, and Exams
  for (const prog of SEED_PROGRAMMES) {
    await prisma.programme.upsert({
      where: { slug: prog.slug },
      update: {
        title: prog.title,
        tagline: prog.tagline,
        description: prog.description,
        colorTag: prog.colorTag,
        colorBgLight: prog.colorBgLight,
        colorTextLight: prog.colorTextLight,
      },
      create: {
        id: prog.id,
        slug: prog.slug,
        title: prog.title,
        tagline: prog.tagline,
        description: prog.description,
        colorTag: prog.colorTag,
        colorBgLight: prog.colorBgLight,
        colorTextLight: prog.colorTextLight,
      },
    });

    // Assign instructors
    for (const instId of prog.instructors) {
      await prisma.programmeInstructor.upsert({
        where: {
          programmeId_userId: {
            programmeId: prog.id,
            userId: instId,
          },
        },
        update: {},
        create: {
          programmeId: prog.id,
          userId: instId,
        },
      });
    }

    // Seed Written Exam if present
    if (prog.writtenExam) {
      const exam = await prisma.writtenExam.upsert({
        where: { programmeId: prog.id },
        update: {
          title: prog.writtenExam.title,
          instructions: prog.writtenExam.instructions,
          passingPercentage: prog.writtenExam.passingPercentage,
        },
        create: {
          id: prog.writtenExam.id,
          programmeId: prog.id,
          title: prog.writtenExam.title,
          instructions: prog.writtenExam.instructions,
          passingPercentage: prog.writtenExam.passingPercentage,
        },
      });

      for (const q of prog.writtenExam.questions) {
        await prisma.examQuestion.upsert({
          where: { id: q.id },
          update: {
            question: q.question,
            maxMarks: q.maxMarks,
            sortOrder: q.sortOrder,
          },
          create: {
            id: q.id,
            examId: exam.id,
            question: q.question,
            maxMarks: q.maxMarks,
            sortOrder: q.sortOrder,
          },
        });
      }
    }

    // Seed Modules
    for (const mod of prog.modules) {
      const moduleRecord = await prisma.module.upsert({
        where: { id: mod.id },
        update: {
          title: mod.title,
          description: mod.description,
          objectives: mod.objectives,
          sortOrder: mod.sortOrder,
        },
        create: {
          id: mod.id,
          programmeId: prog.id,
          title: mod.title,
          description: mod.description,
          objectives: mod.objectives,
          sortOrder: mod.sortOrder,
        },
      });

      // Resources
      for (const res of mod.resources) {
        await prisma.resource.upsert({
          where: { id: res.id },
          update: {
            title: res.title,
            type: res.type,
            url: res.url,
            readingTime: res.readingTime,
            summary: res.summary,
            contentHtml: res.contentHtml,
            sortOrder: res.sortOrder,
          },
          create: {
            id: res.id,
            moduleId: moduleRecord.id,
            title: res.title,
            type: res.type,
            url: res.url,
            readingTime: res.readingTime,
            summary: res.summary,
            contentHtml: res.contentHtml,
            sortOrder: res.sortOrder,
          },
        });
      }

      // Quiz
      if (mod.quiz) {
        const quizRecord = await prisma.quiz.upsert({
          where: { moduleId: moduleRecord.id },
          update: {
            title: mod.quiz.title,
            instructions: mod.quiz.instructions,
            passingScore: mod.quiz.passingScore,
          },
          create: {
            id: mod.quiz.id,
            moduleId: moduleRecord.id,
            title: mod.quiz.title,
            instructions: mod.quiz.instructions,
            passingScore: mod.quiz.passingScore,
          },
        });

        for (const q of mod.quiz.questions) {
          await prisma.quizQuestion.upsert({
            where: { id: q.id },
            update: {
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              sortOrder: q.sortOrder,
            },
            create: {
              id: q.id,
              quizId: quizRecord.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              sortOrder: q.sortOrder,
            },
          });
        }
      }

      // FAQs
      for (const faq of mod.faqs) {
        await prisma.fAQ.upsert({
          where: { id: faq.id },
          update: {
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          },
          create: {
            id: faq.id,
            moduleId: moduleRecord.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${SEED_PROGRAMMES.length} programmes with modules, quizzes, and FAQs`);

  // 3. Seed Enrolments and progress levels
  for (const enr of SEED_ENROLLMENTS) {
    await prisma.enrollment.upsert({
      where: {
        userId_programmeId: {
          userId: enr.userId,
          programmeId: enr.programmeId,
        },
      },
      update: {
        status: enr.status as any,
      },
      create: {
        userId: enr.userId,
        programmeId: enr.programmeId,
        status: enr.status as any,
      },
    });

    for (const resId of enr.completedResources) {
      await prisma.resourceProgress.upsert({
        where: {
          userId_resourceId: {
            userId: enr.userId,
            resourceId: resId,
          },
        },
        update: {
          completed: true,
          completedAt: new Date(),
          secondsSpent: 35,
        },
        create: {
          userId: enr.userId,
          resourceId: resId,
          completed: true,
          startedAt: new Date(Date.now() - 40000),
          completedAt: new Date(),
          secondsSpent: 35,
        },
      });
    }

    for (const qs of enr.quizScores) {
      await prisma.quizSubmission.upsert({
        where: {
          userId_quizId_attemptNo: {
            userId: enr.userId,
            quizId: qs.quizId,
            attemptNo: 1,
          },
        },
        update: {
          score: qs.score,
          total: qs.total,
          percentage: qs.percentage,
        },
        create: {
          userId: enr.userId,
          quizId: qs.quizId,
          score: qs.score,
          total: qs.total,
          percentage: qs.percentage,
          attemptNo: 1,
        },
      });
    }
  }
  console.log(`✅ Seeded ${SEED_ENROLLMENTS.length} learner enrolments and progress levels`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
