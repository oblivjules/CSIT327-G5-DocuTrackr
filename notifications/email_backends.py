"""
Custom email backend for SendGrid using their REST API instead of SMTP.
This is more reliable on cloud platforms like Render that may have SMTP restrictions.
"""
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import logging
from sendgrid import SendGridAPIClient  # pyright: ignore[reportMissingImports]
from sendgrid.helpers.mail import Mail, Email, Content, HtmlContent

logger = logging.getLogger(__name__)


class SendGridAPIBackend(BaseEmailBackend):
    """
    SendGrid email backend using REST API instead of SMTP.
    More reliable on cloud platforms that may block SMTP connections.
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None) or getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError('SENDGRID_API_KEY or EMAIL_HOST_PASSWORD must be set in settings')
            logger.warning("SendGrid API key not found. Email sending will fail.")
            return
        
        try:
            self.sg = SendGridAPIClient(self.api_key)
        except Exception as e:
            if not self.fail_silently:
                raise
            logger.error("Failed to initialize SendGrid client: %s", e)
            self.sg = None
    
    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number of emails sent.
        """
        if not self.sg:
            return 0
        
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                # Extract email details
                from_email = message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
                to_emails = message.to
                subject = message.subject
                
                # Get text and HTML content
                body = message.body
                html_content = None
                
                # Check for alternative content (HTML)
                if hasattr(message, 'alternatives') and message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                            break
                
                # Parse from_email to extract email and name
                # Format: "Name <email@domain.com>" or just "email@domain.com"
                from_email_addr = from_email
                from_name = None
                if '<' in from_email and '>' in from_email:
                    # Extract name and email from "Name <email@domain.com>"
                    parts = from_email.split('<')
                    from_name = parts[0].strip().strip('"').strip("'")
                    from_email_addr = parts[1].split('>')[0].strip()
                
                # Create SendGrid Mail object
                mail = Mail(
                    from_email=(from_email_addr, from_name) if from_name else from_email_addr,
                    to_emails=to_emails,
                    subject=subject,
                    plain_text_content=body if not html_content else None,
                    html_content=html_content if html_content else None
                )
                
                # Add reply-to header (use the actual sender email)
                mail.reply_to = from_email_addr
                
                # Add custom headers to improve deliverability and reduce quarantine risk
                # These headers help mail servers identify legitimate transactional emails
                mail.custom_args = {
                    'category': 'transactional',
                    'source': 'docutrackr'
                }
                
                # Add categories for SendGrid tracking
                mail.categories = ['docutrackr', 'status-update']
                
                # Add CC recipients if any
                if message.cc:
                    mail.add_cc(message.cc)
                
                # Add BCC recipients if any
                if message.bcc:
                    mail.add_bcc(message.bcc)
                
                # Send email
                response = self.sg.send(mail)
                
                # Check response status
                if response.status_code in [200, 201, 202]:
                    num_sent += 1
                    logger.info("Successfully sent email via SendGrid API to %s (status: %d, subject: %s)", 
                               to_emails, response.status_code, subject)
                    # Log response headers for debugging (may contain message ID)
                    if hasattr(response, 'headers'):
                        logger.debug("SendGrid response headers: %s", dict(response.headers))
                else:
                    error_body = response.body.decode('utf-8') if hasattr(response.body, 'decode') else str(response.body)
                    logger.warning("SendGrid API returned status %d: %s", response.status_code, error_body)
                    if not self.fail_silently:
                        raise Exception(f"SendGrid API error: {response.status_code} - {error_body}")
                
            except Exception as e:
                logger.exception("Error sending email via SendGrid API: %s", e)
                if not self.fail_silently:
                    raise
        
        return num_sent

