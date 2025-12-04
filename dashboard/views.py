from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from datetime import datetime
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from authentication.decorators import login_required, no_cache
import json
import hashlib
import logging

from requests.models import Request, Request_Status_Log, Claim_Slips, Payment
from documents.models import Document
from authentication.models import User
from notifications.models import Notification

logger = logging.getLogger(__name__)

@login_required
@no_cache
def student_dashboard(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    if role != 'student':
        return redirect('index')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect('index')

    user_requests = Request.objects.filter(user=user).select_related('document', 'payment').prefetch_related('status_logs').order_by('-created_at')

    # --- ADD SEARCH LOGIC ---
    search_query = request.GET.get('search', '').strip()
    doc_filter = request.GET.get('doc', '').strip()
    
    if search_query:
        user_requests = user_requests.filter(
            Q(request_id__icontains=search_query) |
            Q(document__name__icontains=search_query) |
            Q(status__icontains=search_query) |
            Q(created_at__date__icontains=search_query)
        )
    
    if doc_filter:
        user_requests = user_requests.filter(document__name=doc_filter)

    total_requested = user_requests.count()
    ready_for_pickup = user_requests.filter(status__in=['approved', 'completed']).count()

    recent_requests = list(user_requests[:10])

    # Backfill remarks for each request: prefer Payment.remarks; fallback to latest Notification text
    try:
        from notifications.models import Notification
        for r in recent_requests:
            remarks_text = ''
            try:
                if hasattr(r, 'payment') and r.payment and r.payment.remarks:
                    remarks_text = r.payment.remarks or ''
                else:
                    n = Notification.objects.filter(user=user, request=r).order_by('-created_at').first()
                    if n and 'Remarks:' in (n.message or ''):
                        idx = n.message.find('Remarks:')
                        if idx != -1:
                            remarks_text = (n.message[idx + len('Remarks:'):]).strip()
            except Exception:
                pass
            setattr(r, 'remarks_text', remarks_text)
    except Exception:
        pass

    recent_activities = Request_Status_Log.objects.select_related('request', 'request__document', 'changed_by').filter(request__user=user).order_by('-changed_at')

    context = {
        'full_name': user.name,
        'total_requested': total_requested,
        'ready_for_pickup': ready_for_pickup,
        'recent_requests': recent_requests,
        'recent_activities': recent_activities,
        'search_query': search_query,
        'is_searching': bool(search_query),
        'document_choices': list(Document.objects.values_list('name', flat=True).distinct().order_by('name')),
        'doc_filter': doc_filter,
    }

    return render(request, 'student-dashboard.html', context)

@login_required
@no_cache
def profile(request):
    role = request.session.get('role')
    if role == 'registrar':
        return redirect('admin-profile')
    if role not in ('student',):
        return redirect('index')
    user_id = request.session.get('user_id')
    user = None
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            request.session.flush()
            return redirect('index')

    home_url = None
    if role == 'student':
        home_url = reverse('student-dashboard')
    else:
        home_url = reverse('index')

    context = {
        'home_url': home_url,
        'full_name': user.name if user else None,
        'student_name': user.name if user else None,
        'email': user.email if user else None,
    }

    return render(request, 'profile.html', context)

@login_required
@no_cache
def admin_profile(request):
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    user_id = request.session.get('user_id')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect('adminlogin')

    context = {
        'home_url': reverse('admin-dashboard'),
        'full_name': user.name if user else None,
        'email': user.email,
    }
    return render(request, 'admin-profile.html', context)


@login_required
@no_cache
def admin_dashboard(request):

    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        user = User.objects.get(id=user_id)
        user_name = user.name

    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '').strip()
    doc_filter = request.GET.get('doc', '').strip()
    sort_key = request.GET.get('sort', '').strip()
    sort_dir = request.GET.get('dir', 'asc').strip().lower()

    pending_count = Request.objects.filter(status='pending').count()
    processing_count = Request.objects.filter(status='processing').count()
    ready_count = Request.objects.filter(status__in=['approved']).count()
    completed_count = Request.objects.filter(status='completed').count()

    requests_queryset = Request.objects.select_related('user', 'document','payment')

    if status_filter:
        requests_queryset = requests_queryset.filter(status=status_filter)

    if doc_filter:
        requests_queryset = requests_queryset.filter(document__name=doc_filter)

    if search_query:
        requests_queryset = requests_queryset.filter(
            Q(request_id__icontains=search_query) |  
            Q(user__name__icontains=search_query) |  
            Q(user__student_id__icontains=search_query) |  
            Q(document__name__icontains=search_query) |  
            Q(status__icontains=search_query) |  
            Q(created_at__date__icontains=search_query)  
        )

    order_fields = ['-created_at']
    if sort_key == 'document':
        if sort_dir == 'desc':
            order_fields = ['-document__name', '-created_at']
        else:
            order_fields = ['document__name', '-created_at']
    recent_requests = list(requests_queryset.order_by(*order_fields)[:10])
    try:
        from notifications.models import Notification
        for r in recent_requests:
            remarks_text = ''
            try:
                if hasattr(r, 'payment') and r.payment and r.payment.remarks:
                    remarks_text = r.payment.remarks or ''
                else:
                    n = Notification.objects.filter(request=r).order_by('-created_at').first()
                    if n and 'Remarks:' in (n.message or ''):
                        idx = n.message.find('Remarks:')
                        if idx != -1:
                            remarks_text = (n.message[idx + len('Remarks:'):]).strip()
            except Exception:
                pass
            setattr(r, 'remarks_text', remarks_text)
    except Exception:
        pass

    pending_count = Request.objects.filter(status='pending').count()
    processing_count = Request.objects.filter(status='processing').count()
    ready_count = Request.objects.filter(status__in=['approved']).count()
    total_requests = Request.objects.count()

    filtered_count = len(recent_requests)

    status_choices = Request.STATUS_CHOICES
    document_choices = list(Document.objects.values_list('name', flat=True).distinct().order_by('name'))

    recent_activities = Request_Status_Log.objects.select_related(
        'request', 'request__user', 'request__document', 'changed_by'
    ).filter(
        changed_by__role='registrar'
    ).order_by('-changed_at')

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
        'document_choices': document_choices,
        'doc_filter': doc_filter,
        'sort': sort_key,
        'dir': sort_dir,
        'is_searching': bool(search_query),
        'is_filtering': bool(status_filter),
        'recent_activities': recent_activities,
    }

    return render(request, 'admin-dashboard.html', context)   


