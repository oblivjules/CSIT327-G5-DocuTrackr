from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import render, redirect
from .models import Notification
from authentication.models import User
import traceback
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from authentication.decorators import login_required, no_cache

def api_login_required(view_func):
    """Decorator that returns JSON for API endpoints when not authenticated"""
    from functools import wraps
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if 'user_id' not in request.session:
            return JsonResponse({"error": "Authentication required", "notifications": []}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

@api_login_required
def fetch_notifications(request):
    try:
        print("🔵 HIT fetch_notifications VIEW")
        user_id = request.session.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found", "notifications": []}, status=404)
        
        notifs = Notification.objects.filter(user=user).select_related('request').order_by('-created_at')[:5]

        data = []
        for n in notifs:
            try:
                data.append({
                    "message": n.message,
                    "time": n.created_at.strftime("%b %d, %I:%M %p"),
                    "is_read": n.is_read,
                    "request_id": n.request.request_id if n.request else None,
                    "status": n.request.status if n.request else None
                })
            except AttributeError as e:
                print(f"⚠️ Error processing notification {n.notification_id}: {e}")
                data.append({
                    "message": n.message,
                    "time": n.created_at.strftime("%b %d, %I:%M %p"),
                    "is_read": n.is_read,
                    "request_id": None,
                    "status": None
                })

        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        return JsonResponse({"notifications": data, "unread_count": unread_count})
    except Exception as e:
        print(f"❌ Error in fetch_notifications: {e}")
        print(traceback.format_exc())
        return JsonResponse({"error": "Failed to fetch notifications", "notifications": []}, status=500)

@api_login_required
@require_POST
def mark_all_notifications_read(request):
    try:
        user_id = request.session.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found"}, status=404)
        
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return JsonResponse({"success": True})
    except Exception as e:
        print(f"❌ Error in mark_all_notifications_read: {e}")
        print(traceback.format_exc())
        return JsonResponse({"success": False, "error": "Failed to mark notifications as read"}, status=500)

@api_login_required
@require_POST
def mark_notification_read(request, notification_id):
    try:
        user_id = request.session.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found"}, status=404)

        notif = Notification.objects.filter(notification_id=notification_id, user=user).first()
        if not notif:
            return JsonResponse({"success": False, "error": "Notification not found"}, status=404)

        if not notif.is_read:
            notif.is_read = True
            notif.save(update_fields=['is_read'])

        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        return JsonResponse({"success": True, "unread_count": unread_count})
    except Exception as e:
        print(f"❌ Error in mark_notification_read: {e}")
        print(traceback.format_exc())
        return JsonResponse({"success": False, "error": "Failed to mark notification as read"}, status=500)

@login_required
@no_cache
def notifications_page(request):
    if 'user_id' not in request.session:
        return redirect('index')
    
    user_id = request.session.get('user_id')
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect('index')
    
    notif_list = Notification.objects.filter(
        user=user
    ).order_by("-created_at")

    unread_count = Notification.objects.filter(
        user=user, is_read=False
    ).count()

    role = request.session.get('role')
    if role == 'student':
        home_url = reverse('student-dashboard')
    else:
        home_url = reverse('admin-dashboard')

    context = {
        "notifications": notif_list,
        "page_obj": None,
        "unread_count": unread_count,
        "full_name": user.name,
        "home_url": home_url,
    }

    return render(request, "notification.html", context)
