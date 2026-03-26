import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import sgMail from '@sendgrid/mail';

export enum NotificationType {
  QUOTE_CREATED = 'quote_created',
  QUOTE_RESPONSE = 'quote_response',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_REJECTED = 'quote_rejected',
  VENDOR_APPROVED = 'vendor_approved',
  VENDOR_REJECTED = 'vendor_rejected',
  CREDIT_PURCHASED = 'credit_purchased',
  CREDIT_USED = 'credit_used',
  ADMIN_ACTION = 'admin_action'
}

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly fromEmail: string;
  private readonly isEmailEnabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY', '').trim();
    this.fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@idealweddings.local');
    this.isEmailEnabled = apiKey.length > 0;
    if (this.isEmailEnabled) {
      sgMail.setApiKey(apiKey);
    }
  }

  onModuleInit(): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const emailRequired =
      this.configService.get<string>('EMAIL_REQUIRED', 'false').toLowerCase() === 'true';

    if (isProduction && emailRequired && !this.isEmailEnabled) {
      throw new Error(
        'EMAIL_REQUIRED is true but SENDGRID_API_KEY is missing. Set SENDGRID_API_KEY and FROM_EMAIL.',
      );
    }
  }

  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Send to notification service (if exists) or directly to user
      await firstValueFrom(
        this.httpService.post('/api/v1/notifications', {
          ...notification,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async notifyQuoteCreated(quoteId: string, userId: string, vendorIds: string[]): Promise<void> {
    // Notify vendors about new quote
    for (const vendorId of vendorIds) {
      await this.sendNotification({
        userId: vendorId,
        type: NotificationType.QUOTE_CREATED,
        title: 'New Quote Request',
        message: 'You have received a new quote request',
        data: { quoteId, userId },
        priority: 'medium',
      });
    }

    // Notify user that quote was sent
    await this.sendNotification({
      userId,
      type: NotificationType.QUOTE_CREATED,
      title: 'Quote Sent',
      message: 'Your quote request has been sent to vendors',
      data: { quoteId, vendorCount: vendorIds.length },
      priority: 'low',
    });
  }

  async sendQuoteRequestEmails(
    vendors: Array<{ id: string; email?: string; businessName?: string }>,
    payload: {
      quoteId: string;
      coupleId: string;
      serviceCategory: string;
      location?: string;
      budgetMin?: number;
      budgetMax?: number;
    },
  ): Promise<void> {
    for (const vendor of vendors) {
      if (!vendor.email) {
        continue;
      }

      if (!this.isEmailEnabled) {
        console.warn(
          `[Email disabled] Would send quote request email to ${vendor.email} for quote ${payload.quoteId}`,
        );
        continue;
      }

      try {
        await sgMail.send({
          to: vendor.email,
          from: this.fromEmail,
          subject: `New quote request: ${payload.serviceCategory}`,
          text: [
            `Hello ${vendor.businessName || 'Vendor'},`,
            '',
            'You have a new quote request from a couple.',
            `Quote ID: ${payload.quoteId}`,
            `Couple ID: ${payload.coupleId}`,
            `Category: ${payload.serviceCategory}`,
            `Location: ${payload.location || 'N/A'}`,
            `Budget: ${payload.budgetMin ?? 'N/A'} - ${payload.budgetMax ?? 'N/A'}`,
          ].join('\n'),
        });
      } catch (error) {
        // Keep main quote flow resilient even if email provider fails.
        console.error(`Failed to send vendor email for quote ${payload.quoteId}:`, error);
      }
    }
  }

  async notifyQuoteResponse(quoteId: string, userId: string, vendorId: string, responseId: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.QUOTE_RESPONSE,
      title: 'New Quote Response',
      message: 'You have received a response to your quote request',
      data: { quoteId, vendorId, responseId },
      priority: 'high',
    });
  }

  async notifyQuoteAccepted(quoteId: string, vendorId: string, userId: string): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.QUOTE_ACCEPTED,
      title: 'Quote Accepted',
      message: 'Your quote response has been accepted',
      data: { quoteId, userId },
      priority: 'high',
    });
  }

  async notifyQuoteRejected(quoteId: string, vendorId: string, userId: string): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.QUOTE_REJECTED,
      title: 'Quote Rejected',
      message: 'Your quote response was not selected',
      data: { quoteId, userId },
      priority: 'medium',
    });
  }

  async notifyVendorApproved(vendorId: string): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.VENDOR_APPROVED,
      title: 'Vendor Account Approved',
      message: 'Congratulations! Your vendor account has been approved',
      data: { vendorId },
      priority: 'high',
    });
  }

  async notifyVendorRejected(vendorId: string, reason?: string): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.VENDOR_REJECTED,
      title: 'Vendor Account Rejected',
      message: reason || 'Your vendor account application was not approved',
      data: { vendorId, reason },
      priority: 'high',
    });
  }

  async notifyCreditPurchased(vendorId: string, amount: number): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.CREDIT_PURCHASED,
      title: 'Credits Purchased',
      message: `You have successfully purchased ${amount} credits`,
      data: { vendorId, amount },
      priority: 'medium',
    });
  }

  async notifyCreditUsed(vendorId: string, amount: number, description: string): Promise<void> {
    await this.sendNotification({
      userId: vendorId,
      type: NotificationType.CREDIT_USED,
      title: 'Credits Used',
      message: `${amount} credits used: ${description}`,
      data: { vendorId, amount, description },
      priority: 'low',
    });
  }

  async notifyAdminAction(adminId: string, action: string, targetId: string, targetType: string): Promise<void> {
    // This could be sent to an admin notification system
    await this.sendNotification({
      userId: adminId,
      type: NotificationType.ADMIN_ACTION,
      title: 'Admin Action Logged',
      message: `Action: ${action} on ${targetType} ${targetId}`,
      data: { adminId, action, targetId, targetType },
      priority: 'low',
    });
  }
}
