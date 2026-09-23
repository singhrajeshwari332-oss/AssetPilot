import prisma from '../lib/prisma.js';
import { logAudit } from '../services/auditService.js';

export async function getEmployees(req, res, next) {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (department && department !== 'ALL') {
      where.department = department;
    }

    if (search && search.trim() !== '') {
      const s = search.trim();

      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { employeeId: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { department: { contains: s, mode: 'insensitive' } },
        { designation: { contains: s, mode: 'insensitive' } }
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),

      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          custodyRecords: {
            where: { checkinDate: null },
            include: { asset: true }
          },

          licenseAllocations: {
            where: { status: 'ACTIVE' },
            include: { asset: true }
          }
        }
      })
    ]);

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      activeAssetsCount: emp.custodyRecords.length,
      activeLicensesCount: emp.licenseAllocations.length,
      currentAssets: emp.custodyRecords.map(c => c.asset),
      currentLicenses: emp.licenseAllocations.map(l => l.asset)
    }));

    res.json({
      data: formattedEmployees,

      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        custodyRecords: {
          orderBy: { checkoutDate: 'desc' },
          include: { asset: true }
        },

        licenseAllocations: {
          orderBy: { allocatedAt: 'desc' },
          include: { asset: true }
        },

        returnRequests: {
          orderBy: { requestedAt: 'desc' },
          include: { asset: true }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found.'
      });
    }

    /*
     * Employees are allowed to VIEW employee details.
     *
     * We are intentionally NOT restricting this endpoint,
     * because you said employees should be able to view
     * employee details.
     */

    res.json(employee);
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req, res, next) {
  try {
    /*
     * Employees cannot create employee records.
     */
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        message: 'Employees cannot create employee records.'
      });
    }

    const {
      employeeId,
      name,
      email,
      department,
      designation,
      joinDate,
      dob,
      gender,
      bloodGroup,
      phone,
      address
    } = req.body;

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        message: 'Employee ID is required.'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Employee name is required.'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Email address is required.'
      });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({
        message: 'Department is required.'
      });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({
        message: 'Designation is required.'
      });
    }

    const existingId = await prisma.employee.findUnique({
      where: {
        employeeId: employeeId.trim()
      }
    });

    if (existingId) {
      return res.status(409).json({
        message: `Employee ID ${employeeId.trim()} already exists.`
      });
    }

    const existingEmail = await prisma.employee.findUnique({
      where: {
        email: email.toLowerCase().trim()
      }
    });

    if (existingEmail) {
      return res.status(409).json({
        message: `Email ${email.trim()} is already assigned to another employee.`
      });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        employeeId: employeeId.trim().toUpperCase(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        department: department.trim(),
        designation: designation.trim(),
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        dob: dob ? new Date(dob) : null,
        gender: gender?.trim() || null,
        bloodGroup: bloodGroup?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null
      }
    });

    await logAudit({
      action: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: newEmployee.id,
      details: `Created employee [${newEmployee.employeeId}] ${newEmployee.name} (${newEmployee.department})`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'Employee created successfully.',
      employee: newEmployee
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      department,
      designation,
      joinDate,
      exitDate,
      dob,
      gender,
      bloodGroup,
      phone,
      address
    } = req.body;

    /*
     * EMPLOYEE SECURITY CHECK
     *
     * User.employeeId stores the Employee table UUID.
     *
     * Therefore:
     *
     * req.user.employeeId === req.params.id
     *
     * means the employee is editing their OWN record.
     *
     * We must NOT compare it with employee.employeeId,
     * because employee.employeeId contains values such as
     * EMP-1001.
     */
    if (req.user.role === 'EMPLOYEE') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record.'
        });
      }

      if (req.user.employeeId !== id) {
        return res.status(403).json({
          message: 'You can only edit your own employee information.'
        });
      }
    }

    const existing = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Employee not found.'
      });
    }

    /*
     * Check whether the new email is already being used
     * by another employee.
     */
    if (
      email &&
      email.toLowerCase().trim() !== existing.email
    ) {
      const emailTaken = await prisma.employee.findUnique({
        where: {
          email: email.toLowerCase().trim()
        }
      });

      if (emailTaken && emailTaken.id !== id) {
        return res.status(409).json({
          message: `Email ${email.trim()} is already used by another employee.`
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },

      data: {
        name:
          name !== undefined
            ? name.trim()
            : existing.name,

        email:
          email !== undefined
            ? email.toLowerCase().trim()
            : existing.email,

        department:
          department !== undefined
            ? department.trim()
            : existing.department,

        designation:
          designation !== undefined
            ? designation.trim()
            : existing.designation,

        joinDate:
          joinDate !== undefined
            ? joinDate
              ? new Date(joinDate)
              : existing.joinDate
            : existing.joinDate,

        exitDate:
          exitDate !== undefined
            ? exitDate
              ? new Date(exitDate)
              : null
            : existing.exitDate,

        dob:
          dob !== undefined
            ? dob
              ? new Date(dob)
              : null
            : existing.dob,

        gender:
          gender !== undefined
            ? gender?.trim()
            : existing.gender,

        bloodGroup:
          bloodGroup !== undefined
            ? bloodGroup?.trim()
            : existing.bloodGroup,

        phone:
          phone !== undefined
            ? phone?.trim()
            : existing.phone,

        address:
          address !== undefined
            ? address?.trim()
            : existing.address
      }
    });

    await logAudit({
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      details: `Updated employee [${updated.employeeId}] ${updated.name}`,
      performedBy: req.user.id
    });

    res.json({
      message: 'Employee updated successfully.',
      employee: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    /*
     * Employees cannot delete employee records.
     */
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        message: 'Employees cannot delete employee records.'
      });
    }

    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },

      include: {
        custodyRecords: {
          where: { checkinDate: null }
        },

        licenseAllocations: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found.'
      });
    }

    if (employee.custodyRecords.length > 0) {
      return res.status(400).json({
        message: `Cannot delete employee while they have ${employee.custodyRecords.length} active physical asset(s) checked out.`
      });
    }

    if (employee.licenseAllocations.length > 0) {
      return res.status(400).json({
        message: `Cannot delete employee while they have ${employee.licenseAllocations.length} active software license seat(s). Revoke them first.`
      });
    }

    await prisma.employee.delete({
      where: { id }
    });

    await logAudit({
      action: 'EMPLOYEE_DELETED',
      entityType: 'EMPLOYEE',
      entityId: id,
      details: `Deleted employee [${employee.employeeId}] ${employee.name}`,
      performedBy: req.user.id
    });

    res.json({
      message: `Employee ${employee.name} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}