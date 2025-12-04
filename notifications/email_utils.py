from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_status_email(to_email, request_obj, status_log=None, remarks=None):
    """Send a status update email. This function is defensive to avoid raising
    exceptions during request handling (signals call this synchronously).
    
    Args:
        to_email: recipient email address
        request_obj: Request object
        status_log: optional Request_Status_Log for getting the new status
        remarks: optional remarks string to include in the email
    """
    if not to_email:
        return False

    # Use the log's new_status if provided, otherwise use request's current status
    status = status_log.new_status if status_log else str(request_obj.status)
    
    # subject
    subject = f"Request #{request_obj.request_id} Status Update – {status.title()}"

    # Gather request details safely
    document_name = getattr(request_obj.document, 'name', 'Unknown Document')
    try:
        date_needed = request_obj.date_needed.strftime("%B %d, %Y") if request_obj.date_needed else "Not specified"
    except Exception:
        date_needed = "Not specified"
    try:
        date_ready = request_obj.date_ready.strftime("%B %d, %Y") if request_obj.date_ready else "Not yet set"
    except Exception:
        date_ready = "Not yet set"

    # remarks: use provided remarks, otherwise check payment attribute, otherwise "None"
    if remarks and str(remarks).strip():
        remarks_text = str(remarks).strip()
    else:
        try:
            remarks_text = (
                request_obj.payment.remarks
                if hasattr(request_obj, "payment") and request_obj.payment and getattr(request_obj.payment, 'remarks', None)
                else "None"
            )
        except Exception:
            remarks_text = "None"

    # user display name
    user = getattr(request_obj, 'user', None)
    user_name = None
    if user:
        user_name = getattr(user, 'name', None) or getattr(user, 'first_name', None) or getattr(user, 'email', None) or "User"

    # Text (fallback) version
    text_content = (
        f"Hello {user_name},\n\n"
        f"Your request #{request_obj.request_id} has been updated to: {status.upper()}.\n\n"
        f"Document: {document_name}\n"
        f"Date Needed: {date_needed}\n"
        f"Date Ready: {date_ready}\n"
        f"Remarks: {remarks_text}\n\n"
        f"Thank you,\n"
        f"DocuTrackr"
    )

    # HTML version
    html_content = f"""
    <p>Hello <strong>{user_name}</strong>,</p>
    <p>Your request <strong>#{request_obj.request_id}</strong> has been updated to:</p>
    <h2 style="color:#005cbf; margin-top:0;">{status.upper()}</h2>

    <p><strong>Request Details:</strong></p>
    <ul>
        <li><strong>Document:</strong> {document_name}</li>
        <li><strong>Date Needed:</strong> {date_needed}</li>
        <li><strong>Date Ready:</strong> {date_ready}</li>
        <li><strong>Remarks:</strong> {remarks_text}</li>
    </ul>

    <p>Thank you,<br>DocuTrackr</p>
    """

    # Prepare recipients and cc
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    cc_list = getattr(settings, 'REGISTRAR_EMAILS', None) or []

    try:
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            from_email,
            [to_email],
            cc=cc_list if isinstance(cc_list, (list, tuple)) else [cc_list] if cc_list else None,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return True
    except Exception as ex:
        logger.exception("Failed to send status email to %s for request %s", to_email, getattr(request_obj, 'request_id', 'unknown'))
        return False
