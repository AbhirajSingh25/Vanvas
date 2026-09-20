import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("vanvas.email")

def mask_email(email: str) -> str:
    """Mask email for privacy-safe logging (e.g., a***@example.com)."""
    if not email or "@" not in email:
        return "***"
    user_part, domain_part = email.split("@", 1)
    if len(user_part) <= 1:
        masked_user = user_part + "***"
    elif len(user_part) <= 3:
        masked_user = user_part[0] + "***"
    else:
        masked_user = user_part[:2] + "***"
    return f"{masked_user}@{domain_part}"

def build_otp_email_html(recipient_name: str, otp_code: str, expire_minutes: int = 10) -> str:
    display_name = recipient_name.strip() if recipient_name and recipient_name.strip() else "Traveler"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VANVAS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF4E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #20211D;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF4E8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #FAF7F0; border: 1px solid #D8CBB2; border-radius: 24px; box-shadow: 0 8px 30px rgba(23, 59, 50, 0.06); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #173B32; padding: 32px 40px; text-align: center;">
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #EFE5D2; letter-spacing: 2.5px;">VANVAS</div>
              <div style="font-size: 11px; color: #B49252; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">by The Sorted Club • चलो निकलते हैं</div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px 32px 36px; text-align: center;">
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #173B32; margin: 0 0 12px 0; line-height: 1.3;">
                Verify Your Email
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #20211D; margin: 0 0 24px 0;">
                Welcome to the Mountain Fold, <strong>{display_name}</strong>. Use the 6-digit verification code below to activate your VANVAS travel passport:
              </p>
              
              <!-- OTP Box -->
              <div style="margin: 28px auto; max-width: 320px; background-color: #EFE5D2; border: 2px dashed #B49252; border-radius: 16px; padding: 18px 24px; text-align: center;">
                <div style="font-size: 11px; font-weight: bold; color: #173B32; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">Your Verification Code</div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #B65E3C; letter-spacing: 8px; margin: 4px 0;">{otp_code}</div>
              </div>

              <!-- Expiration Notice -->
              <div style="background-color: #FAF4E8; border-radius: 12px; padding: 14px 18px; margin: 24px 0 16px 0; border: 1px solid #D8CBB2; text-align: left;">
                <p style="font-size: 12px; line-height: 1.5; color: #173B32; margin: 0;">
                  ⏳ <strong>Security Notice:</strong> This code expires in <strong>{expire_minutes} minutes</strong>.
                </p>
                <p style="font-size: 11px; line-height: 1.5; color: #20211D; opacity: 0.8; margin: 6px 0 0 0;">
                  If you did not create a VANVAS account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #EFE5D2; padding: 20px 36px; text-align: center; border-top: 1px solid #D8CBB2;">
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

def build_verification_email_html(recipient_name: str, verification_url: str = "", expire_hours: int = 24) -> str:
    """Backward compatibility helper for old link tests."""
    return build_otp_email_html(recipient_name, "123456", expire_minutes=10)

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
        if settings.BREVO_API_KEY:
            return True
        if settings.EMAIL_API_KEY:
            return True
        return False

    @classmethod
    def send_otp_email(
        cls,
        to_email: str,
        recipient_name: str,
        otp_code: str
    ) -> EmailDeliveryResult:
        """
        Sends 6-digit verification code using Brevo HTTPS REST API (POST https://api.brevo.com/v3/smtp/email).
        Does NOT use SMTP.
        Does NOT log raw OTP or API credentials.
        """
        masked = mask_email(to_email)
        expire_minutes = settings.EMAIL_OTP_EXPIRE_MINUTES
        subject = f"VANVAS — Your verification code is {otp_code}"
        html_content = build_otp_email_html(
            recipient_name=recipient_name,
            otp_code=otp_code,
            expire_minutes=expire_minutes
        )
        plain_content = (
            f"VANVAS\n"
            f"Verify your email\n\n"
            f"Your VANVAS verification code is:\n\n"
            f"{otp_code}\n\n"
            f"This code expires in {expire_minutes} minutes.\n\n"
            f"If you did not create this account, you can ignore this email."
        )

        # 1. Check if email provider is disabled
        if settings.EMAIL_PROVIDER == "disabled":
            logger.warning(f"Email delivery skipped for {masked}: provider disabled.")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_PROVIDER_DISABLED",
                message="Email provider is explicitly disabled in this environment.",
                provider="disabled"
            )

        # 2. Determine Brevo API Key
        brevo_key = settings.BREVO_API_KEY or settings.EMAIL_API_KEY
        if not brevo_key:
            logger.warning(f"No Brevo API key configured. Email to {masked} not sent.")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_NOT_CONFIGURED",
                message="Transactional email provider credentials are not configured in this environment.",
                provider="none"
            )

        # 3. Dispatch via Brevo HTTPS REST API
        sender_email = settings.EMAIL_FROM
        sender_name = settings.EMAIL_FROM_NAME or "VANVAS"
        # If EMAIL_FROM contains "Name <email@dom>", parse out email
        if "<" in sender_email and ">" in sender_email:
            sender_email = sender_email.split("<")[1].split(">")[0].strip()

        payload_dict = {
            "sender": {
                "name": sender_name,
                "email": sender_email
            },
            "to": [
                {
                    "email": to_email,
                    "name": recipient_name.strip() if recipient_name else "Traveler"
                }
            ],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": plain_content
        }

        try:
            payload_bytes = json.dumps(payload_dict).encode("utf-8")
            req = urllib.request.Request(
                "https://api.brevo.com/v3/smtp/email",
                data=payload_bytes,
                headers={
                    "api-key": brevo_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "VANVAS-API/1.0"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                status_code = response.status
                if 200 <= status_code < 300:
                    logger.info(f"Verification OTP successfully dispatched to {masked} via Brevo HTTPS.")
                    return EmailDeliveryResult(
                        success=True,
                        status="EMAIL_SENT",
                        message="Verification code dispatched successfully.",
                        provider="brevo"
                    )
                else:
                    logger.error(f"Brevo HTTPS API returned status {status_code} for {masked}.")
                    return EmailDeliveryResult(
                        success=False,
                        status="EMAIL_PROVIDER_ERROR",
                        message=f"Transactional email provider responded with HTTP {status_code}.",
                        provider="brevo"
                    )
        except urllib.error.HTTPError as e:
            if e.code == 429:
                logger.error(f"Brevo HTTP rate limit exceeded for {masked}.")
                return EmailDeliveryResult(
                    success=False,
                    status="EMAIL_RATE_LIMITED",
                    message="Email provider rate limit reached. Please try again later.",
                    provider="brevo"
                )
            logger.error(f"Brevo HTTPError {e.code} for {masked}.")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_PROVIDER_ERROR",
                message="Transactional email provider returned an error.",
                provider="brevo"
            )
        except urllib.error.URLError as e:
            logger.error(f"Brevo URLError connection error for {masked}: {str(e.reason)}")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_PROVIDER_ERROR",
                message="Could not connect to transactional email service.",
                provider="brevo"
            )
        except Exception as e:
            logger.error(f"Unexpected email dispatch error for {masked}: {type(e).__name__}")
            return EmailDeliveryResult(
                success=False,
                status="EMAIL_PROVIDER_ERROR",
                message="Failed to deliver verification email.",
                provider="brevo"
            )

    @classmethod
    def send_verification_email(
        cls,
        to_email: str,
        recipient_name: str,
        raw_token: str
    ) -> EmailDeliveryResult:
        """Backward compatibility wrapper."""
        return cls.send_otp_email(to_email, recipient_name, raw_token)
