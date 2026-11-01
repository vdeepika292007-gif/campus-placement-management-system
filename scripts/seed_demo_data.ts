import { prisma, ensureDatabaseReady, closeDatabase } from "../src/lib/db";
import {
  Role,
  AccountStatus,
  DriveStatus,
  RoundType,
  ApplicationStatus,
  RoundOutcome,
  NotificationType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

export const DEMO_PASSWORD = "DemoStudent@123";

// Helper for batch inserting with skipDuplicates
async function batchInsert<T>(
  modelDelegate: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<{ count: number }> },
  items: T[],
  batchSize = 200
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const res = await modelDelegate.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += res.count;
  }
  return inserted;
}

// ============================================================================
// 1. GENERATE 200 FICTIONAL INDIAN STUDENTS
// ============================================================================
const FIRST_NAMES = [
  "Aarav", "Aditya", "Rohan", "Vikram", "Siddharth", "Karthik", "Arjun", "Varun", "Harish", "Kunal",
  "Pranav", "Manav", "Devendra", "Nikhil", "Rishabh", "Aniket", "Tarun", "Gautham", "Rajesh", "Chetan",
  "Alok", "Suresh", "Manoj", "Deepak", "Sanjay", "Vikas", "Sandeep", "Ashish", "Mohit", "Sachin",
  "Abhinav", "Mayank", "Chirag", "Gaurav", "Harsh", "Akash", "Tushar", "Ayush", "Rahul", "Sumit",
  "Vivek", "Sameer", "Amit", "Naveen", "Praveen", "Rakesh", "Dinesh", "Mahesh", "Vishal", "Yash",
  "Ananya", "Sneha", "Tanvi", "Pooja", "Neha", "Meera", "Riya", "Divya", "Shreya", "Ishita",
  "Kavya", "Aishwarya", "Swati", "Pallavi", "Deepa", "Bhavna", "Shalini", "Payal", "Vidya", "Preeti",
  "Sunita", "Ritu", "Kiran", "Shruti", "Jyoti", "Rashmi", "Anjali", "Priyanka", "Smriti", "Komal",
  "Nidhi", "Swetha", "Bhavya", "Sakshi", "Simran", "Megha", "Ritika", "Akanksha", "Monika", "Aditi",
  "Ira", "Rhea", "Tara", "Anushka", "Diya", "Sanya", "Kritika", "Sonal", "Juhi", "Charu"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Iyer", "Kulkarni", "Deshmukh", "Nambiar", "Singhania", "Joshi", "Rao",
  "Bhattacharya", "Subramanian", "Choudhury", "Nair", "Sengupta", "Saxena", "Chatterjee", "Venkataraman", "Menon", "Malhotra",
  "Reddy", "Swaminathan", "Banerjee", "Kapoor", "Pillai", "Goswami", "Sen", "Madhavan", "Agarwal", "Tiwari",
  "Hegde", "Namboodiri", "Mukherjee", "Dasgupta", "Mehta", "Bhatia", "Chawla", "Gill", "Dutta", "Nanda",
  "Ghosh", "Mishra", "Pandey", "Tripathi", "Dubey", "Gupta", "Bansal", "Goel", "Mittal", "Jain"
];

const BRANCH_CONFIG = [
  { dept: "Computer Science & Engineering", code: "CSE", count: 70 },
  { dept: "Information Technology", code: "IT", count: 40 },
  { dept: "Electronics & Communication Engineering", code: "ECE", count: 35 },
  { dept: "Data Science & Artificial Intelligence", code: "AIDS", count: 25 },
  { dept: "Electrical & Electronics Engineering", code: "EEE", count: 15 },
  { dept: "Mechanical Engineering", code: "MECH", count: 15 },
];

