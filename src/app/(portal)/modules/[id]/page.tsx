import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { ModuleView } from '@/components/module-view';

export default async function ModulePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1'; // Default to Priya Sharma in demo mode

  const programmes = await db.getProgrammes();
  let foundModule: any = null;
  let foundProgramme: any = null;
  let moduleIndex = 0;

  for (const p of programmes) {
    const idx = p.modules?.findIndex((m: any) => m.id === params.id);
    if (idx !== -1 && idx !== undefined) {
      foundModule = p.modules[idx];
      foundProgramme = p;
      moduleIndex = idx;
      break;
    }
  }

  if (!foundModule || !foundProgramme) {
    notFound();
  }

  // Gather user progress
  const completedResources: Record<string, boolean> = {};
  for (const res of foundModule.resources || []) {
    const isDone = localStore.resourceProgress.some(
      (rp) => rp.userId === userId && rp.resourceId === res.id && rp.completed
    );
    if (isDone) {
      completedResources[res.id] = true;
    }
  }

  let quizSubmission: { score: number; total: number; percentage: number } | null = null;
  if (foundModule.quiz) {
    const qs = localStore.quizSubmissions
      .filter((q) => q.userId === userId && q.quizId === foundModule.quiz.id)
      .sort((a, b) => b.attemptNo - a.attemptNo)[0];
    if (qs) {
      quizSubmission = {
        score: qs.score,
        total: qs.total,
        percentage: qs.percentage,
      };
    }
  }

  const readFaqs: Record<string, boolean> = {};
  if ((localStore as any).faqProgress) {
    for (const faq of foundModule.faqs || []) {
      if ((localStore as any).faqProgress.has(`${userId}:${faq.id}`)) {
        readFaqs[faq.id] = true;
      }
    }
  }

  // Sanitize quiz for learner: strip correctIndex from questions
  let safeQuiz = undefined;
  if (foundModule.quiz) {
    safeQuiz = {
      id: foundModule.quiz.id,
      title: foundModule.quiz.title,
      instructions: foundModule.quiz.instructions,
      passingScore: foundModule.quiz.passingScore,
      questions: foundModule.quiz.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    };
  }

  return (
    <ModuleView
      programme={{
        id: foundProgramme.id,
        slug: foundProgramme.slug,
        title: foundProgramme.title,
        description: foundProgramme.description,
        colorTag: foundProgramme.colorTag,
        modules: foundProgramme.modules.map((m: any) => ({
          id: m.id,
          title: m.title,
        })),
      }}
      moduleIndex={moduleIndex}
      currentModule={{
        id: foundModule.id,
        title: foundModule.title,
        description: foundModule.description,
        objectives: foundModule.objectives || [],
        resources: foundModule.resources || [],
        quiz: safeQuiz,
        faqs: foundModule.faqs || [],
      }}
      initialProgress={{
        completedResources,
        quizSubmission,
        readFaqs,
      }}
    />
  );
}
