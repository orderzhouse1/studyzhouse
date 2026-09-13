import type { Request, Response } from "express";

import type {
  AppleIapNotificationBody,
  AppleIapRestoreBody,
  AppleIapVerifyBody,
} from "@studyhouse/shared";
import {
  handleAppleIapServerNotification,
  listStudentCourseEntitlements,
  restoreApplePurchasesForStudent,
  verifyApplePurchaseForCourse,
} from "../services/appleIap.service.js";

export async function verifyAppleIapPurchase(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const body = req.body as AppleIapVerifyBody;

  const result = await verifyApplePurchaseForCourse(studentId, body.courseId, {
    productId: body.productId,
    transactionId: body.transactionId,
    purchaseDate: body.purchaseDate,
    verificationData: body.verificationData,
    environment: body.environment,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function restoreAppleIapPurchases(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const body = req.body as AppleIapRestoreBody;

  const result = await restoreApplePurchasesForStudent(
    studentId,
    body.purchases,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getStudentCourseEntitlements(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const result = await listStudentCourseEntitlements(studentId);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function receiveAppleIapNotification(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as AppleIapNotificationBody;
  const result = await handleAppleIapServerNotification(body.signedPayload);
  res.status(200).json({
    success: true,
    data: result,
  });
}