const BRANCH_SKILLS: Record<string, string[][]> = {
  "Computer Science & Engineering": [
    ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    ["Python", "PyTorch", "C++", "Algorithms", "AWS"],
    ["Go", "Kubernetes", "Distributed Systems", "Redis", "Linux"],
    ["Java", "Microservices", "Spring Boot", "MySQL", "Kafka"],
    ["TypeScript", "Next.js", "GraphQL", "Tailwind CSS", "Jest"],
  ],
  "Information Technology": [
    ["Next.js", "Tailwind CSS", "GraphQL", "MongoDB", "Node.js"],
    ["Java", "Spring Boot", "MySQL", "REST APIs", "Git"],
    ["Angular", "TypeScript", "RxJS", "SASS", "PostgreSQL"],
    ["Cyber Security", "Ethical Hacking", "Wireshark", "Linux", "Python"],
    ["PHP", "Laravel", "PostgreSQL", "Docker", "Vue.js"],
  ],
  "Electronics & Communication Engineering": [
    ["Embedded C", "ARM Cortex", "MATLAB", "Python", "IoT"],
    ["Verilog", "FPGA", "C++", "VLSI", "Digital Electronics"],
    ["Signal Processing", "Embedded Systems", "Python", "RTOS", "C"],
    ["Telecommunications", "5G Standards", "Python", "Network Protocols", "C"],
    ["Microcontrollers", "PCB Design", "Circuit Simulation", "C++", "MQTT"],
  ],
  "Data Science & Artificial Intelligence": [
    ["Python", "Machine Learning", "TensorFlow", "NLP", "Pandas"],
    ["Computer Vision", "OpenCV", "PyTorch", "Python", "Scikit-learn"],
    ["Data Engineering", "Apache Spark", "SQL", "Python", "Airflow"],
    ["Business Analytics", "Tableau", "PowerBI", "SQL", "Python"],
    ["Deep Learning", "Keras", "HuggingFace", "FastAPI", "Docker"],
  ],
  "Electrical & Electronics Engineering": [
    ["Power Systems", "MATLAB", "Simulink", "PLC", "C++"],
    ["Control Systems", "Circuit Simulation", "PCB Design", "Python", "C"],
    ["Power Electronics", "SCADA", "IoT", "Embedded Systems", "Arduino"],
  ],
  "Mechanical Engineering": [
    ["SolidWorks", "ANSYS", "AutoCAD", "Python", "Robotics"],
    ["CAD", "Mechatronics", "MATLAB", "Arduino", "C"],
    ["Finite Element Analysis", "Computational Fluid Dynamics", "CATIA", "Manufacturing", "Python"],
  ],
};

export function generateStudents(passwordHash: string) {
  const users: any[] = [];
  const profiles: any[] = [];
  const now = new Date();

  let studentIdx = 1;

  for (const branch of BRANCH_CONFIG) {
    for (let b = 1; b <= branch.count; b++) {
      const idNum = studentIdx.toString().padStart(3, "0");
      const userId = `demo-user-student-${idNum}`;
      const profileId = `demo-profile-${idNum}`;
      const rollNum = `DEMO-22-${branch.code}-${b.toString().padStart(3, "0")}`;

      const fName = FIRST_NAMES[(studentIdx - 1) % FIRST_NAMES.length];
      const lName = LAST_NAMES[((studentIdx - 1) * 3 + Math.floor(studentIdx / 50)) % LAST_NAMES.length];
      const fullName = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${idNum}@demo.campus.edu`;

      // Realistic CGPA distribution (6.70 - 9.85)
      const baseCgpa = 7.0 + (((studentIdx * 7) % 28) * 0.1);
      const cgpa = Math.min(9.85, Math.max(6.70, Math.round(baseCgpa * 100) / 100));

      // Grad year (mostly 2026, some 2025/2027)
      const gradYear = studentIdx <= 170 ? 2026 : studentIdx <= 185 ? 2025 : 2027;

      // Branch skills
      const skillSets = BRANCH_SKILLS[branch.dept] || BRANCH_SKILLS["Computer Science & Engineering"];
      const skills = skillSets[(b - 1) % skillSets.length];

      users.push({
        id: userId,
        name: fullName,
        email,
        passwordHash,
        role: Role.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      });

      profiles.push({
        id: profileId,
        userId,
        studentNumber: rollNum,
        department: branch.dept,
        graduationYear: gradYear,
        cgpa,
        skills,
        resumeReference: `https://demo-resumes.campus.edu/${email.split("@")[0]}.pdf`,
        phone: `+91 91234 ${idNum.padStart(5, "0")}`,
        createdAt: now,
        updatedAt: now,
      });

      studentIdx++;
    }
  }

  return { users, profiles };
}

