from django.urls import path
from . import views

urlpatterns = [
    path('student-dashboard/', views.student_dashboard, name='student-dashboard'),
    path('about/', views.about, name='about'),
    path('admin-dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('requests-list/', views.requests_list, name='admin-requests'),
    path('update-status/<int:request_id>/', views.update_request_status, name='update_request_status'),
    path("claim-slip/<int:slip_id>/", views.claim_slip_view, name="claim-slip"),
]