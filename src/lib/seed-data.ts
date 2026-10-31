import { PrismaClient, Role, AccountStatus, DriveStatus, RoundType, ApplicationStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function runSeed(prisma: PrismaClient) {
  console.log("🌱 [Database] Seeding CPMS demo records...");

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("AdminDemo@123", salt);
  const studentPasswordHash = await bcrypt.hash("StudentDemo@123", salt);

  // 1. Upsert Placement Administrator
  const admin = await prisma.user.upsert({
    where: { email: "admin@placement.edu" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Prof. Rajesh Kumar (Placement Officer)",
    },
    create: {
      name: "Prof. Rajesh Kumar (Placement Officer)",
      email: "admin@placement.edu",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  // 2. Upsert Student 1: Aarav Sharma (Eligible CSE 2026)
  const student1 = await prisma.user.upsert({
    where: { email: "aarav.sharma@student.edu" },
    update: {
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      name: "Aarav Sharma",
    },
    create: {
      name: "Aarav Sharma",
      email: "aarav.sharma@student.edu",
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student1.id },
    update: {
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 8.75,
      skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"],
      phone: "+91 98765 43210",
      studentNumber: "CS22B1042",
    },
    create: {
      userId: student1.id,
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 8.75,
      skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"],
      phone: "+91 98765 43210",
      studentNumber: "CS22B1042",
    },
  });

  // 3. Upsert Student 2: Priya Patel (ECE 2026)
  const student2 = await prisma.user.upsert({
    where: { email: "priya.patel@student.edu" },
    update: {
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      name: "Priya Patel",
    },
    create: {
      name: "Priya Patel",
      email: "priya.patel@student.edu",
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {
      department: "Electronics & Communication Engineering",
      graduationYear: 2026,
      cgpa: 7.4,
      skills: ["C++", "Embedded Systems", "MATLAB", "Python", "Verilog"],
      phone: "+91 98765 43211",
      studentNumber: "EC22B1018",
    },
    create: {
      userId: student2.id,
      department: "Electronics & Communication Engineering",
      graduationYear: 2026,
      cgpa: 7.4,
      skills: ["C++", "Embedded Systems", "MATLAB", "Python", "Verilog"],
      phone: "+91 98765 43211",
      studentNumber: "EC22B1018",
    },
  });

  // 4. Upsert Student 3: Rahul Verma (Incomplete Profile)
  const student3 = await prisma.user.upsert({
    where: { email: "rahul.verma@student.edu" },
    update: {
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      name: "Rahul Verma",
    },
    create: {
      name: "Rahul Verma",
      email: "rahul.verma@student.edu",
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student3.id },
    update: {
      department: "Mechanical Engineering",
      graduationYear: 2026,
      cgpa: null,
      skills: [],
      studentNumber: "ME22B1005",
    },
    create: {
      userId: student3.id,
      department: "Mechanical Engineering",
      graduationYear: 2026,
      cgpa: null,
      skills: [],
      studentNumber: "ME22B1005",
    },
  });

  // 5. Companies
  const acme = await prisma.company.upsert({
    where: { id: "comp-acme-tech" },
    update: {},
    create: {
      id: "comp-acme-tech",
      name: "Acme Cloud Solutions",
      description: "Leading enterprise cloud infrastructure and SaaS platform engineering company.",
      website: "https://acme-cloud-example.com",
      industry: "Information Technology & Software",
      location: "Bangalore, India",
    },
  });

  const apex = await prisma.company.upsert({
    where: { id: "comp-apex-analytics" },
    update: {},
    create: {
      id: "comp-apex-analytics",
      name: "Apex Quantitative Systems",
      description: "Global fintech group specializing in algorithmic execution and high-frequency trading analytics.",
      website: "https://apex-systems-example.com",
      industry: "Financial Services & Quant Analytics",
      location: "Mumbai, India",
    },
  });

  const novus = await prisma.company.upsert({
    where: { id: "comp-novus-robotics" },
    update: {},
    create: {
      id: "comp-novus-robotics",
      name: "Novus Robotics & IoT",
      description: "Next-generation industrial automation, robotics controllers, and smart edge hardware.",
      website: "https://novus-robotics-example.com",
      industry: "Robotics & Hardware Engineering",
      location: "Pune, India",
    },
  });

  // 6. Placement Drives
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  // Drive 1: Acme Software Engineer (Open, published)
  const drive1 = await prisma.placementDrive.upsert({
    where: { id: "drive-acme-sde" },
    update: {
      deadlineAt: twoWeeksLater,
      status: DriveStatus.PUBLISHED,
    },
    create: {
      id: "drive-acme-sde",
      companyId: acme.id,
      title: "Associate Software Engineer (Full Stack)",
      jobDescription:
        "We are looking for motivated software engineering graduates to join our Core Platform Engineering team. You will build high-throughput microservices, modern interactive web clients, and distributed APIs.",
      jobType: "Full-time",
      location: "Bangalore (Hybrid)",
      salaryMin: 12.0,
      salaryMax: 16.5,
      salaryDisplay: "₹12.0 - ₹16.5 LPA",
      deadlineAt: twoWeeksLater,
      status: DriveStatus.PUBLISHED,
      eligibleBranches: ["Computer Science & Engineering", "Information Technology"],
      eligibleGradYears: [2026],
      minimumCgpa: 7.5,
      requiredSkills: ["React", "TypeScript", "SQL"],
      createdById: admin.id,
    },
  });

  await prisma.recruitmentRound.upsert({
    where: { id: "round-acme-1" },
    update: {},
    create: {
      id: "round-acme-1",
      placementDriveId: drive1.id,
      name: "Round 1: Online Coding & Data Structures",
      roundType: RoundType.ONLINE_ASSESSMENT,
      sequence: 1,
      scheduledAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      description: "90-minute online coding challenge covering algorithms, data structures, and SQL queries.",
    },
  });

  await prisma.recruitmentRound.upsert({
    where: { id: "round-acme-2" },
    update: {},
    create: {
      id: "round-acme-2",
      placementDriveId: drive1.id,
      name: "Round 2: Technical Architecture & Problem Solving",
      roundType: RoundType.TECHNICAL_INTERVIEW,
      sequence: 2,
      scheduledAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      description: "1-on-1 virtual interview with Senior Staff Engineers.",
    },
  });

  // Drive 2: Apex Quant Analyst (Open, published)
  await prisma.placementDrive.upsert({
    where: { id: "drive-apex-quant" },
    update: {
      deadlineAt: oneMonthLater,
      status: DriveStatus.PUBLISHED,
    },
    create: {
      id: "drive-apex-quant",
      companyId: apex.id,
      title: "Quantitative Systems Analyst",
      jobDescription:
        "Join our quantitative trading engineering desk. You will design statistical models, analyze tick-level market structures, and build automated performance backtesting pipelines.",
      jobType: "Full-time",
      location: "Mumbai",
      salaryMin: 18.0,
      salaryMax: 24.0,
      salaryDisplay: "₹18.0 - ₹24.0 LPA",
      deadlineAt: oneMonthLater,
      status: DriveStatus.PUBLISHED,
      eligibleBranches: ["Computer Science & Engineering", "Electronics & Communication Engineering"],
      eligibleGradYears: [2026],
      minimumCgpa: 8.0,
      requiredSkills: ["Python", "SQL", "Statistics"],
      createdById: admin.id,
    },
  });

  // Drive 3: Novus Embedded Engineer (Open, published)
  await prisma.placementDrive.upsert({
    where: { id: "drive-novus-firmware" },
    update: {
      deadlineAt: twoWeeksLater,
      status: DriveStatus.PUBLISHED,
    },
    create: {
      id: "drive-novus-firmware",
      companyId: novus.id,
      title: "Embedded Firmware Engineer",
      jobDescription:
        "Develop real-time firmware for ARM Cortex microcontrollers and industrial robotics motor control units.",
      jobType: "Full-time",
      location: "Pune",
      salaryMin: 9.0,
      salaryMax: 12.0,
      salaryDisplay: "₹9.0 - ₹12.0 LPA",
      deadlineAt: twoWeeksLater,
      status: DriveStatus.PUBLISHED,
      eligibleBranches: ["Electronics & Communication Engineering", "Electrical Engineering"],
      eligibleGradYears: [2026],
      minimumCgpa: 7.0,
      requiredSkills: ["C++", "Embedded Systems"],
      createdById: admin.id,
    },
  });

  // Drive 4: Draft Drive
  await prisma.placementDrive.upsert({
    where: { id: "drive-acme-draft" },
    update: {},
    create: {
      id: "drive-acme-draft",
      companyId: acme.id,
      title: "DevOps & Cloud Intern (Summer 2026)",
      jobDescription: "Draft posting under review by placement coordinator.",
      deadlineAt: twoWeeksLater,
      status: DriveStatus.DRAFT,
      eligibleBranches: ["Computer Science & Engineering"],
      eligibleGradYears: [2026],
      minimumCgpa: 7.0,
      requiredSkills: ["Docker", "Linux"],
      createdById: admin.id,
    },
  });

  // Drive 5: Closed Drive
  await prisma.placementDrive.upsert({
    where: { id: "drive-past-closed" },
    update: {},
    create: {
      id: "drive-past-closed",
      companyId: apex.id,
      title: "Research Analyst (Winter Drive)",
      jobDescription: "Previous recruitment drive that has concluded its application intake.",
      deadlineAt: pastDate,
      status: DriveStatus.CLOSED,
      eligibleBranches: ["Computer Science & Engineering"],
      eligibleGradYears: [2026],
      minimumCgpa: 8.0,
      requiredSkills: ["Python"],
      createdById: admin.id,
    },
  });

  // 7. Sample Application for Aarav Sharma to Acme Software Engineer
  const application1 = await prisma.application.upsert({
    where: {
      studentId_placementDriveId: {
        studentId: student1.id,
        placementDriveId: drive1.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      placementDriveId: drive1.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  const existingLogs = await prisma.applicationStatusLog.count({
    where: { applicationId: application1.id },
  });

  if (existingLogs === 0) {
    await prisma.applicationStatusLog.create({
      data: {
        applicationId: application1.id,
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.SHORTLISTED,
        changedByUserId: admin.id,
        reason: "Cleared resume screening and eligibility benchmark.",
      },
    });
  }

  const existingNotifs = await prisma.notification.count({
    where: { userId: student1.id },
  });

  if (existingNotifs === 0) {
    await prisma.notification.create({
      data: {
        userId: student1.id,
        title: "Application Shortlisted!",
        message: "Congratulations! Your application for Associate Software Engineer at Acme Cloud Solutions has been shortlisted.",
        type: NotificationType.SUCCESS,
        linkUrl: "/student/applications",
      },
    });

    await prisma.notification.create({
      data: {
        userId: student1.id,
        title: "Campus Drive Announcement",
        message: "Apex Quantitative Systems has published their campus placement drive. Review eligibility and apply before the deadline.",
        type: NotificationType.INFO,
        linkUrl: "/student/drives",
      },
    });
  }

  console.log("✓ [Database] Demo records seeded successfully!");
}