// ============================================================================
// 2. 30 FICTIONAL COMPANIES
// ============================================================================
export const DEMO_COMPANIES = [
  { id: "demo-comp-01", name: "BharatPay FinEdge", industry: "Fintech & UPI Gateways", location: "Bengaluru, Karnataka", companySize: "501-1000 employees", desc: "Enterprise digital payments infrastructure, UPI settlement engines, and merchant neo-banking platforms." },
  { id: "demo-comp-02", name: "TuringEdge Cognitive Systems", industry: "Artificial Intelligence & Deep Tech", location: "Hyderabad, Telangana", companySize: "201-500 employees", desc: "Pioneering enterprise large language models, autonomous AI agents, and multimodal reasoning software." },
  { id: "demo-comp-03", name: "Zenith InfraCloud Networks", industry: "Cloud Infrastructure & SRE", location: "Pune, Maharashtra", companySize: "1001-5000 employees", desc: "Hyperscale cloud orchestration, bare-metal container networking, and SRE observability systems." },
  { id: "demo-comp-04", name: "AarogyaPulse HealthTech", industry: "Digital Healthcare & MedTech", location: "Gurugram, Haryana", companySize: "51-200 employees", desc: "Next-generation electronic health record exchange, clinical decision automation, and tele-triage platforms." },
  { id: "demo-comp-05", name: "Kavach CyberSecurity Labs", industry: "Information Security & Cryptography", location: "Bengaluru, Karnataka", companySize: "201-500 employees", desc: "Defense-grade endpoint telemetry, zero-trust cryptographic access gateways, and adversary simulation." },
  { id: "demo-comp-06", name: "Vidyut Mobility Technologies", industry: "CleanTech & EV Engineering", location: "Chennai, Tamil Nadu", companySize: "501-1000 employees", desc: "Electric vehicle powertrain controllers, battery management firmware, and smart charging grid telemetry." },
  { id: "demo-comp-07", name: "Indus Quant Capital", industry: "Quantitative Finance & Trading", location: "Mumbai, Maharashtra", companySize: "51-200 employees", desc: "Ultra-low-latency algorithmic execution, statistical arbitrage models, and high-frequency market-making desk." },
  { id: "demo-comp-08", name: "UdaanMart Omnichannel Retail", industry: "E-Commerce & Supply Chain Logistics", location: "Noida, Uttar Pradesh", companySize: "1001-5000 employees", desc: "National e-commerce logistics platform, real-time micro-fulfillment routing, and automated supply chains." },
  { id: "demo-comp-09", name: "SwasthyaAI Diagnostics", industry: "Healthcare AI & Pathology", location: "Bengaluru, Karnataka", companySize: "51-200 employees", desc: "Deep-learning computer vision models for automated oncology pathology and radiology diagnostics." },
  { id: "demo-comp-10", name: "Pratirakshak Defense Systems", industry: "Aerospace & Autonomous Robotics", location: "Hyderabad, Telangana", companySize: "501-1000 employees", desc: "Unmanned aerial vehicle swarms, military-spec telemetry links, and real-time sensor fusion systems." },
  { id: "demo-comp-11", name: "KuberWealth Robo-Advisory", industry: "WealthTech & Asset Management", location: "Mumbai, Maharashtra", companySize: "51-200 employees", desc: "Automated wealth planning, retail mutual fund routing, and algorithmic portfolio rebalancing." },
  { id: "demo-comp-12", name: "NeerJal Environmental Tech", industry: "Cleantech & IoT Utility Grids", location: "Ahmedabad, Gujarat", companySize: "51-200 employees", desc: "Smart municipal water telemetry, industrial effluent monitoring, and predictive leak detection IoT." },
  { id: "demo-comp-13", name: "KrishiSetu AgriTech", industry: "AgriTech & Supply Intelligence", location: "Pune, Maharashtra", companySize: "201-500 employees", desc: "Satellite crop-yield forecasting, mandi price prediction algorithms, and direct farmer procurement tech." },
  { id: "demo-comp-14", name: "Doota Aerospace Dynamics", industry: "SpaceTech & Satellite Avionics", location: "Bengaluru, Karnataka", companySize: "51-200 employees", desc: "Low-Earth orbit satellite guidance computers, solar panel tracking actuators, and ground station SDRs." },
  { id: "demo-comp-15", name: "Shreshtha Microelectronics", industry: "Semiconductor Design & VLSI", location: "Bengaluru, Karnataka", companySize: "501-1000 employees", desc: "RISC-V processor verification, analog mixed-signal IP cores, and silicon tapeout engineering." },
  { id: "demo-comp-16", name: "UrjaGrid Renewables", industry: "Renewable Energy & Smart Grids", location: "Jaipur, Rajasthan", companySize: "201-500 employees", desc: "Grid-scale battery storage scheduling, solar microgrid inverters, and power trading dispatch software." },
  { id: "demo-comp-17", name: "VayuLogix Courier Tech", industry: "Logistics & Fleet Telematics", location: "Delhi NCR", companySize: "1001-5000 employees", desc: "Autonomous courier dispatch, dynamic route optimization, and last-mile tracking infrastructure." },
  { id: "demo-comp-18", name: "ShikshaGyan EdTech", industry: "EdTech & Learning Platforms", location: "Bengaluru, Karnataka", companySize: "501-1000 employees", desc: "Interactive adaptive learning engines, automated coding evaluation sandboxes, and virtual labs." },
  { id: "demo-comp-19", name: "BimaKavach InsurTech", industry: "InsurTech & Risk Underwriting", location: "Mumbai, Maharashtra", companySize: "51-200 employees", desc: "AI-driven motor claims inspection, parametric crop insurance, and real-time fraud mitigation." },
  { id: "demo-comp-20", name: "Astraea Robotics Labs", industry: "Industrial Robotics & Automation", location: "Pune, Maharashtra", companySize: "201-500 employees", desc: "Automated guided vehicles (AGV), collaborative warehouse arms, and ROS2 industrial motion planning." },
  { id: "demo-comp-21", name: "Nayantara Optics & LiDAR", industry: "Autonomous Vehicle Sensors", location: "Chennai, Tamil Nadu", companySize: "51-200 employees", desc: "Solid-state automotive LiDAR sensors, point-cloud filtering DSP, and optical sensor calibration." },
  { id: "demo-comp-22", name: "GatiVahan Telematics", industry: "Connected Mobility & Fleet IoT", location: "Indore, Madhya Pradesh", companySize: "51-200 employees", desc: "OBD-II vehicle diagnostics gateways, driver fatigue vision models, and fuel theft analytics." },
  { id: "demo-comp-23", name: "SurakshaID Identity Tech", industry: "Identity Verification & Trust", location: "Hyderabad, Telangana", companySize: "201-500 employees", desc: "Decentralized cryptographic credential issuance, liveness biometric models, and KYC automation." },
  { id: "demo-comp-24", name: "MeghDoot Cloud Native", industry: "Serverless & Edge Computing", location: "Kochi, Kerala", companySize: "51-200 employees", desc: "Distributed edge function runtimes, multi-region database caches, and WebAssembly execution sandboxes." },
  { id: "demo-comp-25", name: "Sampark CRM Solutions", industry: "Enterprise SaaS & Workflows", location: "Kolkata, West Bengal", companySize: "501-1000 employees", desc: "Omnichannel customer interaction pipelines, automated ticketing engines, and enterprise CRM." },
  { id: "demo-comp-26", name: "NyayaTech Legal AI", industry: "LegalTech & Contract Analysis", location: "Delhi NCR", companySize: "51-200 employees", desc: "NLP contract risk extraction, regulatory compliance monitors, and automated case precedent retrieval." },
  { id: "demo-comp-27", name: "ParamCompute High-Performance", industry: "Supercomputing & GPU Cloud", location: "Bengaluru, Karnataka", companySize: "201-500 employees", desc: "Bare-metal GPU cluster provisioning, distributed MPI model training, and InfiniBand networking." },
  { id: "demo-comp-28", name: "KaushalSkills Talent Platforms", industry: "HRTech & Assessment Engines", location: "Chandigarh, Punjab", companySize: "51-200 employees", desc: "Psychometric testing algorithms, automated video interview sentiment scoring, and skill ontologies." },
  { id: "demo-comp-29", name: "Ananta Gaming & Metaverse", industry: "Gaming & 3D Interactive Media", location: "Mumbai, Maharashtra", companySize: "201-500 employees", desc: "Multiplayer networked game servers, real-time ray-tracing graphics pipelines, and spatial audio." },
  { id: "demo-comp-30", name: "SetuRail Transit Systems", industry: "Railway Automation & Signaling", location: "Secunderabad, Telangana", companySize: "1001-5000 employees", desc: "European Train Control System (ETCS) level 2 signaling, electronic interlocking, and track telemetry." },
];

