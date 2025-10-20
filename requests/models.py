from django.db import models
from authentication.models import User
from documents.models import Document


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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request #{self.request_id} - {self.document.name}"
    

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    payment_id = models.AutoField(primary_key=True)
    request = models.OneToOneField(Request, on_delete=models.CASCADE, related_name='payment')

    proof_of_payment = models.FileField(upload_to='payments/', blank=True, null=True)
    
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='verified_payments')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payment #{self.payment_id} - {self.payment_status}"

    
class Request_Status_Log(models.Model):
    log_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='status_changes')
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request #{self.request.request_id} status changed to {self.new_status}"