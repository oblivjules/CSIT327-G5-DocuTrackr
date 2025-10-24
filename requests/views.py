from django.shortcuts import render, redirect
from django.utils import timezone
from .models import Request, Payment, Document, Request_Status_Log
from authentication.models import User

def create_request(request):
    user_id = request.session.get('user_id')
    user = None
    user_name = None
    student_id = None
    payment = None
    documents = Document.objects.all()
    user_requests = []

    # Get user details
    if user_id:
        try:
            user = User.objects.get(id=user_id)
            user_name = user.name
            student_id = user.student_id
        except User.DoesNotExist:
            request.session['error'] = "User not found."
            return redirect('student-dashboard')

    # Handle request form
    if request.method == 'POST':
        document_type = request.POST.get('document_type')
        date_needed = request.POST.get('date_needed')
        copies = request.POST.get('copies', 1)
        proof = request.FILES.get('proof_of_payment')

        try:
            document = Document.objects.get(name__iexact=document_type)
        except Document.DoesNotExist:
            request.session['error'] = "Invalid document type."
            return redirect('create_request')

        # Create new request
        new_request = Request.objects.create(
            user=user,
            document=document,
            copies=copies,
            date_needed=date_needed,
            status='pending',
        )

        # Create payment record if a proof is uploaded
        if proof:
            Payment.objects.create(
                request=new_request,
                proof_of_payment=proof,
                payment_status='pending',
                uploaded_at=timezone.now(),
            )

        # Log initial status
        Request_Status_Log.objects.create(
            request=new_request,
            old_status='none',
            new_status='pending',
            changed_by=user,
            changed_at=timezone.now(),
        )

        request.session['success'] = "Your request has been submitted successfully."
        return redirect('create_request')

    # Load user requests + related data
    if user:
        user_requests = (
            Request.objects.filter(user=user)
            .select_related('payment', 'document')
            .order_by('-created_at')
        )

    return render(request, 'request-form.html', {
        'full_name': user_name,
        'student_id': student_id,
        'payment': payment,
        'documents': documents,
        'user_requests': user_requests,
        'success': request.session.pop('success', None),
    })


# Logout
def student_logout(request):
    request.session.flush()
    return redirect('index')