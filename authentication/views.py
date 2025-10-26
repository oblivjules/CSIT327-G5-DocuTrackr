from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from authentication.models import User
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password
from django.shortcuts import render, redirect
from .models import User

# Student Login
def index(request):
    # Pop messages from session (so they only show once)
    error = request.session.pop('error', None)
    success = request.session.pop('success', None)

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email, role='student')
            if check_password(password, user.password_hash):
                request.session['user_id'] = user.id
                request.session['role'] = user.role
                return redirect('student-dashboard')  # Adjust if you have a specific student dashboard
            else:
                request.session['error'] = "Invalid login credentials. Please try again."
                return redirect('index')
        except User.DoesNotExist:
            request.session['error'] = "Invalid login credentials. Please try again."
            return redirect('index')

    # GET request
    return render(request, 'index.html', {
        'error': error,
        'success': success
    })

# Admin Login
def adminLogin(request):
    # Pop messages from session (so they only show once)
    error = request.session.pop('error', None)
    success = request.session.pop('success', None)

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email, role='registrar')
            if check_password(password, user.password_hash):
                request.session['user_id'] = user.id
                request.session['role'] = user.role
                return redirect('admin-dashboard')  # Adjust if you have a specific admin dashboard
            else:
                request.session['error'] = "Invalid login credentials. Please try again."
                return redirect('adminlogin')
        except User.DoesNotExist:
            request.session['error'] = "Invalid login credentials. Please try again."
            return redirect('adminlogin')

    # GET request
    return render(request, 'admin-login.html', {
        'error': error,
        'success': success
    })

# Student Registration
def studentRegister(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        student_id = request.POST.get('student_id')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        errors = []

        # Check passwords match
        if password != confirm_password:
            errors.append("Passwords do not match.")

        # Check email uniqueness
        if User.objects.filter(email=email).exists():
            errors.append(f"Email '{email}' is already registered.")

        # Check student ID uniqueness
        if User.objects.filter(student_id=student_id).exists():
            errors.append(f"Student ID '{student_id}' is already in use.")

        # If there are any errors, redirect with alert
        if errors:
            request.session['error'] = "\n".join(errors)
            return redirect('studentregister')

        # Create the user
        full_name = f"{first_name.strip()} {last_name.strip()}"
        User.objects.create(
            name=full_name,
            email=email,
            role='student',
            student_id=student_id,
            password_hash=make_password(password),
        )

        # ✅ Store success message in session so alert shows on login page
        request.session['success'] = "Registration Successful!"
        return redirect('index')  # Student login page

    # GET request
    error = request.session.pop('error', None)
    return render(request, 'student-registration.html', {'error': error})


# Registrar Registration
def adminRegister(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        registrar_id = request.POST.get('registrar_id')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        errors = []

        # Check passwords match
        if password != confirm_password:
            errors.append("Passwords do not match.")

        # Check email uniqueness
        if User.objects.filter(email=email).exists():
            errors.append(f"Email '{email}' is already registered.")

        # Check registrar ID uniqueness
        if User.objects.filter(registrar_id=registrar_id).exists():
            errors.append(f"Registrar ID '{registrar_id}' is already in use.")

        # If there are any errors, redirect with alert
        if errors:
            request.session['error'] = "\n".join(errors)
            return redirect('adminregister')

        # Create the user
        full_name = f"{first_name.strip()} {last_name.strip()}"
        User.objects.create(
            name=full_name,
            email=email,
            role='registrar',
            registrar_id=registrar_id,
            password_hash=make_password(password),
        )
        
        # Store success message in session
        request.session['success'] = "Registration Successful!"
        return redirect('adminlogin')

    # GET request
    error = request.session.pop('error', None)
    return render(request, 'admin-registration.html', {'error': error})

reset_tokens = {}

def forgotPassword(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            token = get_random_string(32)
            reset_tokens[email] = token

            # Store success message in session for one-time display
            request.session['message'] = f"A password reset link would be sent to {email}."
            request.session['message_type'] = 'success'
        except User.DoesNotExist:
            request.session['message'] = "No account found with that email address."
            request.session['message_type'] = 'error'

        return redirect('forgotpassword')  # redirect so message shows once

    # GET request — pop message from session
    message = request.session.pop('message', None)
    message_type = request.session.pop('message_type', None)

    return render(request, 'forgot-password.html', {
        'message': message,
        'message_type': message_type
    })

# Logout
def student_logout(request):
    # Clear all session data
    request.session.flush()
    
    # Create response with redirect
    response = redirect('index')
    
    # Add cache control headers to prevent back button access
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

def adminDashboard(request):
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')
    
    full_name = User.objects.get(id=request.session['user_id']).name
    return render(request, 'admin-dashboard.html', {'full_name': full_name})
