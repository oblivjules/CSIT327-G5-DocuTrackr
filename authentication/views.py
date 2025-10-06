from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from authentication.models import User
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password


# Student Login
def index(request):
    error = None
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email, role="student")
            # ✅ use check_password instead of direct ==
            if check_password(password, user.password_hash):
                request.session['user_id'] = user.id
                request.session['role'] = user.role
                return redirect('dashboard')  # Redirect to student dashboard
            else:
                error = "Invalid password."
        except User.DoesNotExist:
            error = "No student found with that email"
    return render(request, 'index.html', {'error': error})


# Registrar Login
def adminLogin(request):
    error = None
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email, role="registrar")
            if check_password(password, user.password_hash):  # ✅ secure check
                request.session['user_id'] = user.id
                request.session['role'] = user.role
                return redirect('dashboard')  # Redirect to registrar dashboard
            else:
                error = "Invalid password."
        except User.DoesNotExist:
            error = "No admin found with that email"
    return render(request, 'admin-login.html', {'error': error})

# Student Registration
def studentRegister(request):
    error = None

    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        student_id = request.POST.get('student_id')  # This won't be saved yet
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            error = "Passwords do not match."
        elif User.objects.filter(email=email).exists():
            error = "Email is already registered."
        else:
            # Combine first + last into single 'name' field
            full_name = f"{first_name.strip()} {last_name.strip()}"
            User.objects.create(
                name=full_name,
                email=email,
                role='student',
                student_id=student_id,  
                password_hash=make_password(password),
            )
            return redirect('index')  # Student login

    return render(request, 'student-registration.html', {'error': error})

# Registrar Registration
def adminRegister(request):
    error = None

    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        admin_id = request.POST.get('admin_id')  # Not stored yet
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            error = "Passwords do not match."
        elif User.objects.filter(email=email).exists():
            error = "Email is already registered."
        else:
            full_name = f"{first_name.strip()} {last_name.strip()}"
            User.objects.create(
                name=full_name,
                email=email,
                role='registrar',
                admin_id=admin_id,
                password_hash=make_password(password),
            )
            return redirect('adminlogin')

    return render(request, 'admin-registration.html', {'error': error})

reset_tokens = {}

def forgotPassword(request):
    message = None

    if request.method == 'POST':
        email = request.POST.get('email')

        try:
            user = User.objects.get(email=email)
            
            # Generate a simple random token (could use Django's signing or its PasswordResetTokenGenerator)
            token = get_random_string(32)
            reset_tokens[email] = token  # store temporarily (for demonstration)
            
            # Construct a reset URL (adjust domain/path based on your setup)
            reset_link = request.build_absolute_uri(f"/reset-password/{token}/")
            
            # Send email (requires EMAIL settings configured in settings.py)
            send_mail(
                subject="Password Reset - DocuTrackr",
                message=f"Hello {user.name},\n\nClick the link below to reset your password:\n{reset_link}\n\nIf you didn't request this, please ignore this email.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,  # prevents crash if email not configured
            )

            message = "A password reset link has been sent to your email."

        except User.DoesNotExist:
            message = "No account found with that email address."

    return render(request, 'forgot-password.html', {'message': message})