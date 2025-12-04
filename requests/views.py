import time
from django.conf import settings
from supabase import create_client
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import Request, Payment, Document, Request_Status_Log, Claim_Slips
from authentication.models import User
from notifications.models import Notification
from authentication.decorators import login_required, no_cache
from django.http import JsonResponse



@login_required
@no_cache
def create_request(request):
    """Handles creation of new document requests and uploads proof_of_payment to Supabase Storage."""
    user_id = request.session.get('user_id')
    role = request.session.get('role')

    # Only allow students to access this view
    if role != 'student':
        return redirect('index')

    # Initialize variables
    user = None
    documents = Document.objects.all()
    user_requests = []
    success_message = None

    # Get user info
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect('index')

    # Handle form submission
    if request.method == 'POST':
        document_type = request.POST.get('document_type')
        date_needed = request.POST.get('date_needed')
        copies = request.POST.get('copies', 1)
        proof_file = request.FILES.get('proof_of_payment')

        # Get document instance
        try:
            document = Document.objects.get(name__iexact=document_type)
        except Document.DoesNotExist:
            request.session['error'] = "Invalid document type."
            return redirect('create_request')

        # Parse date_needed if provided
        parsed_date_needed = None
        if date_needed and str(date_needed).strip():
            try:
                from datetime import datetime
                parsed_date_needed = datetime.strptime(date_needed, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                # If parsing fails, try to let Django handle it
                parsed_date_needed = date_needed
        
        # Create the new Request
        new_request = Request.objects.create(
            user=user,
            document=document,
            copies=copies,
            date_needed=parsed_date_needed,
            status='pending',
        )
        
        # Refresh to ensure all fields are properly loaded before email is sent
        new_request.refresh_from_db()

        # Initialize Supabase client
        supabase_url = getattr(settings, "SUPABASE_URL", None)
        supabase_key = getattr(settings, "SUPABASE_ANON_KEY", None)
        supabase_bucket = getattr(settings, "SUPABASE_BUCKET", "payments")

        supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

        # Upload proof file to Supabase if provided
        uploaded_url = None
        if proof_file:
            try:
                filename = f"{user.student_id}_{int(time.time())}_{proof_file.name}"
                file_bytes = proof_file.read()

                # Upload to Supabase Storage
                res = supabase.storage.from_(supabase_bucket).upload(filename, file_bytes)

                # Get public URL
                uploaded_url = supabase.storage.from_(supabase_bucket).get_public_url(filename)

                # Save payment record with Supabase URL
                Payment.objects.create(
                    request_id=new_request,
                    proof_of_payment=uploaded_url,
                    uploaded_at=timezone.now(),
                )

                print(f"✅ Uploaded proof to Supabase: {uploaded_url}")

            except Exception as e:
                print(f"❌ Supabase upload failed: {e}")
                # Fallback: save locally if upload fails
                payment = Payment.objects.create(
                    request_id=new_request,
                    proof_of_payment=proof_file,
                    uploaded_at=timezone.now(),
                )
                uploaded_url = payment.proof_of_payment.url if payment.proof_of_payment else None

        # Log initial request status
        Request_Status_Log.objects.create(
            request=new_request,
            old_status='none',
            new_status='pending',
            changed_by=user,
            changed_at=timezone.now(),
        )

        success_message = "Your request has been submitted successfully."
        request.session['success'] = success_message
        return redirect('create_request')

    # Fetch user requests with related data
    if user:
        user_requests = (
            Request.objects.filter(user=user)
            .select_related('payment', 'document')
            .order_by('-created_at')
        )

    return render(request, 'request-form.html', {
        'full_name': user.name,
        'student_id': user.student_id,
        'documents': documents,
        'user_requests': user_requests,
        'success': request.session.pop('success', None),
    })


from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from authentication.models import User
from .models import Request, Claim_Slips
from authentication.decorators import login_required, no_cache

@login_required
@no_cache
def view_claim_slip(request, request_id):
    # Get the request object directly
    try:
        req = Request.objects.get(request_id=request_id)
    except Request.DoesNotExist:
        messages.error(request, "Request not found.")
        return redirect('student-dashboard')

    # Get claim slip
    claim = Claim_Slips.objects.filter(request=req).first()
    if not claim:
        messages.error(request, "No claim slip available yet for this request.")
        return redirect('student-dashboard')

    user = req.user  # use the actual request owner

    # Debug prints
    print("Request object:", req)
    print("Claim object:", claim)
    print("Request owner:", user.name, user.id)

    context = {
        'req_obj': req,
        'claim': claim,
        'document': req.document,
        'full_name': user.name,
        'student_id': user.student_id,
    }

    return render(request, 'claimslip.html', context)
