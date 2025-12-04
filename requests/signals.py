from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from requests.models import Request_Status_Log
from notifications.email_utils import send_status_email

@receiver(post_save, sender=Request_Status_Log)
def send_status_change_email(sender, instance, created, **kwargs):
    if not created:
        return

    request = instance.request
    user = request.user

    if user.email:
        # Check if request was updated very recently (within 2 seconds)
        # If so, email was likely sent manually from the view, so skip to avoid duplicates
        if request.updated_at:
            time_diff = timezone.now() - request.updated_at
            if time_diff < timedelta(seconds=2):
                # Email was likely sent manually, skip signal email
                return
        
        # Refresh request from database to ensure we have latest date_needed and date_ready
        request.refresh_from_db()
        
        # Pass the log instance so email can use new_status
        send_status_email(user.email, request, status_log=instance)