export function generateCompanies() {
  const now = new Date();
  return DEMO_COMPANIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    description: c.desc,
    website: `https://${c.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.demo.internal`,
    industry: c.industry,
    location: c.location,
    companySize: c.companySize,
    logoUrl: `https://images.unsplash.com/photo-${1550000000000 + (i * 1234567) % 50000000}?w=128&auto=format&fit=crop&q=80`,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }));
}

// ============================================================================
// 3. 50 PLACEMENT DRIVES / JOB POSTINGS
// ============================================================================
const ROLES = [
  { title: "Associate Software Development Engineer (Full Stack)", type: "Full-time", minSal: 12.0, maxSal: 16.5, minCgpa: 7.5, branches: ["Computer Science & Engineering", "Information Technology"], skills: ["React", "TypeScript", "Node.js", "SQL"] },
  { title: "Junior Backend Engineer (Distributed Systems)", type: "Full-time", minSal: 14.0, maxSal: 18.5, minCgpa: 7.5, branches: ["Computer Science & Engineering", "Information Technology"], skills: ["Node.js", "PostgreSQL", "Docker", "Redis"] },
  { title: "Software Development Engineer in Test (SDET)", type: "Full-time", minSal: 10.0, maxSal: 13.5, minCgpa: 7.0, branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"], skills: ["TypeScript", "Jest", "CI/CD", "SQL"] },
  { title: "Associate Machine Learning Engineer", type: "Full-time", minSal: 16.0, maxSal: 22.0, minCgpa: 8.0, branches: ["Computer Science & Engineering", "Information Technology", "Data Science & Artificial Intelligence"], skills: ["Python", "PyTorch", "Transformers", "Algorithms"] },
  { title: "Cloud Platform & DevOps Engineer", type: "Full-time", minSal: 12.5, maxSal: 16.0, minCgpa: 7.2, branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"], skills: ["Kubernetes", "Docker", "Linux", "AWS"] },
  { title: "Frontend & Mobile Application Engineer", type: "Full-time", minSal: 11.0, maxSal: 15.0, minCgpa: 7.0, branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"], skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
  { title: "Associate Security Analyst & PenTester", type: "Full-time", minSal: 13.0, maxSal: 17.5, minCgpa: 7.5, branches: ["Computer Science & Engineering", "Information Technology"], skills: ["Linux", "Cyber Security", "Networking", "Python"] },
  { title: "Embedded Systems & Firmware Engineer", type: "Full-time", minSal: 9.5, maxSal: 13.5, minCgpa: 7.0, branches: ["Electronics & Communication Engineering", "Electrical & Electronics Engineering", "Mechanical Engineering"], skills: ["Embedded C", "C++", "RTOS", "MATLAB"] },
  { title: "Quantitative Trading Strategist & C++ Dev", type: "Full-time", minSal: 22.0, maxSal: 32.0, minCgpa: 8.5, branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"], skills: ["C++", "Algorithms", "Linear Algebra", "Linux"] },
  { title: "Data Platform & Analytics Engineer", type: "Full-time", minSal: 11.5, maxSal: 15.5, minCgpa: 7.2, branches: ["Computer Science & Engineering", "Information Technology", "Data Science & Artificial Intelligence"], skills: ["SQL", "Python", "Data Engineering", "PostgreSQL"] },
  { title: "Hardware Verification & VLSI Engineer", type: "Full-time", minSal: 14.0, maxSal: 19.0, minCgpa: 7.8, branches: ["Electronics & Communication Engineering", "Electrical & Electronics Engineering"], skills: ["Verilog", "FPGA", "C++", "VLSI"] },
  { title: "Robotics Motion Planning & Control Intern", type: "Internship", minSal: 6.0, maxSal: 8.5, minCgpa: 7.5, branches: ["Mechanical Engineering", "Electronics & Communication Engineering"], skills: ["Robotics", "ROS", "C++", "Python"] },
  { title: "GenAI & LLM Research Intern", type: "Internship", minSal: 5.0, maxSal: 7.5, minCgpa: 7.8, branches: ["Computer Science & Engineering", "Data Science & Artificial Intelligence"], skills: ["Python", "NLP", "PyTorch"] },
  { title: "Site Reliability Intern (Summer 2026)", type: "Internship", minSal: 5.5, maxSal: 8.0, minCgpa: 7.0, branches: ["Computer Science & Engineering", "Information Technology"], skills: ["Linux", "Docker", "Python"] },
  { title: "Power Systems & Battery Telemetry Engineer", type: "Full-time", minSal: 10.5, maxSal: 14.5, minCgpa: 7.0, branches: ["Electrical & Electronics Engineering", "Electronics & Communication Engineering"], skills: ["Power Systems", "MATLAB", "Simulink", "C++"] },
];

export function generateDrivesAndRounds() {
  const drives: any[] = [];
  const rounds: any[] = [];
  const now = new Date();

  const inDays = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
  const agoDays = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

  for (let i = 1; i <= 50; i++) {
    const idNum = i.toString().padStart(2, "0");
    const driveId = `demo-drive-${idNum}`;

    // Assign company (drives 1-40 get 2 drives per company, 41-50 get 1 per company)
    const compIdx = i <= 40 ? Math.floor((i - 1) / 2) + 1 : i - 20;
    const companyId = `demo-comp-${compIdx.toString().padStart(2, "0")}`;

    // Select role profile
    const role = ROLES[(i - 1) % ROLES.length];

    // Status breakdown: 38 Published, 6 Draft, 4 Closed, 2 Archived
    let status: DriveStatus = DriveStatus.PUBLISHED;
    let deadlineAt = inDays(7 + (i % 35));

    if (i >= 39 && i <= 44) {
      status = DriveStatus.DRAFT;
      deadlineAt = inDays(30);
    } else if (i >= 45 && i <= 48) {
      status = DriveStatus.CLOSED;
      deadlineAt = agoDays(5 + (i - 44) * 5);
    } else if (i >= 49) {
      status = DriveStatus.ARCHIVED;
      deadlineAt = agoDays(30 + (i - 48) * 10);
    }

    drives.push({
      id: driveId,
      companyId,
      title: `${role.title} (#${idNum})`,
      jobDescription: `Join our core technical team for high-impact engineering. You will collaborate with principal staff to design scalable architectures, deploy production software, and participate in code reviews.`,
      jobType: role.type,
      location: i % 3 === 0 ? "Bengaluru, Karnataka (Hybrid)" : i % 3 === 1 ? "Hyderabad, Telangana" : "Pune, Maharashtra",
      salaryMin: role.minSal,
      salaryMax: role.maxSal,
      salaryDisplay: `₹${role.minSal.toFixed(1)} - ₹${role.maxSal.toFixed(1)} LPA`,
      currency: "INR",
      deadlineAt,
      status,
      eligibleBranches: role.branches,
      eligibleGradYears: role.type === "Internship" ? [2026, 2027] : [2026],
      minimumCgpa: role.minCgpa,
      requiredSkills: role.skills,
      createdAt: now,
      updatedAt: now,
    });

    // 2 Recruitment rounds per drive = 100 rounds
    rounds.push({
      id: `demo-round-${idNum}-1`,
      placementDriveId: driveId,
      name: `Round 1: Proctored Coding & Technical Screening`,
      roundType: RoundType.ONLINE_ASSESSMENT,
      sequence: 1,
      scheduledAt: inDays(4 + (i % 20)),
      description: `Automated assessment evaluating data structures, problem solving, algorithms, and core engineering fundamentals.`,
      createdAt: now,
      updatedAt: now,
    });

    rounds.push({
      id: `demo-round-${idNum}-2`,
      placementDriveId: driveId,
      name: `Round 2: System Architecture & Technical Interview`,
      roundType: RoundType.TECHNICAL_INTERVIEW,
      sequence: 2,
      scheduledAt: inDays(9 + (i % 20)),
      description: `In-depth 1-on-1 virtual architecture panel with senior engineering staff covering real-world design scenarios.`,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { drives, rounds };
}

// ============================================================================
// 4. 1,000 APPLICATIONS & STATUS LOGS & ROUND RESULTS
// ============================================================================
export function generateApplicationsAndLogs() {
  const applications: any[] = [];
  const statusLogs: any[] = [];
  const roundResults: any[] = [];
  const now = new Date();

  const agoHours = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

  // Status Distribution for 1,000 applications:
  // 350 APPLIED, 200 UNDER_REVIEW, 170 SHORTLISTED, 90 ASSESSMENT_SCHEDULED,
  // 80 INTERVIEW_SCHEDULED, 45 SELECTED, 25 OFFER_RECORDED, 30 REJECTED, 10 WITHDRAWN
  const STATUS_POOL: ApplicationStatus[] = [
    ...Array(350).fill(ApplicationStatus.APPLIED),
    ...Array(200).fill(ApplicationStatus.UNDER_REVIEW),
    ...Array(170).fill(ApplicationStatus.SHORTLISTED),
    ...Array(90).fill(ApplicationStatus.ASSESSMENT_SCHEDULED),
    ...Array(80).fill(ApplicationStatus.INTERVIEW_SCHEDULED),
    ...Array(45).fill(ApplicationStatus.SELECTED),
    ...Array(25).fill(ApplicationStatus.OFFER_RECORDED),
    ...Array(30).fill(ApplicationStatus.REJECTED),
    ...Array(10).fill(ApplicationStatus.WITHDRAWN),
  ];

  let appIdx = 0;
  let resultIdx = 1;

  // 200 students x 5 applications each = exactly 1,000 applications
  // Published drives are demo-drive-01 to demo-drive-38 (38 drives)
  // For each student, select 5 coprime drive offsets: 0, 7, 14, 21, 28 mod 38
  // This guarantees 5 strictly distinct drive IDs per student!
  const OFFSETS = [0, 7, 14, 21, 28];

  for (let s = 1; s <= 200; s++) {
    const studentId = `demo-user-student-${s.toString().padStart(3, "0")}`;

    for (let k = 0; k < 5; k++) {
      appIdx++;
      const appIdNum = appIdx.toString().padStart(4, "0");
      const appId = `demo-app-${appIdNum}`;

      const driveNum = (((s - 1 + OFFSETS[k]) % 38) + 1).toString().padStart(2, "0");
      const placementDriveId = `demo-drive-${driveNum}`;

      const status = STATUS_POOL[appIdx - 1];
      const appliedAt = agoHours(48 + (appIdx % 120));

      applications.push({
        id: appId,
        studentId,
        placementDriveId,
        status,
        appliedAt,
        updatedAt: now,
      });

      // Status Log (1,000 logs)
      let fromStatus: ApplicationStatus | null = null;
      let reason = "Candidate submitted application via CPMS student portal.";

      if (status === ApplicationStatus.UNDER_REVIEW) {
        fromStatus = ApplicationStatus.APPLIED;
        reason = "Initial profile screening and branch validation underway.";
      } else if (status === ApplicationStatus.SHORTLISTED) {
        fromStatus = ApplicationStatus.UNDER_REVIEW;
        reason = "Candidate met minimum CGPA and department eligibility threshold.";
      } else if (status === ApplicationStatus.ASSESSMENT_SCHEDULED) {
        fromStatus = ApplicationStatus.SHORTLISTED;
        reason = "Slot confirmed for Round 1 Proctored Coding Assessment.";
      } else if (status === ApplicationStatus.INTERVIEW_SCHEDULED) {
        fromStatus = ApplicationStatus.ASSESSMENT_SCHEDULED;
        reason = "Candidate cleared online test cutoff; technical interview scheduled.";
      } else if (status === ApplicationStatus.SELECTED) {
        fromStatus = ApplicationStatus.INTERVIEW_SCHEDULED;
        reason = "Unanimous technical recommendation from engineering panel.";
      } else if (status === ApplicationStatus.OFFER_RECORDED) {
        fromStatus = ApplicationStatus.SELECTED;
        reason = "Official letter of intent generated and registered in placement system.";
      } else if (status === ApplicationStatus.REJECTED) {
        fromStatus = ApplicationStatus.UNDER_REVIEW;
        reason = "Assessment score below company round-1 cutoff mark.";
      } else if (status === ApplicationStatus.WITHDRAWN) {
        fromStatus = ApplicationStatus.APPLIED;
        reason = "Application withdrawn by student due to prior offer acceptance.";
      }

      statusLogs.push({
        id: `demo-log-${appIdNum}`,
        applicationId: appId,
        fromStatus,
        toStatus: status,
        reason,
        createdAt: appliedAt,
      });

      // Round results for advanced applicants (up to 300 round results)
      if (
        resultIdx <= 300 &&
        (status === ApplicationStatus.ASSESSMENT_SCHEDULED ||
         status === ApplicationStatus.INTERVIEW_SCHEDULED ||
         status === ApplicationStatus.SELECTED ||
         status === ApplicationStatus.OFFER_RECORDED ||
         status === ApplicationStatus.SHORTLISTED)
      ) {
        const roundNum = resultIdx % 2 === 1 ? 1 : 2;
        const roundId = `demo-round-${driveNum}-${roundNum}`;
        const outcome =
          status === ApplicationStatus.SELECTED || status === ApplicationStatus.OFFER_RECORDED
            ? RoundOutcome.CLEARED
            : status === ApplicationStatus.INTERVIEW_SCHEDULED
            ? RoundOutcome.SHORTLISTED
            : RoundOutcome.PENDING;

        roundResults.push({
          id: `demo-result-${resultIdx.toString().padStart(4, "0")}`,
          applicationId: appId,
          recruitmentRoundId: roundId,
          status: outcome,
          notes: outcome === RoundOutcome.CLEARED
            ? "Exceptional algorithmic problem solving and code cleanliness."
            : outcome === RoundOutcome.SHORTLISTED
            ? "Cleared test threshold with 88th percentile score."
            : "Evaluation pending review by recruitment committee.",
          updatedAt: now,
        });

        resultIdx++;
      }
    }
  }

  return { applications, statusLogs, roundResults };
}

// ============================================================================
// 5. 300 NOTIFICATIONS & 100 AUDIT LOGS
// ============================================================================
export function generateNotificationsAndAudits() {
  const notifications: any[] = [];
  const auditLogs: any[] = [];
  const now = new Date();

  // 300 Notifications spread across 200 students
  for (let i = 1; i <= 300; i++) {
    const notifNum = i.toString().padStart(4, "0");
    const studentIdx = ((i - 1) % 200) + 1;
    const userId = `demo-user-student-${studentIdx.toString().padStart(3, "0")}`;

    let title = "Campus Placement Drive Announcement";
    let message = "A new campus placement drive matching your department has been published. Review job details and apply before the deadline.";
    let type: NotificationType = NotificationType.INFO;
    let linkUrl = "/student/drives";

    if (i % 4 === 1) {
      title = "Application Status Update: Shortlisted!";
      message = "Congratulations! Your profile has been shortlisted for upcoming technical evaluation rounds.";
      type = NotificationType.SUCCESS;
      linkUrl = "/student/applications";
    } else if (i % 4 === 2) {
      title = "Technical Interview Scheduled";
      message = "Your round-2 virtual interview slot has been confirmed with the engineering panel. Check details in your portal.";
      type = NotificationType.ALERT;
      linkUrl = "/student/applications";
    } else if (i % 4 === 3) {
      title = "Upcoming Drive Deadline Reminder";
      message = "The application deadline for several published recruitment drives is closing soon. Ensure your resume reference is current.";
      type = NotificationType.WARNING;
      linkUrl = "/student/drives";
    }

    notifications.push({
      id: `demo-notif-${notifNum}`,
      userId,
      title,
      message,
      type,
      linkUrl,
      createdAt: now,
    });
  }

  // 100 Audit Logs
  for (let i = 1; i <= 100; i++) {
    const auditNum = i.toString().padStart(4, "0");
    let action = "DRIVE_PUBLISHED";
    let entityType = "PlacementDrive";
    let entityId = `demo-drive-${((i % 50) + 1).toString().padStart(2, "0")}`;
    let details = `Placement officer approved and published drive ${entityId}.`;

    if (i % 3 === 1) {
      action = "STATUS_ADVANCED";
      entityType = "Application";
      entityId = `demo-app-${((i * 7) % 1000 + 1).toString().padStart(4, "0")}`;
      details = `Recruitment coordinator promoted application ${entityId} to next round.`;
    } else if (i % 3 === 2) {
      action = "OFFER_REGISTERED";
      entityType = "Application";
      entityId = `demo-app-${((i * 13) % 1000 + 1).toString().padStart(4, "0")}`;
      details = `Official letter of intent issued for application ${entityId}.`;
    }

    auditLogs.push({
      id: `demo-audit-${auditNum}`,
      action,
      entityType,
      entityId,
      details,
      createdAt: now,
    });
  }

  return { notifications, auditLogs };
}

// ============================================================================
// MAIN REPEATABLE SEED FUNCTION
// ============================================================================
export async function seedDemoData() {
  console.log("=================================================================");
  console.log("  CPMS — Seeding Expanded Realistic Fictional Dataset");
  console.log("  Target: 200 Students, 30 Companies, 50 Drives, 100 Rounds,");
  console.log("          1,000 Applications, 1,000 Status Logs, 300 Notifs,");
  console.log("          300 Round Results, 100 Audit Logs (3,280 Total)");
  console.log("=================================================================\n");

  await ensureDatabaseReady();

  // 1. Password Hash
  console.log("[1/9] Preparing bcrypt credential hash for 200 demo students...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, salt);

  // 2. Generate Data
  console.log("[2/9] Generating in-memory datasets...");
  const { users, profiles } = generateStudents(passwordHash);
  const companies = generateCompanies();
  const { drives, rounds } = generateDrivesAndRounds();
  const { applications, statusLogs, roundResults } = generateApplicationsAndLogs();
  const { notifications, auditLogs } = generateNotificationsAndAudits();

  // 3. Batch Insert Students (Users & Profiles)
  console.log(`[3/9] Inserting ${users.length} Users & ${profiles.length} StudentProfiles...`);
  const usersInserted = await batchInsert(prisma.user, users);
  const profilesInserted = await batchInsert(prisma.studentProfile, profiles);
  console.log(`  ✅ Users: ${usersInserted} new | Profiles: ${profilesInserted} new`);

  // 4. Batch Insert Companies
  console.log(`[4/9] Inserting ${companies.length} Companies...`);
  const compsInserted = await batchInsert(prisma.company, companies);
  console.log(`  ✅ Companies: ${compsInserted} new`);

  // 5. Batch Insert Placement Drives
  console.log(`[5/9] Inserting ${drives.length} PlacementDrives...`);
  const drivesInserted = await batchInsert(prisma.placementDrive, drives);
  console.log(`  ✅ PlacementDrives: ${drivesInserted} new`);

  // 6. Batch Insert Recruitment Rounds
  console.log(`[6/9] Inserting ${rounds.length} RecruitmentRounds...`);
  const roundsInserted = await batchInsert(prisma.recruitmentRound, rounds);
  console.log(`  ✅ RecruitmentRounds: ${roundsInserted} new`);

  // 7. Batch Insert Applications & Status Logs
  console.log(`[7/9] Inserting ${applications.length} Applications & ${statusLogs.length} StatusLogs...`);
  const appsInserted = await batchInsert(prisma.application, applications);
  const logsInserted = await batchInsert(prisma.applicationStatusLog, statusLogs);
  console.log(`  ✅ Applications: ${appsInserted} new | StatusLogs: ${logsInserted} new`);

  // 8. Batch Insert Round Results
  console.log(`[8/9] Inserting ${roundResults.length} ApplicationRoundResults...`);
  const resultsInserted = await batchInsert(prisma.applicationRoundResult, roundResults);
  console.log(`  ✅ RoundResults: ${resultsInserted} new`);

  // 9. Batch Insert Notifications & Audits
  console.log(`[9/9] Inserting ${notifications.length} Notifications & ${auditLogs.length} AuditLogs...`);
  const notifsInserted = await batchInsert(prisma.notification, notifications);
  const auditsInserted = await batchInsert(prisma.auditLog, auditLogs);
  console.log(`  ✅ Notifications: ${notifsInserted} new | AuditLogs: ${auditsInserted} new`);

  if (usersInserted === 0 && compsInserted === 0 && drivesInserted === 0) {
    console.log("\n  ℹ️ All demo records are already present in the database.");
    console.log("  (0 new rows inserted because skipDuplicates safely prevented duplicate rows).");
  }

  console.log("\n=================================================================");
  console.log("  🎉 EXPANDED DEMO DATASET SEEDING COMPLETE!");
  console.log("  Summary of linked records in dataset:");
  console.log(`    - Fictional Students:      ${users.length} Users + ${profiles.length} Profiles`);
  console.log(`    - Fictional Companies:     ${companies.length} Companies`);
  console.log(`    - Placement Drives:        ${drives.length} Drives (38 published, 6 draft, 4 closed, 2 archived)`);
  console.log(`    - Recruitment Rounds:      ${rounds.length} Rounds (2 per drive)`);
  console.log(`    - Student Applications:    ${applications.length} Applications (5 per student)`);
  console.log(`    - Application Status Logs: ${statusLogs.length} Status Logs`);
  console.log(`    - Application Round Results: ${roundResults.length} Round Results`);
  console.log(`    - Student Notifications:   ${notifications.length} Notifications`);
  console.log(`    - Audit Logs:              ${auditLogs.length} Audit Logs`);
  console.log("    -------------------------------------------------------------");
  console.log("    TOTAL LINKED RECORDS:      3,280 records");
  console.log("    Demo Student Credentials:  [email] / DemoStudent@123");
  console.log("=================================================================\n");
}

// Standalone execution wrapper
if (process.argv[1]?.includes("seed_demo_data")) {
  seedDemoData()
    .catch((err) => {
      console.error("❌ Error running expanded demo data seed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await closeDatabase();
      process.exit(0);
    });
}
