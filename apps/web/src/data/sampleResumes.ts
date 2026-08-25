export interface SampleResume {
  id: string;
  name: string;
  role: string;
  archetype: string;
  description: string;
  rawText: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'swe-senior',
    name: 'Alex Rivera',
    role: 'Senior Full-Stack & Distributed Systems Engineer',
    archetype: 'software_engineer',
    description: '8+ years experience building high-throughput microservices, Kubernetes platforms, and real-time streaming architectures.',
    rawText: `ALEX RIVERA
San Francisco, CA | alex.rivera.dev@gmail.com | (555) 382-9912
GitHub: https://github.com/alexrivera-dev | LinkedIn: https://linkedin.com/in/alexrivera-eng

EXECUTIVE SUMMARY
Senior Full-Stack & Distributed Systems Engineer with 8+ years of experience designing fault-tolerant cloud platforms, real-time distributed pipelines, and resilient web applications. Proven track record reducing API latency by 45% and scaling systems to 150M+ daily active requests.

PROFESSIONAL EXPERIENCE

Senior Infrastructure & Full-Stack Engineer | NexusCloud Inc.
San Francisco, CA | 2021 - Present
- Architected and deployed multi-region Kubernetes clusters handling 120M daily events with 99.995% uptime SLA.
- Designed real-time event streaming pipeline using Apache Kafka, Go, and Redis, cutting end-to-end data processing latency by 58%.
- Led a team of 6 engineers migrating legacy monolithic Django services into TypeScript/Node.js microservices.
- Automated CI/CD deployment pipelines using GitHub Actions and Terraform, reducing release cycle duration from 4 days to 15 minutes.

Full-Stack Software Engineer | ScaleLogic Technologies
Austin, TX | 2018 - 2021
- Developed customer-facing analytics dashboard using React, TypeScript, GraphQL, and Tailwind CSS serving 45,000 enterprise users.
- Optimized PostgreSQL database queries and indexes, decreasing 95th percentile query latency from 850ms to 65ms.
- Built automated billing integration with Stripe webhooks processing $12M in annual recurring subscription revenue.

Software Engineer | Veloce Systems
Seattle, WA | 2016 - 2018
- Built RESTful APIs using Python, FastAPI, and Docker for logistics dispatch management.
- Implemented WebSocket-based real-time vehicle telemetry tracking system with interactive Mapbox UI.

FEATURED PROJECTS

Distributed KV Store (Raft consensus)
- Engineered an in-memory distributed Key-Value store in Go utilizing the Raft consensus algorithm for leader election and log replication.
- Technologies: Go, gRPC, Protocol Buffers, Docker
- GitHub: https://github.com/alexrivera-dev/raft-kv

PulseMetrics — Cloud Observability Engine
- Built open-source real-time metrics aggregator collecting CPU, memory, and custom application metrics with sub-second dashboard rendering.
- Technologies: Rust, React, WebSockets, ClickHouse, Tailwind CSS
- GitHub: https://github.com/alexrivera-dev/pulse-metrics

SKILLS
- Languages: TypeScript, JavaScript, Go, Python, Rust, SQL
- Frameworks & Libraries: React, Node.js, Express, Next.js, FastAPI, GraphQL, Tailwind CSS
- Cloud & Infrastructure: AWS (ECS, Lambda, S3, RDS), Kubernetes, Docker, Terraform, Kafka, Redis, PostgreSQL
- Tools & Methodologies: Git, CI/CD (GitHub Actions), Microservices Architecture, TDD, Agile

EDUCATION
B.S. in Computer Science | University of Washington
Seattle, WA | 2012 - 2016
- Honors: Magna Cum Laude, Dean's List (6 semesters)

CERTIFICATIONS
- AWS Certified Solutions Architect — Professional (Amazon Web Services, 2023)
- Certified Kubernetes Administrator (CKA) (Cloud Native Computing Foundation, 2022)
`,
  },
  {
    id: 'designer-lead',
    name: 'Elena Rostova',
    role: 'Staff Product Designer & Design Systems Lead',
    archetype: 'designer',
    description: '7+ years leading end-to-end UX/UI strategy, accessible design systems, and mobile fintech experiences.',
    rawText: `ELENA ROSTOVA
New York, NY | elena.design@rostovastudio.com | (555) 749-1029
Portfolio: https://rostovastudio.com | LinkedIn: https://linkedin.com/in/elenarostova | Dribbble: https://dribbble.com/elenarostova

PROFESSIONAL SUMMARY
Staff Product Designer and Design Systems Architect with 7+ years creating intuitive, conversion-driven digital products across Fintech, SaaS, and eCommerce. Specialist in micro-interactions, WCAG AAA accessibility, and scalable cross-platform UI systems.

EXPERIENCE

Staff Product Designer | Aurora Fintech
New York, NY | 2022 - Present
- Spearheaded redesign of mobile wealth management application, increasing day-30 user retention by 34% and onboarding completion by 22%.
- Established unified design system "Lumina" across iOS, Android, and Web comprising 180+ accessible components used by 45+ product squads.
- Conducted 60+ moderated usability research sessions and synthesized quantitative telemetry into actionable product roadmaps.

Senior UX/UI Designer | Hyperion Creative Labs
Brooklyn, NY | 2019 - 2022
- Led product design for B2B collaborative workspace tool from zero to $4M ARR.
- Partnered closely with frontend engineers to build interactive Figma tokens synced with Tailwind CSS themes.
- Winner of Red Dot Design Award 2021 for Digital Interface Innovation.

UX Designer | Studio Craft
Boston, MA | 2017 - 2019
- Designed responsive eCommerce web experiences for international retail brands generating $35M in GMV.
- Created interactive prototypes in Framer and Principle for executive stakeholder validation.

SELECTED CASE STUDIES & PROJECTS

Lumina Universal Design System
- Multi-brand design token architecture bridging Figma variables with React/Tailwind component libraries.
- Live: https://lumina-ds.rostovastudio.com

VaultPay — Smart Mobile Crypto Wallet
- Clean, friction-free mobile wallet UX simplifying seed phrase recovery and multi-currency transactions.
- Technologies: Figma, Framer, Principle, User Research

SKILLS & TOOLS
- Design Strategy: User Experience (UX) Architecture, Design Systems, Information Architecture, Wireframing, Rapid Prototyping
- Research & Testing: User Interviews, A/B Testing, Usability Benchmarking, WCAG Accessibility Compliance
- Software & Prototyping: Figma, Framer, Adobe Creative Suite, Principle, Miro, CSS3/Tailwind

EDUCATION
B.F.A. in Interaction Design | Rhode Island School of Design (RISD)
Providence, RI | 2013 - 2017

AWARDS
- Red Dot Design Award 2021 — Best Interface Design
- Webby Award Nominee 2022 — Financial Services Mobile UX
`,
  },
  {
    id: 'researcher-ai',
    name: 'Dr. Marcus Vance',
    role: 'Senior Research Scientist in Machine Learning & NLP',
    archetype: 'researcher',
    description: 'Postdoctoral researcher specializing in Large Language Model reasoning, alignment, and multi-agent coordination.',
    rawText: `DR. MARCUS VANCE
Boston, MA | m.vance@mit.edu | (555) 831-2940
Google Scholar: https://scholar.google.com/citations?user=marcusvance | GitHub: https://github.com/marcusvance-ai

RESEARCH STATEMENT
Research Scientist focusing on neuro-symbolic reasoning, test-time compute scaling in Large Language Models, and verifiable multi-agent debate protocols. Published 9 papers at top-tier venues (NeurIPS, ICML, ACL).

ACADEMIC & RESEARCH EXPERIENCE

Postdoctoral Research Fellow | MIT CSAIL
Cambridge, MA | 2023 - Present
- Investigating reinforcement learning from verifiable rewards (RLVR) for mathematical theorem proving and code synthesis.
- Advised 4 graduate students and co-authored 3 accepted papers at NeurIPS 2023 and ICML 2024.

Research Scientist Intern | DeepMind
London, UK | Summer 2022
- Researched multi-agent deliberation strategies for hallucination reduction in open-domain question answering.
- Improved factual grounding benchmark score by 18.4% over baseline Llama models.

Graduate Research Assistant | Stanford Artificial Intelligence Laboratory (SAIL)
Stanford, CA | 2018 - 2023
- Conducted doctoral dissertation research on structured knowledge representations in deep neural networks.

SELECTED PUBLICATIONS

- Vance, M., et al. (2024). "Verifiable Reasoning Chains via Structured Verification in Open LLMs." NeurIPS 2024 (Oral presentation).
- Vance, M., & Zhang, L. (2023). "Autonomous Agent Alignment through Multi-Perspective Deliberation." ICML 2023.
- Vance, M., Patel, K., & Sutton, R. (2022). "Self-Correcting Decoding Algorithms for Neural Code Generation." ACL 2022.
- Vance, M., et al. (2021). "Benchmarking Factuality and Attribution in Dense Retrieval Architectures." EMNLP 2021.

PROJECTS & OPEN SOURCE

AgentBench: Multi-Agent Benchmark Suite
- Open-source benchmark for evaluating multi-turn planning, tool usage, and verification capabilities of frontier LLMs.
- GitHub: https://github.com/marcusvance-ai/agentbench (3.2k stars)

NeuroSymbolic-Py
- Python toolkit for integrating Z3 theorem provers with PyTorch transformer architectures.

EDUCATION
Ph.D. in Computer Science | Stanford University
Stanford, CA | 2018 - 2023
- Dissertation: "Robust Neuro-Symbolic Reasoning in Deep Generative Models"
- Advisor: Prof. Andrew Ng

B.S. in Mathematics and Computer Science | MIT
Cambridge, MA | 2014 - 2018
- GPA: 3.96/4.00, First Class Honors

SKILLS
- Core AI: Deep Learning, NLP, Reinforcement Learning, Multi-Agent Systems, Transformers, LLM Alignment
- Programming: Python, PyTorch, JAX, C++, CUDA, Triton, HuggingFace Transformers
- Scientific Tools: LaTeX, Git, Slurm, Weights & Biases, Ray Distributed
`,
  },
  {
    id: 'fresher-cs',
    name: 'Sophia Chen',
    role: 'Aspiring Software Engineer & Open Source Contributor',
    archetype: 'student_fresher',
    description: 'Recent CS graduate passionate about modern web technologies, full-stack development, and algorithmic problem solving.',
    rawText: `SOPHIA CHEN
San Jose, CA | sophia.chen.cs@gmail.com | (555) 902-3341
GitHub: https://github.com/sophiachen-dev | LinkedIn: https://linkedin.com/in/sophiachen-cs

OBJECTIVE
Energetic and motivated Computer Science graduate with strong foundation in data structures, algorithms, and full-stack development. Seeking an entry-level Software Engineer role to build impactful user-centric applications.

EDUCATION
B.S. in Computer Science | San Jose State University (SJSU)
San Jose, CA | Expected Graduation: May 2024
- GPA: 3.85 / 4.00 (Dean's Scholar)
- Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Operating Systems, Web Development, Object-Oriented Software Design

PROJECTS

StudySphere — Collaborative Peer Learning Hub
- Developed a full-stack real-time study platform featuring shared interactive whiteboards, Pomodoro timers, and WebRTC video rooms.
- Built responsive UI with React, Tailwind CSS, and Socket.io; implemented Node.js/Express backend with MongoDB.
- Handled 1,200+ active student users across SJSU campus during final exam weeks.
- Technologies: React, TypeScript, Node.js, Express, MongoDB, Socket.io, Tailwind CSS
- GitHub: https://github.com/sophiachen-dev/studysphere | Live: https://studysphere.dev

DevTrack — Developer Habit & GitHub Activity Tracker
- Built a productivity web app that integrates with GitHub REST API to visualize coding streaks, commit frequency, and language breakdown with interactive charts.
- Technologies: Next.js, TypeScript, Chart.js, Tailwind CSS, Vercel
- GitHub: https://github.com/sophiachen-dev/devtrack

AlgoVisualizer — Interactive Algorithm Visualizer
- Created visual algorithm animator for sorting algorithms (QuickSort, MergeSort) and pathfinding (Dijkstra, A* Search) to help CS students understand algorithmic complexity.
- Technologies: JavaScript (ES6+), HTML5 Canvas, CSS Grid

EXPERIENCE & INTERNSHIPS

Software Engineering Intern | ByteSpark Labs
Santa Clara, CA | Summer 2023
- Built reusable React UI components for the company's customer onboarding portal, reducing support tickets by 15%.
- Wrote comprehensive unit and integration tests with Jest and React Testing Library, achieving 88% code coverage.
- Participated in daily Agile standups, code reviews, and sprint planning.

TECHNICAL SKILLS
- Programming Languages: JavaScript (ES6+), TypeScript, Python, Java, C++, SQL, HTML5, CSS3
- Frameworks & Libraries: React, Node.js, Express, Next.js, Tailwind CSS, Bootstrap
- Developer Tools & Platforms: Git, GitHub, VS Code, Postman, MongoDB, PostgreSQL, Vercel, Firebase
- Core Concepts: REST APIs, Object-Oriented Programming (OOP), MVC Architecture, Responsive Design

ACHIEVEMENTS & LEADERSHIP
- 1st Place Winner | SJSU Hackathon 2023 (Developed accessible navigation app for visually impaired students)
- Technical Lead | Women in Computer Science (WiCS) SJSU Chapter (Organized coding workshops for 150+ members)
- Top 5% on LeetCode (Solved 350+ algorithmic challenges)
`,
  },
];
