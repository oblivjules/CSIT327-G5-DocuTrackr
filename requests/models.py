from django.db import models
from authentication.models import User
from documents.models import Document
from django.core.exceptions import ValidationError


class Request(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'), 
        ('processing', 'Processing'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    request_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='requests')
    copies = models.PositiveIntegerField(default=1)  
    date_needed = models.DateField(null=True, blank=True)
    date_ready = models.DateField(null=True, blank=True) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request #{self.request_id} - {self.document.name}"


def validate_file_is_image(value):
    if not value.name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg')):
        raise ValidationError('Only image files are allowed.')

class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    request_id = models.OneToOneField(
        'requests.Request',
        on_delete=models.CASCADE,
        related_name='payment',
        db_column='request_id'  
    )

    proof_of_payment = models.FileField(
        upload_to='payments/',
        blank=True,
        null=True,
        max_length=500,
        validators=[validate_file_is_image],
    )

    remarks = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment #{self.payment_id}"


    
class Request_Status_Log(models.Model):
    log_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='status_changes')
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request #{self.request.request_id} status changed to {self.new_status}"
    

class Claim_Slips(models.Model):
    claim_id = models.AutoField(primary_key=True)
    request = models.ForeignKey('Request', on_delete=models.CASCADE, related_name='claim_slips')
    claim_number = models.CharField(max_length=50, unique=True)
    date_ready = models.DateField()
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_claims')
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'claim_slips'
        ordering = ['-issued_at']

    def __str__(self):
        return f"Claim #{self.claim_number} for Request ID {self.request_id}"