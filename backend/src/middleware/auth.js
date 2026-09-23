import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Invalid token format.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        'enterprise_asset_management_jwt_super_secret_key_2026_xyz'
    );

    // Check if user still exists and load RBAC + Employee information
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,

        // Employee account relationship
        employeeId: true,

        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            department: true,
            designation: true,
            manager: true,
            employmentType: true,
            workLocation: true,
            employmentStatus: true,
            joinDate: true,
            exitDate: true,
            dob: true,
            gender: true,
            bloodGroup: true,
            phone: true,
            address: true,
            profilePhoto: true
          }
        },

        // RBAC information
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'User account associated with token not found.'
      });
    }

    // Attach authentication, RBAC and employee information
    // to the request object.
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,

      role: user.role?.name || null,

      permissions:
        user.role?.permissions.map(
          item => item.permission.name
        ) || [],

      employeeId: user.employeeId || null,

      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            name: user.employee.name,
            email: user.employee.email,
            department: user.employee.department,
            designation: user.employee.designation,
            manager: user.employee.manager,
            employmentType: user.employee.employmentType,
            workLocation: user.employee.workLocation,
            employmentStatus: user.employee.employmentStatus,
            joinDate: user.employee.joinDate,
            exitDate: user.employee.exitDate,
            dob: user.employee.dob,
            gender: user.employee.gender,
            bloodGroup: user.employee.bloodGroup,
            phone: user.employee.phone,
            address: user.employee.address,
            profilePhoto: user.employee.profilePhoto
          }
        : null
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Session expired. Please log in again.'
      });
    }

    return res.status(401).json({
      message: 'Invalid authentication token.'
    });
  }
}