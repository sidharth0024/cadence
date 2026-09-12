// server/data/assignmentPool.ts
// Authoritative Library of Pre-defined Candidate Assignments for Commander / Adaptive Assignment selection
// AI evaluates user context and selects an existing assignment ID. AI does NOT create new assignments.

export interface CandidateAssignment {
  id: string;
  title: string;
  description: string;
  domain: string;
  subject: string;
  topics: string[];
  keywords: string[];
  skills: string[];
  difficulty: 'ROUTINE' | 'STANDARD' | 'ADVANCED' | 'CHALLENGE';
  estimatedDuration: number; // in minutes
  capabilityImpacts: {
    intellect?: number;
    discipline?: number;
    focus?: number;
    creativity?: number;
    resilience?: number;
    strength?: number;
  };
  completionCriteria: string;
}

export const CANDIDATE_ASSIGNMENT_POOL: CandidateAssignment[] = [
  // --- TECHNOLOGY & SYSTEM ARCHITECTURE ---
  {
    id: 'asg_pool_tech_01',
    title: 'Implement Core Authentication Middleware & Token Verification',
    description: 'Construct server-side middleware verifying security tokens, handling expiration, and isolating user permissions.',
    domain: 'Engineering',
    subject: 'Backend Systems',
    topics: ['Security', 'Middleware', 'API Contracts'],
    keywords: ['Authentication', 'Tokens', 'Security', 'Protected Routes', 'Validation'],
    skills: ['API Architecture', 'Defensive Programming'],
    difficulty: 'ADVANCED',
    estimatedDuration: 45,
    capabilityImpacts: { intellect: 3, discipline: 2, focus: 2 },
    completionCriteria: 'Endpoint rejects forged tokens with 401 and permits valid sessions with verified identity.',
  },
  {
    id: 'asg_pool_tech_02',
    title: 'Execute Database Schema Indexing & Query Latency Optimization',
    description: 'Inspect slow query logs, introduce compound indices on high-cardinality keys, and benchmark execution time.',
    domain: 'Engineering',
    subject: 'Database Systems',
    topics: ['Performance', 'Indexing', 'Query Optimization'],
    keywords: ['Database', 'Indices', 'Latency', 'Query Optimization', 'Benchmarking'],
    skills: ['Data Modeling', 'Performance Profiling'],
    difficulty: 'ADVANCED',
    estimatedDuration: 40,
    capabilityImpacts: { intellect: 3, focus: 3 },
    completionCriteria: 'Documented before-and-after query execution plan demonstrating >= 40% reduction in query cost.',
  },
  {
    id: 'asg_pool_tech_03',
    title: 'Construct Unit & Integration Test Matrix for Core Handlers',
    description: 'Develop comprehensive unit tests covering edge cases, invalid inputs, and error boundaries for primary business handlers.',
    domain: 'Engineering',
    subject: 'Quality Engineering',
    topics: ['Test Driven Design', 'Regression Prevention', 'Edge Cases'],
    keywords: ['Testing', 'Unit Tests', 'Coverage', 'Regression', 'Reliability'],
    skills: ['Test Engineering', 'Edge Case Analysis'],
    difficulty: 'STANDARD',
    estimatedDuration: 30,
    capabilityImpacts: { discipline: 3, intellect: 2 },
    completionCriteria: 'All new unit tests pass with zero flakiness and high coverage on critical logic branches.',
  },
  {
    id: 'asg_pool_tech_04',
    title: 'Refactor Monolithic Handler into Decoupled Service Layer',
    description: 'Extract business rules from transport layer controllers into dedicated, testable domain service modules.',
    domain: 'Engineering',
    subject: 'System Architecture',
    topics: ['Modularity', 'Clean Architecture', 'Refactoring'],
    keywords: ['Refactoring', 'Service Layer', 'Decoupling', 'Clean Code'],
    skills: ['Software Architecture', 'Code Craftsmanship'],
    difficulty: 'STANDARD',
    estimatedDuration: 35,
    capabilityImpacts: { intellect: 2, focus: 2, discipline: 1 },
    completionCriteria: 'Controller delegates orchestration to service with clean separation of concerns.',
  },

  // --- ACADEMICS & DEEP STUDY ---
  {
    id: 'asg_pool_acad_01',
    title: 'Active Recall & Feynman Technique Synthesis Session',
    description: 'Synthesize complex scientific/theoretical principles by explaining them concisely without referencing raw notes.',
    domain: 'Academia',
    subject: 'Theoretical Sciences',
    topics: ['Active Recall', 'Synthesis', 'Conceptual Understanding'],
    keywords: ['Feynman Technique', 'Recall', 'Conceptual Clarity', 'Synthesis'],
    skills: ['Explanatory Synthesis', 'Mental Modeling'],
    difficulty: 'ADVANCED',
    estimatedDuration: 50,
    capabilityImpacts: { intellect: 4, focus: 3 },
    completionCriteria: 'Produce a 1-page plain-language breakdown explaining the underlying governing equations or core mechanism.',
  },
  {
    id: 'asg_pool_acad_02',
    title: 'Solve 15 High-Difficulty Diagnostic Practice Questions Under Timed Conditions',
    description: 'Simulate high-pressure exam conditions without interruption, scoring precision and analyzing error origins.',
    domain: 'Academia',
    subject: 'Standardized Exam Prep',
    topics: ['Timed Problem Solving', 'Error Taxonomy', 'Speed & Accuracy'],
    keywords: ['Practice Questions', 'Timed Exam', 'Diagnostic', 'Precision', 'Error Analysis'],
    skills: ['Rapid Problem Solving', 'Cognitive Endurance'],
    difficulty: 'CHALLENGE',
    estimatedDuration: 60,
    capabilityImpacts: { resilience: 4, intellect: 3, focus: 3 },
    completionCriteria: 'Complete all 15 questions within the designated window; catalog root cause for every incorrect response.',
  },
  {
    id: 'asg_pool_acad_03',
    title: 'Primary Literature Critical Review & Methodology Evaluation',
    description: 'Critically analyze peer-reviewed publication methodology, sample size validity, and confounding variable controls.',
    domain: 'Academia',
    subject: 'Research Methodology',
    topics: ['Critical Analysis', 'Empirical Validity', 'Literature Review'],
    keywords: ['Methodology', 'Peer Review', 'Empirical Evidence', 'Statistical Validity'],
    skills: ['Scientific Critique', 'Analytical Reasoning'],
    difficulty: 'STANDARD',
    estimatedDuration: 35,
    capabilityImpacts: { intellect: 3, discipline: 2 },
    completionCriteria: 'Annotate paper noting potential sample biases, statistical robustness, and reproducible experiments.',
  },

  // --- MUSIC & INSTRUMENTAL MASTERY ---
  {
    id: 'asg_pool_music_01',
    title: 'Deliberate Metronome Pacing & Micro-Tempo Scale Permutations',
    description: 'Execute scale patterns at incremental metronome tempos, maintaining absolute rhythmic quantization and finger posture.',
    domain: 'Music & Arts',
    subject: 'Instrumental Technique',
    topics: ['Metronome Training', 'Motor Skill Purity', 'Rhythmic Precision'],
    keywords: ['Scales', 'Metronome', 'Tempo', 'Quantization', 'Dexterity'],
    skills: ['Motor Muscle Memory', 'Subdivision Audition'],
    difficulty: 'STANDARD',
    estimatedDuration: 30,
    capabilityImpacts: { discipline: 3, focus: 3 },
    completionCriteria: 'Flawless consecutive execution across 4 tempo increments without tension or metric drift.',
  },
  {
    id: 'asg_pool_music_02',
    title: 'Blind Sight-Reading & Polyphonic Voice Independence',
    description: 'Sight-read unlearned polyphonic passages with strict forward momentum without pausing to correct errors.',
    domain: 'Music & Arts',
    subject: 'Sight Reading',
    topics: ['Polyphony', 'Score Reading', 'Real-Time Processing'],
    keywords: ['Sight Reading', 'Polyphony', 'Notation', 'Ear Training'],
    skills: ['Real-Time Auditory Translation', 'Cognitive Coordination'],
    difficulty: 'ADVANCED',
    estimatedDuration: 40,
    capabilityImpacts: { focus: 4, intellect: 2, creativity: 2 },
    completionCriteria: 'Read through 2 full manuscript pages with continuous beat integrity and correct dynamic phrasing.',
  },

  // --- PHYSICAL PERFORMANCE & CONDITIONING ---
  {
    id: 'asg_pool_phys_01',
    title: 'High-Cadence Threshold Interval Conditioning Session',
    description: 'Targeted lactate threshold intervals at sustained target heart rate zone with strict rest-interval adherence.',
    domain: 'Athletics',
    subject: 'Cardiovascular Conditioning',
    topics: ['Interval Training', 'Threshold Pacing', 'Aerobic Base'],
    keywords: ['Intervals', 'Threshold', 'Endurance', 'Pacing', 'Heart Rate'],
    skills: ['Physiological Cadence', 'Mental Toughness'],
    difficulty: 'CHALLENGE',
    estimatedDuration: 45,
    capabilityImpacts: { strength: 3, resilience: 4, discipline: 2 },
    completionCriteria: 'Hold prescribed pacing/heart-rate zone across all repetitions with zero premature rest stops.',
  },
  {
    id: 'asg_pool_phys_02',
    title: 'Foundational Posterior Chain & Core Stabilization Block',
    description: 'Controlled compound movement patterns focusing on biomechanical alignment, eccentric control, and core tension.',
    domain: 'Athletics',
    subject: 'Structural Strength',
    topics: ['Compound Movements', 'Biomechanical Form', 'Eccentric Control'],
    keywords: ['Biomechanics', 'Strength', 'Alignment', 'Stabilization', 'Hypertrophy'],
    skills: ['Biomechanical Symmetry', 'Tension Regulation'],
    difficulty: 'STANDARD',
    estimatedDuration: 40,
    capabilityImpacts: { strength: 4, discipline: 2 },
    completionCriteria: 'Execute all scheduled sets with strict form preservation and documented weight/rep parameters.',
  },

  // --- CREATIVE & DESIGN CRAFTSMANSHIP ---
  {
    id: 'asg_pool_create_01',
    title: 'Editorial Visual Hierarchy & Micro-Spacing Calibration',
    description: 'Audit visual composition, mathematically calibrating spatial rhythm, typographic step scales, and negative space ratios.',
    domain: 'Design',
    subject: 'Visual Hierarchy',
    topics: ['Spatial Rhythm', 'Typography Scales', 'Negative Space'],
    keywords: ['Visual Design', 'Typography', 'Spacing', 'Composition', 'Craft'],
    skills: ['Visual Balance', 'Typographic Precision'],
    difficulty: 'STANDARD',
    estimatedDuration: 30,
    capabilityImpacts: { creativity: 3, focus: 2 },
    completionCriteria: 'Establish strict mathematical step ratios and eliminate conflicting layout visual weights.',
  },
  {
    id: 'asg_pool_create_02',
    title: 'Lighting Studio Experimentation: 3-Point Key & Contrast Fill Ratios',
    description: 'Set up light modifiers, evaluate incident light meters, and document falloff gradients across subject profiles.',
    domain: 'Creative Arts',
    subject: 'Studio Photography',
    topics: ['Lighting Ratios', 'Light Modifiers', 'Portraiture'],
    keywords: ['Photography', 'Lighting', 'Key Light', 'Fill Light', 'Contrast'],
    skills: ['Luminance Control', 'Spatial Lighting'],
    difficulty: 'ADVANCED',
    estimatedDuration: 55,
    capabilityImpacts: { creativity: 4, focus: 3 },
    completionCriteria: 'Produce series demonstrating 1:1, 2:1, and 4:1 key-to-fill lighting ratios with clean falloff control.',
  },

  // --- ENTERPRISE & STRATEGIC EXECUTION ---
  {
    id: 'asg_pool_biz_01',
    title: 'Cold Prospect Research & Personalized Value Proposition Drafting',
    description: 'Deeply inspect target client operations, identify explicit operational friction, and draft bespoke value proposals.',
    domain: 'Business',
    subject: 'Client Acquisition',
    topics: ['Prospecting', 'Value Proposition', 'Strategic Outreach'],
    keywords: ['Outreach', 'Prospecting', 'Pipeline', 'Client Acquisition', 'Sales'],
    skills: ['Strategic Empathy', 'Business Communication'],
    difficulty: 'STANDARD',
    estimatedDuration: 35,
    capabilityImpacts: { discipline: 3, resilience: 2, intellect: 2 },
    completionCriteria: 'Complete research dossiers and deliver tailored outreach for 5 vetted high-relevance prospects.',
  },
  {
    id: 'asg_pool_biz_02',
    title: 'Unit Economics & Operating Cash-Flow Sensitivity Model',
    description: 'Model customer acquisition cost (CAC), lifetime value (LTV), churn sensitivity, and runway permutations.',
    domain: 'Business',
    subject: 'Financial Modeling',
    topics: ['Unit Economics', 'Sensitivity Analysis', 'Cash Flow'],
    keywords: ['Finance', 'Unit Economics', 'Runway', 'LTV', 'CAC'],
    skills: ['Financial Modeling', 'Risk Assessment'],
    difficulty: 'ADVANCED',
    estimatedDuration: 50,
    capabilityImpacts: { intellect: 4, discipline: 2 },
    completionCriteria: 'Working dynamic model with sensitivity stress-testing covering conservative, target, and expansion cases.',
  }
];
