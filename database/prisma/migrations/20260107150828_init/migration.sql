-- CreateEnum
CREATE TYPE "Month" AS ENUM ('JANUARY', 'FEBUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');

-- CreateTable
CREATE TABLE "Workspace" (
    "workspaceID" VARCHAR(40) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("workspaceID")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeID" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "specialism" TEXT[],
    "excludeFromAI" BOOLEAN NOT NULL,
    "workspaceID" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeID")
);

-- CreateTable
CREATE TABLE "Job" (
    "jobCode" VARCHAR(25) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "timeBudget" INTEGER,
    "monetaryBudget" MONEY,
    "startDate" TIMESTAMP(3) NOT NULL,
    "finishDate" TIMESTAMP(3),
    "workspaceID" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("jobCode")
);

-- CreateTable
CREATE TABLE "ForcastEntry" (
    "employeeID" INTEGER NOT NULL,
    "jobCode" TEXT NOT NULL,
    "cusomter" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" MONEY,
    "days" DOUBLE PRECISION NOT NULL,
    "month" "Month" NOT NULL,
    "workspaceID" TEXT NOT NULL,

    CONSTRAINT "ForcastEntry_pkey" PRIMARY KEY ("employeeID","jobCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_workspaceID_key" ON "Workspace"("workspaceID");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeID_key" ON "Employee"("employeeID");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobCode_key" ON "Job"("jobCode");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_workspaceID_fkey" FOREIGN KEY ("workspaceID") REFERENCES "Workspace"("workspaceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workspaceID_fkey" FOREIGN KEY ("workspaceID") REFERENCES "Workspace"("workspaceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForcastEntry" ADD CONSTRAINT "ForcastEntry_employeeID_fkey" FOREIGN KEY ("employeeID") REFERENCES "Employee"("employeeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForcastEntry" ADD CONSTRAINT "ForcastEntry_jobCode_fkey" FOREIGN KEY ("jobCode") REFERENCES "Job"("jobCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForcastEntry" ADD CONSTRAINT "ForcastEntry_workspaceID_fkey" FOREIGN KEY ("workspaceID") REFERENCES "Workspace"("workspaceID") ON DELETE RESTRICT ON UPDATE CASCADE;
