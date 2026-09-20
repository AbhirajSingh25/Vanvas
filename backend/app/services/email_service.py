import json
import logging
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("vanvas.email")

def build_verification_email_html(recipient_name: str, verification_url: str, expire_hours: int = 24) -> str:
    display_name = recipient_name.strip() if recipient_name and recipient_name.strip() else "Traveler"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your VANVAS account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF4E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #20211D;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF4E8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" max-width="580" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FAF7F0; border: 1px solid #D8CBB2; border-radius: 24px; box-shadow: 0 8px 30px rgba(23, 59, 50, 0.06); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #173B32; padding: 32px 40px; text-align: center;">
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #EFE5D2; letter-spacing: 2px;">VANVAS</div>
              <div style="font-size: 11px; color: #B49252; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">by The Sorted Club • चलो निकलते हैं</div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px 32px 36px;">
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #173B32; margin: 0 0 16px 0; line-height: 1.3;">
                Welcome to the Mountain Fold, {display_name}
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #20211D; margin: 0 0 20px 0;">
                Thank you for creating your VANVAS travel passport. To activate your account and start curating thoughtful Himalayan expeditions, please verify your email address.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{verification_url}" target="_blank" style="display: inline-block; background-color: #B65E3C; color: #EFE5D2; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; padding: 14px 32px; border-radius: 16px; box-shadow: 0 4px 14px rgba(182, 94, 60, 0.35);">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <div style="background-color: #EFE5D2; border-radius: 12px; padding: 14px 18px; margin: 24px 0 20px 0; border-left: 3px solid #B49252;">
                <p style="font-size: 12px; line-height: 1.5; color: #173B32; margin: 0;">
                  ⏳ <strong>Security Notice:</strong> This verification link will expire in <strong>{expire_hours} hours</strong>. If you did not create a VANVAS account, you can safely ignore this email.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="font-size: 12px; line-height: 1.5; color: #20211D; opacity: 0.8; margin: 24px 0 8px 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <div style="font-size: 11px; word-break: break-all; color: #B65E3C; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #D8CBB2;">
                {verification_url}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #EFE5D2; padding: 24px 36px; text-align: center; border-top: 1px solid #D8CBB2;">
              <p style="font-size: 11px; color: #20211D; opacity: 0.7; margin: 0; line-height: 1.4;">
                VANVAS — Spontaneous AI Travel Companion & Mountain Operating Layer<br>
                Crafted for thoughtful Indian mountain journeys.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

class EmailDeliveryResult:
    def __init__(self, success: bool, status: str, message: str, provider: str = "none"):
        self.success = success
        self.status = status
        self.message = message
        self.provider = provider

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "status": self.status,
            "message": self.message,
            "provider": self.provider
        }

class EmailService:
    @staticmethod
    def is_configured() -> bool:
        if settings.EMAIL_PROVIDER == "disabled":
            return False
        if settings.EMAIL_API_KEY:
            return True
        if settings.SMTP_HOST and settings.SMTP_USER:
            return True
        return False

    @classmethod
    def send_verification_email(
        cls,
        to_email: str,
        recipient_name: str,
        raw_token: str
    ) -> EmailDeliveryResult:
        """
        Sends account verification email using the configured transactional provider.
        Does NOT log secret tokens.
        """
        public_url = (settings.APP_PUBLIC_URL or "https://vanvasai.vercel.app").rstrip("/")
        verification_url = f"{public_url}/verify-email?token={raw_token}"
        subject = "Verify your VANVAS account"
        html_content = build_verification_email_html(
            recipient_name=recipient_name,
            verification_url=verification_url,
            expire_hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS
        )
        plain_content = (
            f"Hello {recipient_name},\n\n"
            f"Please verify your VANVAS account by visiting the following link within {settings.EMAIL_VERIFICATION_EXPIRE_HOURS} hours:\n"
            f"{verification_url}\n\n"
            f"If you did not register for VANVAS, please ignore this email."
        )

        # 1. Check if disabled or missing credentials
        if settings.EMAIL_PROVIDER == "disabled":
            logger.warning(f"Email delivery skipped for {to_email}: provider disabled.")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_PROVIDER_DISABLED",
                message="Email provider is explicitly disabled.",
                provider="disabled"
            )

        # 2. Resend API Provider (if EMAIL_API_KEY is present)
        if settings.EMAIL_API_KEY:
            try:
                payload = json.dumps({
                    "from": settings.EMAIL_FROM,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                    "text": plain_content
                }).encode("utf-8")

                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=payload,
                    headers={
                        "Authorization": f"Bearer {settings.EMAIL_API_KEY}",
                        "Content-Type": "application/json",
                        "User-Agent": "VANVAS-API/1.0"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = response.read().decode("utf-8")
                    if 200 <= response.status < 300:
                        logger.info(f"Verification email dispatched to {to_email} via Resend.")
                        return EmailDeliveryResult(
                            success=True,
                            status="DELIVERED",
                            message="Verification email dispatched successfully.",
                            provider="resend"
                        )
                    else:
                        logger.error(f"Resend API error for {to_email}: HTTP {response.status}")
                        return EmailDeliveryResult(
                            success=False,
                            status="PROVIDER_ERROR",
                            message=f"Email provider responded with HTTP {response.status}",
                            provider="resend"
                        )
            except urllib.error.HTTPError as e:
                err_body = ""
                try:
                    err_body = e.read().decode("utf-8")
                except Exception:
                    pass
                logger.error(f"Resend HTTPError for {to_email}: {e.code} - {err_body}")
                return EmailDeliveryResult(
                    success=False,
                    status="PROVIDER_HTTP_ERROR",
                    message=f"Email provider returned error {e.code}",
                    provider="resend"
                )
            except Exception as e:
                logger.error(f"Resend connection failure for {to_email}: {str(e)}")
                return EmailDeliveryResult(
                    success=False,
                    status="PROVIDER_CONNECTION_FAILED",
                    message=f"Could not connect to transactional email service.",
                    provider="resend"
                )

        # 3. SMTP Provider (if SMTP_HOST configured)
        if settings.SMTP_HOST:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM
                msg["To"] = to_email

                part1 = MIMEText(plain_content, "plain", "utf-8")
                part2 = MIMEText(html_content, "html", "utf-8")
                msg.attach(part1)
                msg.attach(part2)

                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
                server.quit()

                logger.info(f"Verification email dispatched to {to_email} via SMTP.")
                return EmailDeliveryResult(
                    success=True,
                    status="DELIVERED",
                    message="Verification email sent via SMTP.",
                    provider="smtp"
                )
            except Exception as e:
                logger.error(f"SMTP error for {to_email}: {str(e)}")
                return EmailDeliveryResult(
                    success=False,
                    status="SMTP_ERROR",
                    message="Failed to deliver email through SMTP server.",
                    provider="smtp"
                )

        # 4. No Provider Configured
        logger.warning(f"No transactional email credentials configured. Email to {to_email} not sent.")
        return EmailDeliveryResult(
            success=False,
            status="EMAIL_NOT_CONFIGURED",
            message="No email provider credentials are configured in this environment.",
            provider="none"
        )