@login_required
@no_cache
def about(request):
    return render(request, 'about.html', {'user_role': request.session.get('role')})


@login_required
@no_cache
def student_requests_list(request):
    """Student-side list of all their document requests with simple search/filter."""
    if request.session.get('role') != 'student':
        return redirect('index')

    user_id = request.session.get('user_id')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect('index')

    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '').strip()
    doc_filter = request.GET.get('doc', '').strip()
    sort_key = request.GET.get('sort', '').strip()
    sort_dir = request.GET.get('dir', 'asc').strip().lower()

    qs = Request.objects.filter(user=user).select_related('document', 'payment')

    if status_filter:
        qs = qs.filter(status=status_filter)

    if doc_filter:
        qs = qs.filter(document__name=doc_filter)

    if search_query:
        qs = qs.filter(
            Q(request_id__icontains=search_query) |
            Q(document__name__icontains=search_query) |
            Q(status__icontains=search_query) |
            Q(created_at__date__icontains=search_query)
        )

    order_fields = ['-created_at']
    if sort_key == 'document':
        if sort_dir == 'desc':
            order_fields = ['-document__name', '-created_at']
        else:
            order_fields = ['document__name', '-created_at']
    recent_requests = list(qs.order_by(*order_fields))
    try:
        for r in recent_requests:
            rt = ''
            if hasattr(r, 'payment') and r.payment and r.payment.remarks:
                rt = r.payment.remarks or ''
            else:
                n = Notification.objects.filter(user=user, request=r).order_by('-created_at').first()
                if n and 'Remarks:' in (n.message or ''):
                    idx = n.message.find('Remarks:')
                    if idx != -1:
                        rt = (n.message[idx + len('Remarks:'):]).strip()
            setattr(r, 'remarks_text', rt)
    except Exception:
        pass
    total_requests = Request.objects.filter(user=user).count()

    context = {
        'full_name': user.name,
        'recent_requests': recent_requests,
        'total_requests': total_requests,
        'search_query': search_query,
        'status_filter': status_filter,
        'status_choices': Request.STATUS_CHOICES,
        'document_choices': list(Document.objects.values_list('name', flat=True).distinct().order_by('name')),
        'doc_filter': doc_filter,
        'sort': sort_key,
        'dir': sort_dir,
        'is_searching': bool(search_query),
    }

    return render(request, 'student-requests-list.html', context)

