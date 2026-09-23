-- CreateTable
CREATE TABLE "HandoverDocument" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "custodyRecordId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'HANDOVER',
    "status" TEXT NOT NULL DEFAULT 'PENDING_EMPLOYEE_SIGNATURE',
    "employeeSignedAt" TIMESTAMP(3),
    "adminSignedAt" TIMESTAMP(3),
    "employeeSignature" TEXT,
    "adminSignature" TEXT,
    "pdfData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HandoverDocument_documentId_key" ON "HandoverDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverDocument_custodyRecordId_key" ON "HandoverDocument"("custodyRecordId");

-- CreateIndex
CREATE INDEX "HandoverDocument_employeeId_idx" ON "HandoverDocument"("employeeId");

-- CreateIndex
CREATE INDEX "HandoverDocument_assetId_idx" ON "HandoverDocument"("assetId");

-- CreateIndex
CREATE INDEX "HandoverDocument_status_idx" ON "HandoverDocument"("status");

-- AddForeignKey
ALTER TABLE "HandoverDocument" ADD CONSTRAINT "HandoverDocument_custodyRecordId_fkey" FOREIGN KEY ("custodyRecordId") REFERENCES "CustodyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverDocument" ADD CONSTRAINT "HandoverDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverDocument" ADD CONSTRAINT "HandoverDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
