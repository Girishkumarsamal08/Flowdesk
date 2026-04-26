import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EmailService")

class EmailService:
    def _generate_html_template(self, customer_name, content, company_name):
        """
        Generates a premium Amazon-style HTML email.
        """
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .header {{ text-align: center; margin-bottom: 40px; }}
                .logo {{ font-size: 24px; font-weight: 800; letter-spacing: -1px; color: #000; text-transform: lowercase; }}
                .content {{ background: #fff; padding: 0 10px; }}
                .greeting {{ font-size: 18px; font-weight: 500; margin-bottom: 20px; color: #111; }}
                .body-text {{ font-size: 15px; color: #444; margin-bottom: 30px; white-space: pre-wrap; }}
                .footer {{ background: #f6f6f6; padding: 30px; margin-top: 40px; font-size: 12px; color: #777; border-radius: 4px; }}
                .footer-logo {{ font-size: 16px; font-weight: 700; color: #999; margin-top: 15px; display: block; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="logo">{company_name.lower()}.in</span>
                </div>
                <div class="content">
                    <div class="greeting">Dear {customer_name},</div>
                    <div class="body-text">{content}</div>
                </div>
                <div class="footer">
                    ©2026 {company_name}, Inc. or its affiliates. All rights reserved.
                    <br><br>
                    This is an automated support notification. Please do not share sensitive information.
                    <span class="footer-logo">{company_name.lower()}</span>
                </div>
            </div>
        </body>
        </html>
        """

    def send_customer_email(self, recipient: str, subject: str, body: str, company_name: str, customer_name: str, smtp_config: dict = None):
        """
        Sends a real email via Gmail SMTP using dynamic company credentials.
        """
        # 1. Determine which credentials to use
        sender_email = smtp_config.get("email") if smtp_config else os.getenv("SUPPORT_EMAIL")
        password = smtp_config.get("password") if smtp_config else os.getenv("SUPPORT_PASS")

        if not sender_email or not password or "your-email" in sender_email:
            logger.warning(f"SKIPPING REAL EMAIL for {company_name}: Credentials not configured.")
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{company_name} Support <{sender_email}>"
            msg['To'] = recipient
            msg['Subject'] = subject
            
            # Generate the Amazon-style HTML
            html_content = self._generate_html_template(customer_name, body, company_name)
            
            # Attach both plain and html versions
            msg.attach(MIMEText(body, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, password)
                server.send_message(msg)
            
            logger.info(f"EMAIL SENT: Professional HTML delivered to {recipient}")
            return True
        except Exception as e:
            logger.error(f"EMAIL ERROR: {e}")
            return False

email_service = EmailService()
