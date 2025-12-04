from django.urls import path
from . import views

urlpatterns = [
    path("api/fetch/", views.fetch_notifications, name="fetch_notifications"),
    path("api/mark-read/", views.mark_all_notifications_read, name="mark_all_notifications_read"),
    path("api/mark-one/<int:notification_id>/", views.mark_notification_read, name="mark_notification_read"),
    path("all/", views.notifications_page, name="notifications_page"),
]
