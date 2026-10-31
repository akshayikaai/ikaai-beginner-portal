import bcrypt from 'bcryptjs';

export interface SeedUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  department: string;
  avatarUrl?: string;
  tokenVersion: number;
  isAnonymised?: boolean;
  anonymisedAt?: Date | null;
}

export interface SeedProgramme {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  colorTag: string;
  colorBgLight: string;
  colorTextLight: string;
  archivedAt?: Date | null;
  instructors: string[]; // User IDs
  modules: SeedModule[];
  writtenExam?: {
    id: string;
    title: string;
    instructions: string;
    passingPercentage: number;
    passingMarks?: number;
    questions: {
      id: string;
      question: string;
      maxMarks: number;
      sortOrder: number;
    }[];
  };
}

export interface SeedModule {
  id: string;
  programmeId: string;
  sortOrder: number;
  title: string;
  description: string;
  objectives: string[];
  resources: {
    id: string;
    title: string;
    type: 'PDF' | 'DOCUMENT' | 'IMAGE' | 'VIDEO';
    url: string;
    readingTime: number;
    summary?: string;
    contentHtml?: string;
    sortOrder: number;
  }[];
  quiz?: {
    id: string;
    title: string;
    instructions: string;
    passingScore: number;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      sortOrder: number;
    }[];
  };
  faqs: {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
  }[];
}

// Pre-computed bcrypt hash for password 'Admin@1234' / 'Instructor@1234' / 'Learner@1234'
// bcrypt.hashSync('Learner@1234', 10) etc.
const HASH_ADMIN = bcrypt.hashSync('Admin@1234', 10);
const HASH_INSTRUCTOR = bcrypt.hashSync('Instructor@1234', 10);
const HASH_LEARNER = bcrypt.hashSync('Learner@1234', 10);

export const SEED_USERS: SeedUser[] = [
  {
    id: 'user-admin-1',
    email: 'admin@ikaaiindia.in',
    passwordHash: HASH_ADMIN,
    name: 'Deepak Joshi',
    role: 'ADMIN',
    department: 'People & Operations',
    tokenVersion: 1,
  },
  {
    id: 'user-inst-1',
    email: 'instructor@ikaaiindia.in',
    passwordHash: HASH_INSTRUCTOR,
    name: 'Dr. Vikram Mehta',
    role: 'INSTRUCTOR',
    department: 'Research & Field Operations',
    tokenVersion: 1,
  },
  {
    id: 'user-inst-2',
    email: 'hr.instructor@ikaaiindia.in',
    passwordHash: HASH_INSTRUCTOR,
    name: 'Neha Kapoor',
    role: 'INSTRUCTOR',
    department: 'HR',
    tokenVersion: 1,
  },
  {
    id: 'user-learner-1',
    email: 'learner@ikaaiindia.in',
    passwordHash: HASH_LEARNER,
    name: 'Priya Sharma',
    role: 'LEARNER',
    department: 'Research',
    tokenVersion: 1,
  },
  {
    id: 'user-learner-2',
    email: 'analyst.learner@ikaaiindia.in',
    passwordHash: HASH_LEARNER,
    name: 'Rahul Verma',
    role: 'LEARNER',
    department: 'Data Analyst',
    tokenVersion: 1,
  },
  {
    id: 'user-learner-3',
    email: 'field.learner@ikaaiindia.in',
    passwordHash: HASH_LEARNER,
    name: 'Ananya Sen',
    role: 'LEARNER',
    department: 'Field Operations',
    tokenVersion: 1,
  },
  {
    id: 'user-learner-4',
    email: 'hr.learner@ikaaiindia.in',
    passwordHash: HASH_LEARNER,
    name: 'Sunita Rao',
    role: 'LEARNER',
    department: 'HR',
    tokenVersion: 1,
  },
];

