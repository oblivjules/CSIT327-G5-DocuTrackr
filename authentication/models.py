from django.db import models

# Create your models here.
class User(models.Model):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('registrar', 'Registrar'),
    ]
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    student_id = models.CharField(max_length=50, null=True, blank=True)
    registrar_id = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reset_otp = models.CharField(max_length=6, null=True, blank=True)
    reset_otp_created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name