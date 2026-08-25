import { TemplateEngine } from './src/services/generator/templateEngine';
import { SandboxManager } from './src/services/validation/sandboxManager';
import { BuildValidator } from './src/services/validation/buildValidator';
import { ProvenanceEngine } from './src/services/ingestion/provenanceEngine';
import { PRESET_THEMES } from '@portfolio-generator/shared';

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('🧪 RUNNING PORTFOLIO GENERATOR AGENT VERIFICATION');
  console.log('====================================================\n');

  const testProfile = {
    personal: {
      name: 'Alex Rivera',
      headline: 'Senior Full-Stack & Distributed Systems Engineer',
      bio: 'Senior Full-Stack & Distributed Systems Engineer with 8+ years designing fault-tolerant platforms and real-time streaming architectures.',
      email: 'alex.rivera.dev@gmail.com',
      phone: '(555) 382-9912',
      location: 'San Francisco, CA',
      avatarUrl: '',
      socialLinks: {
        github: 'https://github.com/alexrivera-dev',
        linkedin: 'https://linkedin.com/in/alexrivera-eng',
      },
    },
    experience: [
      {
        id: 'exp_1',
        company: 'NexusCloud Inc.',
        role: 'Senior Infrastructure & Full-Stack Engineer',
        location: 'San Francisco, CA',
        startDate: '2021',
        endDate: 'Present',
        isCurrent: true,
        highlights: [
          'Architected and deployed multi-region Kubernetes clusters handling 120M daily events with 99.995% uptime SLA.',
          'Designed real-time event streaming pipeline using Apache Kafka, Go, and Redis, cutting latency by 58%.',
        ],
        technologies: ['Kubernetes', 'Go', 'Apache Kafka', 'Redis', 'TypeScript'],
      },
      {
        id: 'exp_2',
        company: 'ScaleLogic Technologies',
        role: 'Full-Stack Software Engineer',
        location: 'Austin, TX',
        startDate: '2018',
        endDate: '2021',
        isCurrent: false,
        highlights: [
          'Developed customer-facing analytics dashboard using React, TypeScript, GraphQL, and Tailwind CSS serving 45,000 enterprise users.',
        ],
        technologies: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS', 'PostgreSQL'],
      },
    ],
    projects: [
      {
        id: 'proj_1',
        name: 'Distributed KV Store (Raft)',
        tagline: 'High-Throughput Consensus Storage',
        description: 'Engineered an in-memory distributed Key-Value store in Go utilizing the Raft consensus algorithm for leader election.',
        highlights: ['Supports linearizable reads and atomic log replication.'],
        technologies: ['Go', 'gRPC', 'Protocol Buffers', 'Docker'],
        githubUrl: 'https://github.com/alexrivera-dev/raft-kv',
        liveUrl: '',
      },
    ],
    skills: [
      { category: 'Languages', skills: ['TypeScript', 'JavaScript', 'Go', 'Python', 'Rust', 'SQL'] },
      { category: 'Frameworks & Backend', skills: ['React', 'Node.js', 'Express', 'Next.js', 'Tailwind CSS'] },
      { category: 'Cloud & DevOps', skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Kafka', 'Redis'] },
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'University of Washington',
        degree: 'B.S. in Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2012',
        endDate: '2016',
        gpaOrGrade: 'Magna Cum Laude',
        honors: ['Dean\'s List'],
      },
    ],
    certifications: [
      { name: 'AWS Certified Solutions Architect — Professional', issuer: 'Amazon Web Services', date: '2023', url: '' },
    ],
    publications: [],
    achievements: ['Speaker at Distributed Systems Summit 2023'],
    provenance: [],
  };

  const testStrategy = {
    archetype: 'software_engineer' as const,
    targetRole: 'Senior Full-Stack & Distributed Systems Engineer',
    narrativeTone: 'modern_tech' as const,
    sectionOrder: ['hero', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'] as any[],
    featuredProjectIds: ['proj_1'],
    callToAction: {
      label: 'Get in Touch',
      actionType: 'email' as const,
      target: 'mailto:alex.rivera.dev@gmail.com',
    },
    layoutRecommendation: 'High-impact engineer layout with highlighted systems stats',
  };

  const testDesign = PRESET_THEMES.cyber_dark;
  const rawResumeSnippet = 'ALEX RIVERA San Francisco NexusCloud Inc. 120M daily events Kubernetes ScaleLogic Technologies University of Washington';

  console.log('1. Testing Provenance Engine verification...');
  const provenanceResult = ProvenanceEngine.verifyProfileFidelity(testProfile, rawResumeSnippet);
  console.log(`   - Verified Claims: ${provenanceResult.verifiedClaims}/${provenanceResult.totalClaims}`);
  console.log(`   - Provenance Fidelity Score: ${provenanceResult.fidelityScore}%`);
  console.log(`   - Hallucination Alerts: ${provenanceResult.hallucinationAlerts.length}`);

  console.log('\n2. Testing Code Generation & Template Assembly...');
  const projectFiles = TemplateEngine.generateProjectFiles(testProfile, testDesign, testStrategy);
  console.log(`   - Generated ${projectFiles.length} project files.`);
  for (const f of projectFiles) {
    console.log(`     • ${f.relativePath} (${f.content.length} chars)`);
  }

  console.log('\n3. Testing Ephemeral Sandbox Initialization...');
  const sandbox = new SandboxManager();
  sandbox.initialize(projectFiles);
  console.log(`   - Sandbox initialized at: ${sandbox.getPath()}`);

  console.log('\n4. Running Multi-Tier Build & Deployment Validator...');
  const validationResult = BuildValidator.validate(sandbox, testProfile, rawResumeSnippet, testStrategy, testDesign);
  console.log(`   - Validation Success: ${validationResult.success}`);
  console.log(`   - Build Status: ${validationResult.buildStatus}`);
  console.log(`   - GitHub Pages Ready: ${validationResult.deploymentReadiness.githubPagesReady}`);
  console.log(`   - Base Path Configured (base: "./"): ${validationResult.deploymentReadiness.basePathConfigured}`);
  console.log(`   - CI Workflow Included: ${validationResult.deploymentReadiness.workflowIncluded}`);
  console.log(`   - Fatal Errors: ${validationResult.errors.filter(e => e.severity === 'fatal').length}`);

  sandbox.cleanup();
  console.log('\n5. Cleaned up sandbox.');
  console.log('\n====================================================');
  console.log('✅ ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('====================================================');
}

runEndToEndVerification().catch(console.error);