@login_required
@csrf_exempt
def update_request_status(request, request_id):
    """Handles status updates with simple, consistent, one-time date_ready + claim slip logic."""
    
    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    if request.session.get('role') != 'registrar':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)

    # Read input (JSON or form)
    if request.content_type == "application/json":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        new_status = data.get("status")
        remarks = (data.get("remarks") or "").strip()
        date_ready_raw = data.get("date_ready")
        
        # Debug logging - remove in production if needed
        if date_ready_raw:
            logger.info(f"Request {request_id}: Received date_ready_raw='{date_ready_raw}' (type: {type(date_ready_raw)})")
    else:
        new_status = request.POST.get("status")
        remarks = (request.POST.get("remarks") or "").strip()
        date_ready_raw = request.POST.get("date_ready")

    # Validate
    valid_statuses = ['pending', 'processing', 'approved', 'rejected', 'completed']
    if new_status not in valid_statuses:
        return JsonResponse({'success': False, 'error': 'Invalid status value'}, status=400)

    staff_user = get_object_or_404(User, id=request.session.get("user_id"))
    doc_request = get_object_or_404(Request, pk=request_id)

    if doc_request.status == new_status:
        return JsonResponse({
            'success': False,
            'error': f"Request is already {new_status}"
        }, status=400)

    with transaction.atomic():
        # Lock row for update
        doc_request = Request.objects.select_for_update().get(pk=request_id)
        old_status = doc_request.status

        if old_status == new_status:
            return JsonResponse({
                'success': False,
                'error': f"Request is already {new_status}"
            }, status=400)

        # ---- STATUS UPDATE ----
        doc_request.status = new_status
        doc_request.updated_at = timezone.now()

        # --------------------------------------------------------
        #   APPROVED LOGIC: Set date_ready ONCE when first approved
        #   No edits allowed after that!
        # --------------------------------------------------------
        claim_slip_info = None
        if new_status == "approved":
            # Only set date_ready if:
            # 1. Status is changing TO approved (wasn't approved before)
            # 2. date_ready is not already set
            is_first_time_approved = (old_status != "approved")
            
            if is_first_time_approved and doc_request.date_ready is None:
                # ONLY use date_ready from frontend form
                parsed_date_ready = None
                
                # Check if date_ready was provided from frontend
                if date_ready_raw is not None and str(date_ready_raw).strip():
                    date_ready_str = str(date_ready_raw).strip()
                    try:
                        # Try parse_date first
                        parsed_date_ready = parse_date(date_ready_str)
                        if parsed_date_ready is None:
                            # If parse_date fails, try strptime
                            parsed_date_ready = datetime.strptime(date_ready_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError) as e:
                        logger.error(f"Request {request_id}: Failed to parse date_ready '{date_ready_raw}': {e}")
                        parsed_date_ready = None
                
                # Set date_ready - use parsed value if available, otherwise today
                if parsed_date_ready:
                    doc_request.date_ready = parsed_date_ready
                else:
                    # If form didn't provide a valid date, use today
                    doc_request.date_ready = timezone.now().date()
                    logger.warning(f"Request {request_id}: No valid date_ready from form, using today")

            # Save Request (with date_ready if it was just set)
            if is_first_time_approved and doc_request.date_ready:
                doc_request.save(update_fields=['status', 'date_ready', 'updated_at'])
            else:
                doc_request.save(update_fields=['status', 'updated_at'])

            # Create Claim Slip ONLY if it doesn't exist yet
            existing_claim = Claim_Slips.objects.filter(request=doc_request).first()
            if not existing_claim:
                # Use the date_ready from request (should be set by form)
                # If somehow None, use today as fallback for claim slip only
                claim_date = doc_request.date_ready if doc_request.date_ready else timezone.now().date()
                claim_slip = Claim_Slips.objects.create(
                    request=doc_request,
                    claim_number=f"CLAIM-{doc_request.request_id}-{int(timezone.now().timestamp())}",
                    date_ready=claim_date,
                    issued_by=staff_user
                )
                claim_slip_info = claim_slip.claim_number
            else:
                claim_slip_info = existing_claim.claim_number

        else:
            # Not approved - just save status, don't touch date_ready
            doc_request.save(update_fields=['status', 'updated_at'])

        # ---- STATUS LOG ----
        status_log = Request_Status_Log.objects.create(
            request=doc_request,
            old_status=old_status,
            new_status=new_status,
            changed_by=staff_user,
            changed_at=timezone.now()
        )

        # ---- NOTIFICATION ----
        msg = f"Your document request (REQ-{doc_request.request_id}) is now {new_status.upper()}."
        if remarks:
            msg += f" Remarks: {remarks}"

        Notification.objects.create(
            user=doc_request.user,
            request=doc_request,
            message=msg,
            is_read=False,
            created_at=timezone.now()
        )

        # ---- EMAIL (safe, non-blocking) ----
        from notifications.email_utils import send_status_email

        email_address = doc_request.user.email

        def send_email_after_commit():
            try:
                send_status_email(email_address, doc_request, status_log=status_log, remarks=remarks)
            except Exception:
                logger.exception(f"Request {request_id}: Failed to send email to {email_address}")

        # Schedule email AFTER transaction commits (does NOT block the request)
        if email_address:
            transaction.on_commit(send_email_after_commit)
        
    # FINAL RESPONSE
    return JsonResponse({
        'success': True,
        'message': f"Status updated to {new_status}",
        'new_status': new_status,
        'claim_slip': claim_slip_info,
        'date_ready': str(doc_request.date_ready) if doc_request.date_ready else None,
    })

