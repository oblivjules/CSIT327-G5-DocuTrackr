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
    created_at = models.DateTimeField(auto_now_add=True)