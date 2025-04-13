-- Enum: Role
CREATE TYPE "Role" AS ENUM ('USER', 'TEACHER', 'ADMIN');

-- Table: User
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "login" TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "tempPassword" TEXT,
  "rights" "Role"[] DEFAULT ARRAY['USER']::"Role"[]
);

-- Table: Teacher
CREATE TABLE "Teacher" (
  "id" UUID PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "positionId" UUID NOT NULL,
  "departmentId" UUID NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id"),
  FOREIGN KEY ("positionId") REFERENCES "Position" ("id"),
  FOREIGN KEY ("departmentId") REFERENCES "Department" ("id")
);

-- Table: Position
CREATE TABLE "Position" (
  "id" UUID PRIMARY KEY,
  "title" TEXT UNIQUE NOT NULL
);

-- Table: Department
CREATE TABLE "Department" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL
);

-- Table: Building
CREATE TABLE "Building" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL
);

-- Table: AudienceType
CREATE TABLE "AudienceType" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL
);

-- Table: Audience
CREATE TABLE "Audience" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL,
  "capacity" INT NOT NULL,
  "additionalInfo" TEXT,
  "audienceTypeId" UUID NOT NULL,
  "buildingId" UUID NOT NULL,
  FOREIGN KEY ("audienceTypeId") REFERENCES "AudienceType" ("id"),
  FOREIGN KEY ("buildingId") REFERENCES "Building" ("id")
);

-- Table: Equipment
CREATE TABLE "Equipment" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL
);

-- Table: AudienceEquipment (join table)
CREATE TABLE "AudienceEquipment" (
  "id" UUID PRIMARY KEY,
  "audienceId" UUID NOT NULL,
  "equipmentId" UUID NOT NULL,
  UNIQUE ("audienceId", "equipmentId"),
  FOREIGN KEY ("audienceId") REFERENCES "Audience" ("id"),
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id")
);

-- Table: ScheduleWish
CREATE TABLE "ScheduleWish" (
  "id" TEXT PRIMARY KEY,
  "weekType" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "timeSlot" TEXT NOT NULL,
  "discipline" TEXT,
  "room" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Table: TextWish
CREATE TABLE "TextWish" (
  "id" TEXT PRIMARY KEY,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Table: UploadedFiles
CREATE TABLE "UploadedFiles" (
  "id" UUID PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Table: StudyPlan
CREATE TABLE "StudyPlan" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL
);

-- Table: SemesterWeek
CREATE TABLE "SemesterWeek" (
  "id" TEXT PRIMARY KEY,
  "week_1" INT NOT NULL,
  "week_2" INT NOT NULL,
  "week_3" INT NOT NULL,
  "week_4" INT NOT NULL,
  "week_5" INT NOT NULL,
  "week_6" INT NOT NULL,
  "week_7" INT NOT NULL,
  "week_8" INT NOT NULL,
  "studyPlanId" TEXT NOT NULL,
  FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan" ("id")
);

-- Table: Group
CREATE TABLE "Group" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "count_students" INT NOT NULL,
  "direction" TEXT NOT NULL,
  "formEducation" TEXT NOT NULL,
  "durationPeriod" INT NOT NULL,
  "year_enrollment" TIMESTAMP NOT NULL,
  "studyPlanId" TEXT,
  FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan" ("id")
);

-- Table: Discipline
CREATE TABLE "Discipline" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "semester" INT NOT NULL,
  "lecture_hours" INT,
  "el_lecture_hours" INT,
  "laboratory_hours" INT,
  "el_laboratory_hours" INT,
  "practice_hours" INT,
  "el_practice_hours" INT,
  "control" TEXT,
  "studyPlanId" TEXT NOT NULL,
  FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan" ("id")
);
