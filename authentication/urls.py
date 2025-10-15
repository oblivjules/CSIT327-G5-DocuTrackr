from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('admin-login/', views.adminLogin, name='adminlogin'),
    path('student-register/', views.studentRegister, name='studentregister'),
    path('admin-register/', views.adminRegister, name='adminregister'),
    path('forgot-password/', views.forgotPassword, name='forgotpassword'),
    path('create-request/', views.create_request, name='create_request'),
    path('dashboard/student', views.student_dashboard, name='student-dashboard'),
]