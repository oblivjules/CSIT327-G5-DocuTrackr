from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('admin-login/', views.adminLogin, name='adminlogin'),
    path('student-register/', views.studentRegister, name='studentregister'),
    path('admin-register/', views.adminRegister, name='adminregister'),
    path('student-logout/', views.student_logout, name='student_logout'),
    path('admin-logout/', views.admin_logout, name='admin_logout'),
    path('admin-dashboard/', views.adminDashboard, name='admin-dashboard'),
    path('change-password/', views.change_password, name='change_password'),

    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-otp/<str:email>/', views.verify_otp, name='verify_otp'),
    path('reset-password/', views.reset_password, name='reset_password'),
]
