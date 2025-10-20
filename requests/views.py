from django.shortcuts import render, redirect
from django.core.files.storage import FileSystemStorage
from django.utils import timezone
from .models import Request, Payment, Document
from authentication.models import User


def create_request(request):
    user_id = request.session.get('user_id')
    user_name = None
    student_id = None
    user = None
    payment = None

    if user_id:
        try:
            user = User.objects.get(id=user_id)
            user_name = user.name
            student_id = user.student_id
        except User.DoesNotExist:
            request.session['error'] = "User not found."
            return redirect('student-dashboard')

    # Handle form submission (POST)
    if request.method == 'POST':
        document_type = request.POST.get('document_type')
        date_needed = request.POST.get('date_needed')
        copies = request.POST.get('copies')
        proof = request.FILES.get('proof_of_payment')

        # Validate document type
        try:
            document = Document.objects.get(name__iexact=document_type)
        except Document.DoesNotExist:
            request.session['error'] = "Invalid document type."
            return redirect('create_request')

        # Create new request record
        new_request = Request.objects.create(
            user=user,
            document=document,
            status='pending',
        )

        # Create payment record if file uploaded
        if proof:
            Payment.objects.create(
                request=new_request,
                proof_of_payment=proof,  # FileField automatically handles upload
                payment_status='pending',
                uploaded_at=timezone.now(),
            )

        # Save success message for frontend alert
        request.session['success'] = "Your request has been submitted successfully."
        return redirect('create_request')

    # Fetch latest payment (for "View Proof" section)
    if user:
        payment = Payment.objects.filter(request__user=user).order_by('-uploaded_at').first()

    return render(request, 'request-form.html', {
        'full_name': user_name,
        'student_id': student_id,
        'payment': payment,
        'documents': Document.objects.all(),
        'success': request.session.pop('success', None),
    })


# Logout
def student_logout(request):
    request.session.flush()
    return redirect('index')