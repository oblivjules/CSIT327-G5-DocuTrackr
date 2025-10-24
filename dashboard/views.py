from django.shortcuts import render, redirect
from requests.models import Request, Request_Status_Log
from authentication.models import User


def student_dashboard(request):
    # Use session-based authentication used elsewhere in the app.
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    # If not logged in as a student, redirect to student login (index)
    if not user_id or role != 'student':
        return redirect('index')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        # Invalid session state; clear session and redirect to login
        request.session.flush()
        return redirect('index')

    # Query all requests of this user
    user_requests = Request.objects.filter(user=user).order_by('-created_at')

    # Stats
    total_requested = user_requests.count()
    ready_for_pickup = user_requests.filter(status__in=['approved', 'completed']).count()

    # Limit to 5 most recent requests for display
    recent_requests = user_requests[:5]

    # Optionally: get recent status changes (activity feed)
    recent_activities = Request_Status_Log.objects.filter(request__user=user).order_by('-changed_at')[:5]

    context = {
        'full_name': user.name,
        'total_requested': total_requested,
        'ready_for_pickup': ready_for_pickup,
        'recent_requests': recent_requests,
        'recent_activities': recent_activities,
    }

    return render(request, 'student-dashboard.html', context)


def admin_dashboard(request):
    # Check role first
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        user = User.objects.get(id=user_id)
        user_name = user.name

    context = {
        'full_name': user_name
    }

    return render(request, 'admin-dashboard.html', context)   


def about_view(request):
    return render(request, 'about.html', {'user_role': request.session.get('role')})  