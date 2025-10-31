from django.shortcuts import render, redirect
from requests.models import Request, Request_Status_Log
from authentication.models import User
from authentication.decorators import login_required, no_cache
from django.db.models import Q


@login_required
@no_cache
def student_dashboard(request):
    # Use session-based authentication used elsewhere in the app.
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    # If not logged in as a student, redirect to student login (index)
    if role != 'student':
        return redirect('index')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        # Invalid session state; clear session and redirect to login
        request.session.flush()
        return redirect('index')

    # Query all requests of this user with related data for modal
    user_requests = (
        Request.objects.filter(user=user)
        .select_related('document', 'payment')
        .prefetch_related('status_logs')
        .order_by('-created_at')
    )

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


@login_required
@no_cache
def admin_dashboard(request):
    # Check role first
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        user = User.objects.get(id=user_id)
        user_name = user.name

    # Get search query and status filter from request
    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '').strip()

    # Calculate real-time counts from database
    pending_count = Request.objects.filter(status='pending').count()
    processing_count = Request.objects.filter(status='processing').count()
    ready_count = Request.objects.filter(status__in=['approved', 'completed']).count()
    completed_count = Request.objects.filter(status='completed').count()

    # Base queryset for requests
    requests_queryset = Request.objects.select_related('user', 'document')

    # Apply status filter if selected
    if status_filter:
        requests_queryset = requests_queryset.filter(status=status_filter)

    # Apply search filter if search query exists
    if search_query:
        requests_queryset = requests_queryset.filter(
            Q(request_id__icontains=search_query) |  
            Q(user__name__icontains=search_query) |  
            Q(user__student_id__icontains=search_query) |  
            Q(document__name__icontains=search_query) |  
            Q(status__icontains=search_query) |  
            Q(created_at__date__icontains=search_query)  
        )

    # Fetch recent requests (always limit to 10 results)
    recent_requests = requests_queryset.order_by('-created_at')[:10]

    # Calculate total requests count
    total_requests = Request.objects.count()
    
    # Count of filtered results (always limited to 10)
    filtered_count = len(recent_requests)

    # Get available status choices for the filter dropdown
    status_choices = Request.STATUS_CHOICES

    # Get recent activities (status changes) for the activity feed - STAFF ONLY
    recent_activities = Request_Status_Log.objects.select_related(
        'request', 'request__user', 'request__document', 'changed_by'
    ).filter(
        changed_by__role='registrar'  # Only show activities by staff (registrar) users
    ).order_by('-changed_at')[:5]

    context = {
        'full_name': user_name,
        'pending_count': pending_count,
        'processing_count': processing_count,
        'ready_count': ready_count,
        'completed_count': completed_count,
        'recent_requests': recent_requests,
        'total_requests': total_requests,
        'filtered_count': filtered_count,
        'search_query': search_query,
        'status_filter': status_filter,
        'status_choices': status_choices,
        'is_searching': bool(search_query),
        'is_filtering': bool(status_filter),
        'recent_activities': recent_activities,
    }

    return render(request, 'admin-dashboard.html', context)   


@login_required
@no_cache
def about_view(request):
    return render(request, 'about.html', {'user_role': request.session.get('role')})


@login_required
@no_cache
def process_request(request, request_id):
    """Handle processing of a document request by staff"""
    from django.http import JsonResponse
    from django.shortcuts import get_object_or_404
    from django.utils import timezone
    
    # Only allow POST requests
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
    
    # Check if user is staff (registrar)
    if request.session.get('role') != 'registrar':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)
    
    try:
        # Get the document request
        doc_request = get_object_or_404(Request, request_id=request_id)
        
        # Check if request is in pending status
        if doc_request.status != 'pending':
            return JsonResponse({
                'success': False, 
                'error': f'Request is already {doc_request.status}'
            }, status=400)
        
        # Get the staff user
        staff_user = get_object_or_404(User, id=request.session.get('user_id'))
        
        # Update request status to processing
        doc_request.status = 'processing'
        doc_request.save()
        
        # Create status log entry
        Request_Status_Log.objects.create(
            request=doc_request,
            old_status='pending',
            new_status='processing',
            changed_by=staff_user
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Request has been processed successfully',
            'new_status': 'processing'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=500)
