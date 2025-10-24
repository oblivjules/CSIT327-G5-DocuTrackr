from django.contrib import admin
from .models import Request, Payment, Request_Status_Log

admin.site.register(Request)
admin.site.register(Payment)
admin.site.register(Request_Status_Log)
