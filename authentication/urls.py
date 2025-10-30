from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('admin-login/', views.adminLogin, name='adminlogin'),
    path('student-register/', views.studentRegister, name='studentregister'),
    path('admin-register/', views.adminRegister, name='adminregister'),
    path('forgot-password/', views.forgotPassword, name='forgotpassword'),
    path('student-logout/', views.student_logout, name='student_logout'),
    path('admin-logout/', views.admin_logout, name='admin_logout'),
    path('admin-dashboard/', views.adminDashboard, name='admin-dashboard')
]