def claim_slip_view(request, slip_id):
    claim_slip = get_object_or_404(Claim_Slips, pk=slip_id)

    user_id = request.session.get("user_id")
    role = request.session.get("role")

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
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '').strip()
    doc_filter = request.GET.get('doc', '').strip()
    sort_key = request.GET.get('sort', '').strip()
    sort_dir = request.GET.get('dir', 'asc').strip().lower()

    qs = Request.objects.select_related('user', 'document', 'payment')

    if status_filter:
        qs = qs.filter(status=status_filter)

    if doc_filter:
        qs = qs.filter(document__name=doc_filter)

    if search_query:
        qs = qs.filter(
            Q(request_id__icontains=search_query) |
            Q(user__name__icontains=search_query) |
            Q(user__student_id__icontains=search_query) |
            Q(document__name__icontains=search_query) |
            Q(status__icontains=search_query) |
            Q(created_at__date__icontains=search_query)
        )

    order_fields = ['-created_at']
    if sort_key == 'document':
        if sort_dir == 'desc':
            order_fields = ['-document__name', '-created_at']
        else:
            order_fields = ['document__name', '-created_at']
    all_requests = list(qs.order_by(*order_fields))
    try:
        from notifications.models import Notification
        for r in all_requests:
            remarks_text = ''
            try:
                if hasattr(r, 'payment') and r.payment and r.payment.remarks:
                    remarks_text = r.payment.remarks or ''
                else:
                    n = Notification.objects.filter(request=r).order_by('-created_at').first()
                    if n and 'Remarks:' in (n.message or ''):
                        idx = n.message.find('Remarks:')
                        if idx != -1:
                            remarks_text = (n.message[idx + len('Remarks:'):]).strip()
            except Exception:
                pass
            setattr(r, 'remarks_text', remarks_text)
    except Exception:
        pass

    context = {
        'full_name': User.objects.get(id=request.session.get('user_id')).name if request.session.get('user_id') else None,
        'recent_requests': all_requests,
        'status_choices': Request.STATUS_CHOICES,
        'search_query': search_query,
        'status_filter': status_filter,
        'document_choices': list(Document.objects.values_list('name', flat=True).distinct().order_by('name')),
        'doc_filter': doc_filter,
        'sort': sort_key,
        'dir': sort_dir,
    }

    return render(request, 'requests-list.html', context)
