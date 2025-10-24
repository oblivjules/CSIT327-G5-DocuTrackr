from django.urls import path
from . import views

urlpatterns = [
     path('student-dashboard/', views.student_dashboard, name='student-dashboard'),
     path('admin-dashboard/', views.admin_dashboard, name='admin-dashboard'),
     path('about/', views.about_view, name='about'),
]