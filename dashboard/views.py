from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from authentication.decorators import login_required, no_cache
import json
import hashlib

from requests.models import Request, Request_Status_Log, Claim_Slips
from authentication.models import User
from notifications.models import Notification



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
    requests_queryset = Request.objects.select_related('user', 'document','payment')

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
    pending_count = Request.objects.filter(status='pending').count()
    processing_count = Request.objects.filter(status='processing').count()
    ready_count = Request.objects.filter(status__in=['approved', 'completed']).count()
    completed_count = Request.objects.filter(status='completed').count()
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
        'recent_activities': Request_Status_Log.objects.select_related(
            'request', 'request__user', 'changed_by'
        ).filter(
            changed_by__role='registrar').order_by('-changed_at')[:5],
    }

    return render(request, 'admin-dashboard.html', context)   


@login_required
@no_cache
def about(request):
    return render(request, 'about.html', {'user_role': request.session.get('role')})

@login_required
@csrf_exempt  
def update_request_status(request, request_id):
    """Unified handler for updating request status (Registrar only)"""
    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
    
    # ✅ Check registrar role
    if request.session.get('role') != 'registrar':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)
    
    # ✅ Extract POST data (handle both form-data and JSON)
    if request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
            remarks = data.get('remarks', '').strip()
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    else:
        new_status = request.POST.get('status')
        remarks = request.POST.get('remarks', '').strip()
    
    if not new_status:
        return JsonResponse({'success': False, 'error': 'Status is required'}, status=400)
    
    # ✅ Validate status value
    valid_statuses = ['pending', 'processing', 'approved', 'rejected', 'completed']
    if new_status not in valid_statuses:
        return JsonResponse({'success': False, 'error': 'Invalid status value'}, status=400)

    try:
        # ✅ Get records safely
        staff_user = get_object_or_404(User, id=request.session.get("user_id"))
        doc_request = get_object_or_404(Request, pk=request_id)  # Changed variable name to avoid conflict
        old_status = doc_request.status
        
        # ✅ Skip if no change
        if old_status == new_status:
            return JsonResponse({
                'success': False, 
                'error': f'Request is already {new_status}'
            }, status=400)
        
        # ✅ Optional: Add status transition validation
        # For example, can't go from 'completed' back to 'pending'
        invalid_transitions = {
            'completed': ['pending', 'processing']
        }
        if old_status in invalid_transitions and new_status in invalid_transitions[old_status]:
            return JsonResponse({
                'success': False,
                'error': f'Cannot change from {old_status} to {new_status}'
            }, status=400)
        
        with transaction.atomic():
            # --- Update main request ---
            doc_request = Request.objects.select_for_update().get(pk=request_id)
            old_status = doc_request.status

            # Guard against duplicates under concurrency
            if old_status == new_status:
                return JsonResponse({
                    'success': False,
                    'error': f'Request is already {new_status}'
                }, status=400)

            doc_request.status = new_status
            doc_request.updated_at = timezone.now()
            doc_request.save()
            
            # --- Log status change ---
            Request_Status_Log.objects.create(
                request=doc_request,
                old_status=old_status,
                new_status=new_status,
                changed_by=staff_user,
                changed_at=timezone.now()
            )
            
            # --- Auto-create claim slip if approved ---
            claim_slip_info = None
            if new_status == 'approved':
                # Check if claim slip already exists
                existing_claim = Claim_Slips.objects.filter(request=doc_request).first()
                if existing_claim:
                    claim_slip_info = existing_claim.claim_number
                else:
                    claim_slip = Claim_Slips.objects.create(
                        request=doc_request,
                        claim_number=f"CLAIM-{doc_request.request_id}-{int(timezone.now().timestamp())}",
                        date_ready=doc_request.date_needed if doc_request.date_needed else timezone.now().date(),
                        issued_by=staff_user
                    )
                    claim_slip_info = claim_slip.claim_number
            
            # --- Send notification to student ---
            message = f"Your document request (REQ-{doc_request.request_id}) status has been updated to {new_status.upper()}."
            if remarks:
                message += f" Remarks: {remarks}"
            
            Notification.objects.create(
                user=doc_request.user,
                request=doc_request,
                message=message,
                is_read=False,
                created_at=timezone.now()
            )
        
        return JsonResponse({
            'success': True,
            'message': f"Request updated to {new_status}",
            'new_status': new_status,
            'claim_slip': claim_slip_info,
        })
        
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating request {request_id}: {str(e)}", exc_info=True)
        
        return JsonResponse({
            'success': False, 
            'error': f'An error occurred while updating the request'
        }, status=500)


def claim_slip_view(request, slip_id):
    claim_slip = get_object_or_404(Claim_Slips, pk=slip_id)

    user_id = request.session.get("user_id")
    role = request.session.get("role")

    # ✅ Generate actual URLs
    if role == "student":
        home_url = reverse("student-dashboard")
    else:
        home_url = reverse("admin-dashboard")

    return render(request, "claimslip.html", {
        "claim_slip": claim_slip,
        "home_url": home_url,
    })

@login_required
@no_cache
def requests_list(request):
    # Only registrar can access
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    # Basic filters and search (reuse same params as admin_dashboard)
    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '').strip()

    qs = Request.objects.select_related('user', 'document').order_by('-created_at')

    if status_filter:
        qs = qs.filter(status=status_filter)

    if search_query:
        qs = qs.filter(
            Q(request_id__icontains=search_query) |
            Q(user__name__icontains=search_query) |
            Q(user__student_id__icontains=search_query) |
            Q(document__name__icontains=search_query)
        )

    # No limit here — show full set (or can paginate later)
    all_requests = qs

    context = {
        'full_name': User.objects.get(id=request.session.get('user_id')).name if request.session.get('user_id') else None,
        'recent_requests': all_requests,
        'status_choices': Request.STATUS_CHOICES,
        'search_query': search_query,
        'status_filter': status_filter,
    }

    return render(request, 'requests-list.html', context)