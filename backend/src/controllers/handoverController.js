import PDFDocument from "pdfkit";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get documents
export async function getHandoverDocuments(req, res) {
  try {
    const where =
      req.user.role === 'SUPER_ADMIN'
        ? {}
        : { employeeId: req.user.employeeId };

    const documents = await prisma.handoverDocument.findMany({
      where,
      include: {
        employee: true,
        asset: true,
        custodyRecord: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(documents);
  } catch (error) {
    console.error('Get handover documents error:', error);
    res.status(500).json({
      message: 'Failed to fetch handover documents.',
    });
  }
}

// Create a handover document
export async function createHandoverDocument(req, res) {
  try {
    const {
      custodyRecordId,
      employeeId,
      assetId,
      documentType = 'HANDOVER',
    } = req.body;

    if (!custodyRecordId || !employeeId || !assetId) {
      return res.status(400).json({
        message: 'custodyRecordId, employeeId and assetId are required.',
      });
    }

    const document = await prisma.handoverDocument.create({
      data: {
        documentId: `HO-${Date.now()}`,
        custodyRecordId,
        employeeId,
        assetId,
        documentType,
        status: 'PENDING_EMPLOYEE_SIGNATURE',
      },
      include: {
        employee: true,
        asset: true,
        custodyRecord: true,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Create handover document error:', error);
    res.status(500).json({
      message: 'Failed to create handover document.',
    });
  }
}

// Employee signs the handover document
export async function employeeSignHandoverDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.handoverDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        message: 'Handover document not found.',
      });
    }

    // Only the employee assigned to this document can sign it
    if (req.user.employeeId !== document.employeeId) {
      return res.status(403).json({
        message: 'You can only sign your own handover documents.',
      });
    }

    // Employee can sign only at this stage
    if (document.status !== 'PENDING_EMPLOYEE_SIGNATURE') {
      return res.status(400).json({
        message: 'This document is not waiting for employee signature.',
      });
    }

    const updatedDocument = await prisma.handoverDocument.update({
      where: { id },
      data: {
        employeeSignature: 'ACKNOWLEDGED',
        employeeSignedAt: new Date(),
        status: 'PENDING_ADMIN_SIGNATURE',
      },
      include: {
        employee: true,
        asset: true,
        custodyRecord: true,
      },
    });

    res.json({
      message: 'Handover document signed successfully.',
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Employee sign handover error:', error);
    res.status(500).json({
      message: 'Failed to sign handover document.',
    });
  }
}
// SUPER_ADMIN signs the handover document
export async function adminSignHandoverDocument(req, res) {
  try {
    const { id } = req.params;

    // Only SUPER_ADMIN can perform admin signature
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        message: 'Only SUPER_ADMIN can complete the admin signature.',
      });
    }

    const document = await prisma.handoverDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        message: 'Handover document not found.',
      });
    }

    // Employee must sign first
    if (document.status !== 'PENDING_ADMIN_SIGNATURE') {
      return res.status(400).json({
        message: 'This document is not waiting for admin signature.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Complete the handover document
      const updatedDocument = await tx.handoverDocument.update({
        where: { id },
        data: {
          adminSignature: 'APPROVED',
          adminSignedAt: new Date(),
          status: 'COMPLETED',
        },
      });

      // Officially assign the asset
      const updatedAsset = await tx.asset.update({
        where: { id: document.assetId },
        data: {
          status: 'ASSIGNED',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'HANDOVER_COMPLETED',
          entityType: 'HANDOVER_DOCUMENT',
          entityId: document.id,
          performedBy: req.user.id,
          details: JSON.stringify({
            documentId: document.documentId,
            assetId: document.assetId,
            employeeId: document.employeeId,
          }),
        },
      });

      return {
        updatedDocument,
        updatedAsset,
      };
    });

    const finalDocument = await prisma.handoverDocument.findUnique({
      where: { id },
      include: {
        employee: true,
        asset: true,
        custodyRecord: true,
      },
    });

    res.json({
      message: 'Handover completed and asset assigned successfully.',
      document: finalDocument,
      asset: result.updatedAsset,
    });
  } catch (error) {
    console.error('Admin sign handover error:', error);

    res.status(500).json({
      message: 'Failed to complete handover document.',
    });
  }
}
// Download handover document as PDF
export async function downloadHandoverDocumentPdf(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.handoverDocument.findUnique({
      where: { id },
      include: {
        employee: true,
        asset: true,
        custodyRecord: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        message: "Handover document not found.",
      });
    }

    // Employee can download only their own document
    if (
      req.user.role === "EMPLOYEE" &&
      req.user.employeeId !== document.employeeId
    ) {
      return res.status(403).json({
        message: "You can only download your own documents.",
      });
    }

    if (document.status !== "COMPLETED") {
      return res.status(400).json({
        message: "PDF is available only for completed documents.",
      });
    }

    const pdf = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const filename = `${document.documentId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    pdf.pipe(res);

    pdf
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("AssetPilot", {
        align: "center",
      });

    pdf
      .moveDown(0.5)
      .fontSize(16)
      .text("Digital Asset Handover Document", {
        align: "center",
      });

    pdf.moveDown(1);

    pdf
      .fontSize(11)
      .font("Helvetica")
      .text(`Document ID: ${document.documentId}`)
      .text(`Document Type: ${document.documentType}`)
      .text(`Status: ${document.status}`)
      .text(`Created: ${document.createdAt.toLocaleString("en-IN")}`);

    pdf.moveDown(1);

    pdf
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Employee Information");

    pdf.moveDown(0.3);

    pdf
      .fontSize(11)
      .font("Helvetica")
      .text(`Name: ${document.employee?.name || "-"}`)
      .text(
        `Employee ID: ${document.employee?.employeeId || "-"}`
      )
      .text(
        `Department: ${document.employee?.department || "-"}`
      )
      .text(
        `Designation: ${document.employee?.designation || "-"}`
      )
      .text(`Email: ${document.employee?.email || "-"}`)
      .text(`Phone: ${document.employee?.phone || "-"}`);

    pdf.moveDown(1);

    pdf
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Asset Information");

    pdf.moveDown(0.3);

    pdf
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Asset Tag: ${
          document.asset?.assetTag ||
          document.asset?.assetId ||
          "-"
        }`
      )
      .text(
        `Category: ${document.asset?.category || "-"}`
      )
      .text(`Brand: ${document.asset?.brand || "-"}`)
      .text(`Model: ${document.asset?.model || "-"}`)
      .text(
        `Serial Number: ${
          document.asset?.serialNumber ||
          document.asset?.serial ||
          "-"
        }`
      )
      .text(
        `Asset Status: ${document.asset?.status || "-"}`
      );

    pdf.moveDown(1);

    pdf
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Custody Information");

    pdf.moveDown(0.3);

    pdf
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Checkout Date: ${
          document.custodyRecord?.checkoutDate
            ? document.custodyRecord.checkoutDate.toLocaleString(
                "en-IN"
              )
            : "-"
        }`
      )
      .text(
        `Check-in Date: ${
          document.custodyRecord?.checkinDate
            ? document.custodyRecord.checkinDate.toLocaleString(
                "en-IN"
              )
            : "Not returned"
        }`
      )
      .text(
        `Checkout Condition: ${
          document.custodyRecord?.conditionAtCheckout ||
          document.custodyRecord?.checkoutCondition ||
          "-"
        }`
      )
      .text(
        `Check-in Condition: ${
          document.custodyRecord?.conditionAtCheckin ||
          document.custodyRecord?.checkinCondition ||
          "-"
        }`
      );

    pdf.moveDown(1);

    pdf
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Digital Signatures");

    pdf.moveDown(0.3);

    pdf
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Employee Signature: ${
          document.employeeSignedAt
            ? `Signed on ${document.employeeSignedAt.toLocaleString(
                "en-IN"
              )}`
            : "Pending"
        }`
      )
      .text(
        `Admin Signature: ${
          document.adminSignedAt
            ? `Signed on ${document.adminSignedAt.toLocaleString(
                "en-IN"
              )}`
            : "Pending"
        }`
      );

    pdf.moveDown(2);

    pdf
      .fontSize(9)
      .fillColor("gray")
      .text(
        "This document was digitally generated by AssetPilot.",
        {
          align: "center",
        }
      );

    pdf.end();
  } catch (error) {
    console.error(
      "Download handover PDF error:",
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF.",
      });
    }
  }
}