export const SEED_PROGRAMMES: SeedProgramme[] = [
  {
    id: 'prog-research',
    slug: 'research',
    title: 'Research',
    tagline: 'Evidence-based inquiry from ground reality to policy briefs',
    description: 'This programme prepares research interns to support Ikaai’s monitoring, evaluation and market research projects, from field planning to final reporting for clients across India.',
    colorTag: '#00511E',
    colorBgLight: '#E1EFE4',
    colorTextLight: '#003D16',
    instructors: ['user-inst-1'],
    writtenExam: {
      id: 'exam-research',
      title: 'Research Written Evaluation',
      instructions: 'Answer all 3 questions in your own words. Your response will be reviewed by Dr. Vikram Mehta.',
      passingPercentage: 60,
      questions: [
        {
          id: 'ex-q-1',
          question: 'Explain the fundamental differences between a baseline, midline, and endline study in public development programmes.',
          maxMarks: 10,
          sortOrder: 1000,
        },
        {
          id: 'ex-q-2',
          question: 'Describe how you would design sampling protocols and obtain informed consent for a household survey in rural Bihar.',
          maxMarks: 10,
          sortOrder: 2000,
        },
        {
          id: 'ex-q-3',
          question: 'Given an evaluation dataset with missing gender disaggregation, draft a one-page insight brief highlighting key recommendations.',
          maxMarks: 10,
          sortOrder: 3000,
        },
      ],
    },
    modules: [
      {
        id: 'mod-res-0',
        programmeId: 'prog-research',
        sortOrder: 1000,
        title: 'Onboarding & Digital Workspace',
        description: 'Set up your accounts and learn data-security rules before you start field engagements.',
        objectives: [
          'Set up your Ikaai secure email and shared cloud repository',
          'Comply with data protection protocols for survey data collection',
          'Know institutional reporting lines and team contacts',
        ],
        resources: [
          {
            id: 'res-res-0-1',
            title: 'New Joiner Checklist',
            type: 'DOCUMENT',
            url: '/docs/new-joiner-checklist.pdf',
            readingTime: 30,
            summary: 'Institutional onboarding checklist for equipment, software, and compliance.',
            contentHtml: '<div class="space-y-4"><h3>New Joiner Checklist</h3><p>Welcome to Ikaai India Research. Please verify you have completed:</p><ul class="list-disc pl-5"><li>Official workspace email configured with 2FA</li><li>Access to Google Drive / OneDrive institutional folders</li><li>Data security confidentiality agreement signed</li></ul></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-res-0-2',
            title: 'Welcome to Ikaai Handbook',
            type: 'PDF',
            url: '/docs/welcome-handbook.pdf',
            readingTime: 30,
            summary: 'Comprehensive guide to Ikaai values, structure, and expectations.',
            contentHtml: '<div class="space-y-4"><h3>Welcome to Ikaai</h3><p>Research begins with listening. As an onboarding intern, you bridge ground reality and boardroom decisions.</p></div>',
            sortOrder: 2000,
          },
          {
            id: 'res-res-0-3',
            title: 'Weekly Report Template',
            type: 'DOCUMENT',
            url: '/docs/weekly-report-template.docx',
            readingTime: 30,
            summary: 'Standard weekly milestone logging template for team review.',
            contentHtml: '<div class="space-y-4"><h3>Weekly Reporting Framework</h3><p>Submit weekly progress every Friday by 5:00 PM IST.</p></div>',
            sortOrder: 3000,
          },
        ],
        quiz: {
          id: 'quiz-res-0',
          title: 'Workspace & Security Essentials',
          instructions: 'Single attempt quiz. Test your understanding of data security.',
          passingScore: 70,
          questions: [
            {
              id: 'q-res-0-1',
              question: 'Where is raw survey data collected during field research strictly stored?',
              options: ['Personal Google Drive', 'Ikaai secure encrypted shared drive', 'WhatsApp team group', 'Local device storage indefinitely'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-res-0-2',
              question: 'When presenting research findings to external stakeholders, respondent names must be…',
              options: ['Published with contact details', 'Shared upon request', 'Fully anonymised', 'Included in executive summaries'],
              correctIndex: 2,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-res-0-1',
            question: 'Who do I contact for server or tool access?',
            answer: 'Use the Message Instructor action in the portal. Credentials are dispatched within one working day.',
            sortOrder: 1000,
          },
          {
            id: 'faq-res-0-2',
            question: 'Can I use personal hardware for field surveys?',
            answer: 'Yes, provided the institutional survey application is loaded and device-level full disk encryption is verified.',
            sortOrder: 2000,
          },
        ],
      },
      {
        id: 'mod-res-1',
        programmeId: 'prog-research',
        sortOrder: 2000,
        title: 'Company Overview & Culture',
        description: 'Who we are, what we do, and how we work from the ground to the boardroom.',
        objectives: [
          'Understand Ikaai’s core advisory practice lines',
          'Learn the national development frameworks we support (SDGs, Viksit Bharat)',
          'Embrace evidence-first institutional values',
        ],
        resources: [
          {
            id: 'res-res-1-1',
            title: 'Our Journey & Milestones',
            type: 'PDF',
            url: '/docs/journey-milestones.pdf',
            readingTime: 30,
            summary: 'The founding story of Ikaai India Research and DDA empanelment.',
            contentHtml: '<div><h3>Our Story</h3><p>Founded in 2023, Ikaai India has completed 20+ large-scale studies spanning 1.25L+ respondents.</p></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-res-1-2',
            title: 'Solutions & Advisory Overview',
            type: 'PDF',
            url: '/docs/solutions-overview.pdf',
            readingTime: 30,
            summary: 'Guide to our 7 core solution pillars.',
            contentHtml: '<div><h3>Seven Core Domains</h3><p>Monitoring & Evaluation, Market Research, CSR Advisory, Government Policy, Capacity Building, Field Manpower, and Data Analytics.</p></div>',
            sortOrder: 2000,
          },
        ],
        quiz: {
          id: 'quiz-res-1',
          title: 'Ikaai Culture & Services Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-res-1-1',
              question: 'Ikaai’s guiding ethos emphasizes transforming insights…',
              options: ['From ground to the boardroom', 'From cities to rural villages only', 'From academic papers to textbooks', 'From surveys to marketing'],
              correctIndex: 0,
              sortOrder: 1000,
            },
            {
              id: 'q-res-1-2',
              question: 'Which international quality management certification is held by Ikaai India?',
              options: ['ISO 14001:2015', 'ISO 9001:2015', 'CMMI Level 5', 'ISO 27001 only'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-res-1-1',
            question: 'What does a typical work cycle look like?',
            answer: 'Field survey planning on Monday, data operations midweek, and cohort review every Friday afternoon.',
            sortOrder: 1000,
          },
        ],
      },
      {
        id: 'mod-res-2',
        programmeId: 'prog-research',
        sortOrder: 3000,
        title: 'Monitoring & Evaluation Basics',
        description: 'Results frameworks, theory of change, and baseline/endline methodologies.',
        objectives: [
          'Distinguish output, outcome, and impact metrics',
          'Read and draft a Results Framework',
          'Formulate evaluation research questions',
        ],
        resources: [
          {
            id: 'res-res-2-1',
            title: 'M&E Primer for Impact Assessment',
            type: 'PDF',
            url: '/docs/me-primer.pdf',
            readingTime: 30,
            summary: 'Comprehensive methodology for independent third-party evaluations.',
            contentHtml: '<div><h3>Theory of Change</h3><p>Tracing inputs -> activities -> outputs -> outcomes -> sustainable impact.</p></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-res-2-2',
            title: 'Results Framework Template',
            type: 'DOCUMENT',
            url: '/docs/results-framework-template.docx',
            readingTime: 30,
            summary: 'Logical framework matrix used across government advisory contracts.',
            contentHtml: '<div><h3>LogFrame Matrix</h3><p>Indicators, Baselines, Targets, and Sources of Verification.</p></div>',
            sortOrder: 2000,
          },
        ],
        quiz: {
          id: 'quiz-res-2',
          title: 'M&E Concepts Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-res-2-1',
              question: 'A baseline evaluation study is conducted…',
              options: ['After programme culmination', 'Before programme implementation commences', 'During mid-term review only', 'Never in development projects'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-res-2-2',
              question: 'What distinguishes third-party evaluation from internal monitoring?',
              options: ['Higher cost only', 'Independent objective assessment by an external entity', 'Shorter duration', 'Lack of field data'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-res-2-1',
            question: 'What is a counterfactual in evaluation?',
            answer: 'A counterfactual estimates what would have happened to beneficiaries in the absence of the intervention.',
            sortOrder: 1000,
          },
        ],
      },
      {
        id: 'mod-res-3',
        programmeId: 'prog-research',
        sortOrder: 4000,
        title: 'Field Data Collection & Ethics',
        description: 'Sampling, tablet survey instruments, consent, and field quality checks.',
        objectives: [
          'Apply random and stratified sampling in field conditions',
          'Administer tablet-based CAPI tools with offline sync',
          'Enforce strict informed consent and child-safety protocols',
        ],
        resources: [
          {
            id: 'res-res-3-1',
            title: 'Field Operations Manual',
            type: 'PDF',
            url: '/docs/field-manual.pdf',
            readingTime: 30,
            summary: 'Field surveyor handbook for household and institutional questionnaires.',
            contentHtml: '<div><h3>Field Ethics</h3><p>Informed consent must precede any interview. Respect respondent time and voluntary participation.</p></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-res-3-2',
            title: 'Questionnaire Design Guide',
            type: 'PDF',
            url: '/docs/questionnaire-guide.pdf',
            readingTime: 30,
            summary: 'Best practices for skip logic, Likert scales, and translation validation.',
            contentHtml: '<div><h3>Questionnaire Design</h3><p>Eliminate double-barreled and leading questions.</p></div>',
            sortOrder: 2000,
          },
        ],
        quiz: {
          id: 'quiz-res-3',
          title: 'Field Ethics & Protocols Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-res-3-1',
              question: 'If a sampled respondent refuses to participate in a survey, what is the protocol?',
              options: ['Coerce them to cooperate', 'Politely thank them, record the non-response code, and move to next sampled unit', 'Offer monetary incentives', 'Fabricate the responses'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-res-3-2',
              question: 'Tablet CAPI surveys can operate without an active internet connection.',
              options: ['True (collect offline, sync when connected)', 'False (requires uninterrupted 4G/5G)'],
              correctIndex: 0,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-res-3-1',
            question: 'How do we handle poor mobile connectivity in remote hamlets?',
            answer: 'Survey instruments store data locally on encrypted device storage and push to server once network connectivity is re-established.',
            sortOrder: 1000,
          },
        ],
      },
      {
        id: 'mod-res-4',
        programmeId: 'prog-research',
        sortOrder: 5000,
        title: 'Data Analysis & Insight Briefs',
        description: 'Clean survey data, identify patterns, and deliver executive recommendations.',
        objectives: [
          'Clean raw datasets and spot survey anomalies',
          'Build clear visual charts for institutional decision-makers',
          'Write a concise, evidence-driven executive brief',
        ],
        resources: [
          {
            id: 'res-res-4-1',
            title: 'Data Cleaning Guide',
            type: 'PDF',
            url: '/docs/data-cleaning-guide.pdf',
            readingTime: 30,
            summary: 'Handling outliers, duplicates, and missing values.',
            contentHtml: '<div><h3>Data Cleaning Standard</h3><p>Always preserve raw immutable survey files before performing validation transforms.</p></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-res-4-2',
            title: 'Executive Brief Writing Style Guide',
            type: 'DOCUMENT',
            url: '/docs/style-guide.docx',
            readingTime: 30,
            summary: 'Ikaai editorial voice, brevity, and policy recommendations.',
            contentHtml: '<div><h3>Editorial Style</h3><p>Lead with findings, ground recommendations in statistical confidence, avoid jargon.</p></div>',
            sortOrder: 2000,
          },
        ],
        quiz: {
          id: 'quiz-res-4',
          title: 'Data Reporting Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-res-4-1',
              question: 'Data cleaning must take place…',
              options: ['After client submission', 'Before any analytical synthesis or modeling', 'Only if the client requests it', 'Never'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-res-4-2',
              question: 'An institutional policy insight brief should be…',
              options: ['A 100-page complex academic thesis', 'Concise, actionable, and grounded in ground-level evidence', 'Only mathematical formulae', 'Purely subjective opinions'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-res-4-1',
            question: 'What tools are standardized for analysis at Ikaai?',
            answer: 'We utilize Python, R, SPSS, and automated modern dashboards depending on project scale.',
            sortOrder: 1000,
          },
        ],
      },
    ],
  },
  {
    id: 'prog-analyst',
    slug: 'data-analyst',
    title: 'Data Analyst',
    tagline: 'Transforming field data into statistical rigor and dashboards',
    description: 'Specialized track for data interns focusing on survey validation, advanced Excel/R workflows, automated dashboards, and quantitative triangulation.',
    colorTag: '#0B7285',
    colorBgLight: '#E6FCF5',
    colorTextLight: '#0C5A69',
    instructors: ['user-inst-1'],
    writtenExam: {
      id: 'exam-analyst',
      title: 'Data Analyst Practical Exam',
      instructions: 'Submit your analytical rationale for statistical triangulation and dashboard design.',
      passingPercentage: 60,
      questions: [
        {
          id: 'ex-q-an-1',
          question: 'Explain how you test for interviewer fabrication and outlier clustering in large-scale survey datasets.',
          maxMarks: 10,
          sortOrder: 1000,
        },
        {
          id: 'ex-q-an-2',
          question: 'Walk through your data-cleaning pipeline for merging multiple rounds of rural livelihood panel data.',
          maxMarks: 10,
          sortOrder: 2000,
        },
      ],
    },
    modules: [
      {
        id: 'mod-an-0',
        programmeId: 'prog-analyst',
        sortOrder: 1000,
        title: 'Survey Data Cleaning & Quality Audits',
        description: 'Validation scripts, range checks, skip logic verification, and GPS triangulation.',
        objectives: [
          'Run automated sanity checks on incoming CAPI surveys',
          'Detect speeder respondents and geo-location clusters',
          'Document data cleaning audit trails',
        ],
        resources: [
          {
            id: 'res-an-0-1',
            title: 'Data Quality Audit Checklist',
            type: 'DOCUMENT',
            url: '/docs/quality-audit.docx',
            readingTime: 30,
            summary: 'Step-by-step checklist for verifying raw survey feeds.',
            contentHtml: '<div><h3>Data Quality Checklist</h3><p>Verify timestamps, GPS precision radius, and missing value codes.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-an-0',
          title: 'Quality Audits Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-an-0-1',
              question: 'A survey duration recorded as 90 seconds for a 60-question survey indicates…',
              options: ['High surveyor competence', 'Likely surveyor fabrication or speeder interview', 'Optimal respondent engagement', 'Valid survey'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-an-0-2',
              question: 'Why must original survey timestamps never be edited?',
              options: ['They are legally locked', 'To maintain audit reproducibility and tamper detection', 'Because spreadsheets do not allow it', 'No reason'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-an-0-1',
            question: 'What is the benchmark threshold for GPS accuracy?',
            answer: 'GPS accuracy under 15 meters is acceptable for rural household surveys.',
            sortOrder: 1000,
          },
        ],
      },
      {
        id: 'mod-an-1',
        programmeId: 'prog-analyst',
        sortOrder: 2000,
        title: 'Statistical Modeling & SPSS/R Workflows',
        description: 'Regression analysis, cross-tabulations, and hypothesis testing.',
        objectives: ['Perform weighted cross-tabulations', 'Test statistical significance', 'Interpret p-values accurately'],
        resources: [
          {
            id: 'res-an-1-1',
            title: 'SPSS Analysis Guide for Development Projects',
            type: 'PDF',
            url: '/docs/spss-guide.pdf',
            readingTime: 30,
            summary: 'Reference manual for social research statistics.',
            contentHtml: '<div><h3>SPSS Methodology</h3><p>Confidence intervals, Chi-square tests, and multivariate regressions.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-an-1',
          title: 'Statistical Testing Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-an-1-1',
              question: 'A p-value less than 0.05 generally indicates…',
              options: ['The null hypothesis is proven', 'Statistically significant evidence against the null hypothesis', 'Survey was biased', 'Sample size was too small'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-an-1-2',
              question: 'Survey weights are applied to…',
              options: ['Make data look better', 'Correct for disproportionate sampling and restore population representativeness', 'Reduce calculation time', 'Remove outliers'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-an-2',
        programmeId: 'prog-analyst',
        sortOrder: 3000,
        title: 'Analytical Dashboards & Visualizations',
        description: 'Building interactive maps, charts, and client-facing monitoring cockpits.',
        objectives: ['Create interactive choropleth maps', 'Design KPI summary cards', 'Avoid deceptive charting practices'],
        resources: [
          {
            id: 'res-an-2-1',
            title: 'Dashboard Design Best Practices',
            type: 'PDF',
            url: '/docs/dashboard-guide.pdf',
            readingTime: 30,
            summary: 'UI principles for institutional monitoring portals.',
            contentHtml: '<div><h3>Dashboard Principles</h3><p>High data-to-ink ratio, accessible color palettes, responsive layouts.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-an-2',
          title: 'Visualization Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-an-2-1',
              question: 'Which chart type is best for showing district-wise geographic distribution of indicators?',
              options: ['Pie chart', 'Choropleth map', 'Donut chart', 'Radar chart'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-an-2-2',
              question: 'Color palettes in data dashboards must always…',
              options: ['Use as many bright rainbow colors as possible', 'Be accessible and maintain contrast for color-blind users', 'Be purely monochrome', 'Rotate continuously'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-an-3',
        programmeId: 'prog-analyst',
        sortOrder: 4000,
        title: 'Triangulation & Reporting Rigor',
        description: 'Synthesizing qualitative observations with quantitative survey findings.',
        objectives: ['Triangulate survey findings with FGD transcripts', 'Write data documentation and codebooks', 'Prepare client deliverable packages'],
        resources: [
          {
            id: 'res-an-3-1',
            title: 'Data Triangulation Handbook',
            type: 'PDF',
            url: '/docs/triangulation-handbook.pdf',
            readingTime: 30,
            summary: 'Validating survey trends with qualitative focus group evidence.',
            contentHtml: '<div><h3>Triangulation Method</h3><p>Cross-validating findings across multiple independent data streams.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-an-3',
          title: 'Triangulation Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-an-3-1',
              question: 'What is triangulation in social science research?',
              options: ['Geometric surveying', 'Using multiple methods or data sources to develop a comprehensive understanding', 'Repeating the same survey 3 times', 'Drawing triangles on maps'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-an-3-2',
              question: 'A codebook provides…',
              options: ['Secret codes for encrypted folders', 'A comprehensive description of every variable, question text, and value labels', 'Software license keys', 'A list of employees'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
    ],
  },
  {
    id: 'prog-hr',
    slug: 'hr',
    title: 'HR',
    tagline: 'People, institutional culture, and field team empowerment',
    description: 'Human Resources and Operations onboarding track covering talent acquisition for field operations, labor compliance, payroll logistics, and appraisal systems.',
    colorTag: '#7C3AED',
    colorBgLight: '#F5F3FF',
    colorTextLight: '#5B21B6',
    instructors: ['user-inst-2'],
    writtenExam: {
      id: 'exam-hr',
      title: 'HR & People Operations Exam',
      instructions: 'Case study evaluation for recruitment and compliance management.',
      passingPercentage: 60,
      questions: [
        {
          id: 'ex-q-hr-1',
          question: 'Outline an emergency response protocol for supporting a field survey team stationed in a remote flood-affected district.',
          maxMarks: 10,
          sortOrder: 1000,
        },
        {
          id: 'ex-q-hr-2',
          question: 'Draft a short candidate shortlisting and induction plan for 50 local enumerators in Uttar Pradesh.',
          maxMarks: 10,
          sortOrder: 2000,
        },
      ],
    },
    modules: [
      {
        id: 'mod-hr-0',
        programmeId: 'prog-hr',
        sortOrder: 1000,
        title: 'Onboarding & Code of Conduct',
        description: 'Workplace policies, POSH compliance, ethics, and mutual respect.',
        objectives: ['Understand POSH and workplace safety policies', 'Review attendance and leave guidelines', 'Execute onboarding paperwork'],
        resources: [
          {
            id: 'res-hr-0-1',
            title: 'Ikaai Code of Conduct & POSH Policy',
            type: 'PDF',
            url: '/docs/code-of-conduct.pdf',
            readingTime: 30,
            summary: 'Institutional ethical guidelines and grievance channels.',
            contentHtml: '<div><h3>Code of Conduct</h3><p>Zero tolerance for harassment, discrimination, or ethical violations.</p></div>',
            sortOrder: 1000,
          },
          {
            id: 'res-hr-0-2',
            title: 'Candidate Shortlisting Email Templates',
            type: 'DOCUMENT',
            url: '/docs/shortlisting-templates.docx',
            readingTime: 30,
            summary: 'Standardized communication templates for intern and field hires.',
            contentHtml: '<div><h3>Email Communication Standards</h3><p>Professional, empathetic, and prompt recruitment communications.</p></div>',
            sortOrder: 2000,
          },
        ],
        quiz: {
          id: 'quiz-hr-0',
          title: 'Code of Conduct Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-hr-0-1',
              question: 'Workplace ethics and POSH guidelines apply to…',
              options: ['Permanent office staff only', 'All team members, interns, consultants, and field personnel', 'Contractors only', 'Senior management only'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-hr-0-2',
              question: 'Who should an intern contact first regarding workplace concerns?',
              options: ['Social media', 'Internal Complaints Committee or HR Team Lead', 'Local police immediately', 'Nobody'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [
          {
            id: 'faq-hr-0-1',
            question: 'What is the leave policy for research interns?',
            answer: 'Interns are entitled to 1.5 days of planned leave per month, pre-approved by their assigned Team Lead.',
            sortOrder: 1000,
          },
        ],
      },
      {
        id: 'mod-hr-1',
        programmeId: 'prog-hr',
        sortOrder: 2000,
        title: 'Talent Acquisition in the Impact Sector',
        description: 'Sourcing, screening, and onboarding mission-driven researchers and analysts.',
        objectives: ['Draft job descriptions for research interns', 'Screen candidates for analytical capability', 'Conduct structured interviews'],
        resources: [
          {
            id: 'res-hr-1-1',
            title: 'Recruitment Playbook for Research Roles',
            type: 'PDF',
            url: '/docs/recruitment-playbook.pdf',
            readingTime: 30,
            summary: 'Frameworks for selecting high-performing interns.',
            contentHtml: '<div><h3>Recruitment Playbook</h3><p>Assessing critical thinking, field readiness, and intellectual curiosity.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-hr-1',
          title: 'Recruitment Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-hr-1-1',
              question: 'A key qualification for field research candidates is…',
              options: ['High typing speed only', 'Fluency in local language and empathy with community respondents', 'Owning a car', 'Living in New Delhi only'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-hr-1-2',
              question: 'Structured interview rubrics help to…',
              options: ['Eliminate unconscious bias and ensure fair evaluation', 'Make interviews longer', 'Confuse candidates', 'Avoid taking notes'],
              correctIndex: 0,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-hr-2',
        programmeId: 'prog-hr',
        sortOrder: 3000,
        title: 'Field Staff Payroll & Logistics',
        description: 'Daily allowances, travel claims, and transparent honorarium disbursements.',
        objectives: ['Process field travel allowance claims', 'Audit expense receipts', 'Manage payment batches'],
        resources: [
          {
            id: 'res-hr-2-1',
            title: 'Field Travel & Allowance Policy',
            type: 'PDF',
            url: '/docs/travel-policy.pdf',
            readingTime: 30,
            summary: 'Rules for per diem, lodging, and local transit.',
            contentHtml: '<div><h3>Per Diem Rules</h3><p>Daily allowances cover local transit and meal expenses during verified fieldwork.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-hr-2',
          title: 'Field Logistics Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-hr-2-1',
              question: 'When should field travel expense reports be submitted?',
              options: ['At the end of the year', 'Within 5 business days of returning from the field with valid receipts', 'Never', 'Before travel starts'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-hr-2-2',
              question: 'Field surveyor daily allowances are disbursed based on…',
              options: ['Estimated days', 'Verified attendance and survey completion sync logs', 'Surveyor self-report alone', 'Fixed monthly salary only'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-hr-3',
        programmeId: 'prog-hr',
        sortOrder: 4000,
        title: 'People Development & Appraisals',
        description: 'Quarterly reviews, mentorship, and full-time transition pathways.',
        objectives: ['Conduct constructive evaluation reviews', 'Set SMART learning goals', 'Evaluate intern conversion criteria'],
        resources: [
          {
            id: 'res-hr-3-1',
            title: 'Performance Review Framework',
            type: 'DOCUMENT',
            url: '/docs/performance-review.docx',
            readingTime: 30,
            summary: 'Evaluation rubric for research and analyst interns.',
            contentHtml: '<div><h3>Appraisal Framework</h3><p>Assessing analytical rigor, teamwork, punctuality, and client communication.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-hr-3',
          title: 'Appraisal Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-hr-3-1',
              question: 'Constructive appraisal feedback should be…',
              options: ['Vague and informal', 'Specific, actionable, timely, and supportive of growth', 'Given only upon contract end', 'Delivered publicly'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-hr-3-2',
              question: 'Interns eligible for full-time research associate offers must demonstrate…',
              options: ['High marks only', 'Consistently high quality of work, ownership, and cultural alignment', '100% attendance only', 'Seniority'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
    ],
  },
  {
    id: 'prog-field',
    slug: 'field-operations',
    title: 'Field Operations',
    tagline: 'Executing high-integrity ground surveys across rural & urban Bharat',
    description: 'Practical grounding for field leads and supervisors managing multi-state survey deployments, household sampling, investigator training, and data synchronization.',
    colorTag: '#B45309',
    colorBgLight: '#FEF3C7',
    colorTextLight: '#78350F',
    instructors: ['user-inst-1'],
    writtenExam: {
      id: 'exam-field',
      title: 'Field Operations Operational Exam',
      instructions: 'Field scenario problem solving for team supervisors.',
      passingPercentage: 60,
      questions: [
        {
          id: 'ex-q-fd-1',
          question: 'Describe your protocol for dealing with local community gatekeeper suspicion or non-cooperation when conducting baseline studies.',
          maxMarks: 10,
          sortOrder: 1000,
        },
        {
          id: 'ex-q-fd-2',
          question: 'How do you coordinate daily back-check surveys to detect surveyor fraud or misreporting?',
          maxMarks: 10,
          sortOrder: 2000,
        },
      ],
    },
    modules: [
      {
        id: 'mod-fd-0',
        programmeId: 'prog-field',
        sortOrder: 1000,
        title: 'Household Sampling Techniques',
        description: 'Random walk method, village listing, household selection, and replacement rules.',
        objectives: ['Execute right-hand rule random walk sampling', 'Perform household listing and interval sampling', 'Properly handle locked or vacant dwellings'],
        resources: [
          {
            id: 'res-fd-0-1',
            title: 'Field Sampling Field Guide',
            type: 'PDF',
            url: '/docs/sampling-field-guide.pdf',
            readingTime: 30,
            summary: 'Rules for sampling intervals and replacement protocols.',
            contentHtml: '<div><h3>Sampling Guide</h3><p>Never substitute sampled households without logging mandatory 3 revisit attempts.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-fd-0',
          title: 'Sampling Protocols Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-fd-0-1',
              question: 'When a sampled household is temporarily locked, what must the surveyor do?',
              options: ['Immediately interview the neighbor', 'Record visit #1, obtain neighbor timings, and revisit up to 3 times before replacement', 'Skip the village', 'Guess the answers'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-fd-0-2',
              question: 'The right-hand rule in random walk sampling ensures…',
              options: ['Surveyors do not get tired', 'Objective spatial distribution without surveyor selection bias', 'Interviewing only wealthy households', 'Speedy data collection'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-fd-1',
        programmeId: 'prog-field',
        sortOrder: 2000,
        title: 'Field Safety & Emergency Protocols',
        description: 'Emergency contacts, medical contingency, local police liaison, and weather advisories.',
        objectives: ['Establish daily check-in rhythms with headquarters', 'Identify local medical facilities', 'Manage field travel hazards'],
        resources: [
          {
            id: 'res-fd-1-1',
            title: 'Field Safety Protocols & Emergency Contacts',
            type: 'PDF',
            url: '/docs/safety-protocols.pdf',
            readingTime: 30,
            summary: 'Standard operating procedures for surveyor health and safety.',
            contentHtml: '<div><h3>Safety Protocol</h3><p>Surveyor well-being is top priority. In adverse weather or social tension, suspend fieldwork immediately.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-fd-1',
          title: 'Field Safety Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-fd-1-1',
              question: 'If local civil unrest or severe weather occurs in the survey block, what is the action?',
              options: ['Complete the target surveys anyway', 'Immediately move team to designated safe lodging and notify the Field Director', 'Split up the team', 'Ignore the advisory'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-fd-1-2',
              question: 'All female field enumerators must be…',
              options: ['Allowed to work alone in remote areas at night', 'Paired in buddy systems and conclude field work before dusk', 'Assigned only office tasks', 'Unsupervised'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-fd-2',
        programmeId: 'prog-field',
        sortOrder: 3000,
        title: 'Tablet Survey Tools & Offline Sync',
        description: 'Managing tablet CAPI apps, battery logistics, encrypted syncing, and backups.',
        objectives: ['Install survey packages on CAPI devices', 'Perform daily local database export backups', 'Sync completed interviews via secure SSL'],
        resources: [
          {
            id: 'res-fd-2-1',
            title: 'Tablet CAPI Operations Manual',
            type: 'PDF',
            url: '/docs/tablet-manual.pdf',
            readingTime: 30,
            summary: 'Hardware setup and daily data backup instructions.',
            contentHtml: '<div><h3>CAPI Hardware Operations</h3><p>Charge power banks nightly; verify GPS sensor calibration before commencing listing.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-fd-2',
          title: 'CAPI Sync Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-fd-2-1',
              question: 'When should completed tablet surveys be synced to the master cloud server?',
              options: ['Once a month', 'At the end of every working day as soon as network is accessible', 'Never', 'Only upon return to headquarters'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-fd-2-2',
              question: 'What happens if a tablet battery dies midway through an interview?',
              options: ['The entire day data is lost', 'Modern CAPI apps auto-save each question response into encrypted local storage', 'The survey must be restarted from memory', 'The device breaks'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
      {
        id: 'mod-fd-3',
        programmeId: 'prog-field',
        sortOrder: 4000,
        title: 'Community Stakeholder Protocols',
        description: 'Engaging Panchayats, village heads (Pradhans), district authorities, and elders.',
        objectives: ['Present official introduction letters to local authorities', 'Explain study purpose transparently', 'Navigate local cultural sensitivities'],
        resources: [
          {
            id: 'res-fd-3-1',
            title: 'Community Engagement Guidelines',
            type: 'DOCUMENT',
            url: '/docs/community-engagement.docx',
            readingTime: 30,
            summary: 'Etiquette and official credential protocols for community entry.',
            contentHtml: '<div><h3>Community Protocol</h3><p>Always present Ikaai institutional letters and district admin empanelment credentials to the Gram Pradhan.</p></div>',
            sortOrder: 1000,
          },
        ],
        quiz: {
          id: 'quiz-fd-3',
          title: 'Community Engagement Quiz',
          instructions: 'Single attempt. 2 questions.',
          passingScore: 70,
          questions: [
            {
              id: 'q-fd-3-1',
              question: 'Before beginning survey listing in a rural village, the field supervisor must first…',
              options: ['Begin interviewing immediately without informing anyone', 'Call on the Gram Pradhan / Village Council with official institutional introduction credentials', 'Distribute flyers', 'Post on social media'],
              correctIndex: 1,
              sortOrder: 1000,
            },
            {
              id: 'q-fd-3-2',
              question: 'How should researchers present themselves to community elders?',
              options: ['Demanding and authoritative', 'Respectful, professional, attentive, and culturally sensitive', 'Informal and casual', 'Secretive'],
              correctIndex: 1,
              sortOrder: 2000,
            },
          ],
        },
        faqs: [],
      },
    ],
  },
  // Config Placeholders (can be expanded via Admin CMS)
  {
    id: 'prog-design',
    slug: 'design',
    title: 'Design',
    tagline: 'Visual storytelling, brand systems, and human-centered reports',
    description: 'Design track focusing on editorial design for research reports, infographics, and user interface systems.',
    colorTag: '#BE185D',
    colorBgLight: '#FDF2F8',
    colorTextLight: '#831843',
    instructors: ['user-admin-1'],
    modules: [],
  },
  {
    id: 'prog-social',
    slug: 'social-media',
    title: 'Social Media',
    tagline: 'Amplifying evidence and engaging development audiences',
    description: 'Track for communications and social outreach interns.',
    colorTag: '#C2410C',
    colorBgLight: '#FFF7ED',
    colorTextLight: '#7C2D12',
    instructors: ['user-admin-1'],
    modules: [],
  },
  {
    id: 'prog-bizdev',
    slug: 'business-development',
    title: 'Business Development',
    tagline: 'Tenders, proposals, and development partner relationships',
    description: 'Advisory growth and institutional RFP preparation.',
    colorTag: '#0284C7',
    colorBgLight: '#F0F9FF',
    colorTextLight: '#0369A1',
    instructors: ['user-admin-1'],
    modules: [],
  },
  {
    id: 'prog-content',
    slug: 'content-writing',
    title: 'Content Writing',
    tagline: 'Translating research into compelling development narratives',
    description: 'Editorial writing for policy briefs, articles, and whitepapers.',
    colorTag: '#4338CA',
    colorBgLight: '#EEF2FF',
    colorTextLight: '#312E81',
    instructors: ['user-admin-1'],
    modules: [],
  },
];

// Seed Enrolments and initial progress levels
export const SEED_ENROLLMENTS = [
  {
    userId: 'user-learner-1', // Priya Sharma
    programmeId: 'prog-research',
    status: 'ACTIVE',
    progressLevel: 45, // Modules 0 and 1 completed, Module 2 started
    completedResources: ['res-res-0-1', 'res-res-0-2', 'res-res-0-3', 'res-res-1-1', 'res-res-1-2'],
    quizScores: [
      { quizId: 'quiz-res-0', score: 2, total: 2, percentage: 100 },
      { quizId: 'quiz-res-1', score: 2, total: 2, percentage: 100 },
    ],
    examStatus: 'NOT_SUBMITTED',
  },
  {
    userId: 'user-learner-2', // Rahul Verma
    programmeId: 'prog-analyst',
    status: 'ACTIVE',
    progressLevel: 15, // Module 0 completed
    completedResources: ['res-an-0-1'],
    quizScores: [
      { quizId: 'quiz-an-0', score: 2, total: 2, percentage: 100 },
    ],
    examStatus: 'NOT_SUBMITTED',
  },
  {
    userId: 'user-learner-3', // Ananya Sen
    programmeId: 'prog-field',
    status: 'ACTIVE',
    progressLevel: 90, // All 4 modules complete, exam submitted
    completedResources: [
      'res-fd-0-1', 'res-fd-1-1', 'res-fd-2-1', 'res-fd-3-1'
    ],
    quizScores: [
      { quizId: 'quiz-fd-0', score: 2, total: 2, percentage: 100 },
      { quizId: 'quiz-fd-1', score: 2, total: 2, percentage: 100 },
      { quizId: 'quiz-fd-2', score: 2, total: 2, percentage: 100 },
      { quizId: 'quiz-fd-3', score: 2, total: 2, percentage: 100 },
    ],
    examStatus: 'SUBMITTED',
    examAnswers: {
      'ex-q-fd-1': 'I would organize an initial meeting with the Gram Pradhan and elders, presenting our DDA empanelment credentials and explaining how the research directly supports rural development.',
      'ex-q-fd-2': 'I would deploy supervisors to conduct a 10% random back-check on critical demographic and asset questions within 24 hours of surveyor submission.',
    },
  },
  {
    userId: 'user-learner-4', // Sunita Rao (HR Learner)
    programmeId: 'prog-hr',
    status: 'ACTIVE',
    progressLevel: 0,
    completedResources: [],
    quizScores: [],
    examStatus: 'NOT_SUBMITTED',
  },
];
