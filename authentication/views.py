from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from authentication.models import User
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password
from .decorators import no_cache
from .decorators import login_required
from django.http import JsonResponse

# Student Login
def index(request):
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
                return redirect('student-dashboard')
            else:
                request.session['error'] = "Invalid login credentials. Please try again."
                return redirect('index')
        except User.DoesNotExist:
            request.session['error'] = "Invalid login credentials. Please try again."
            return redirect('index')

    return render(request, 'index.html', {
        'error': error,
        'success': success
    })

# Admin Login
def adminLogin(request):
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
                return redirect('admin-dashboard')
            else:
                request.session['error'] = "Invalid login credentials. Please try again."
                return redirect('adminlogin')
        except User.DoesNotExist:
            request.session['error'] = "Invalid login credentials. Please try again."
            return redirect('adminlogin')

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

        if password != confirm_password:
            errors.append("Passwords do not match.")

        if User.objects.filter(email=email).exists():
            errors.append(f"Email '{email}' is already registered.")

        if User.objects.filter(student_id=student_id).exists():
            errors.append(f"Student ID '{student_id}' is already in use.")

        if errors:
            request.session['error'] = "\n".join(errors)
            return redirect('studentregister')

        full_name = f"{first_name.strip()} {last_name.strip()}"
        User.objects.create(
            name=full_name,
            email=email,
            role='student',
            student_id=student_id,
            password_hash=make_password(password),
        )

        request.session['success'] = "Registration Successful!"
        return redirect('index')

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

        if password != confirm_password:
            errors.append("Passwords do not match.")

        if User.objects.filter(email=email).exists():
            errors.append(f"Email '{email}' is already registered.")

        if User.objects.filter(registrar_id=registrar_id).exists():
            errors.append(f"Registrar ID '{registrar_id}' is already in use.")

        if errors:
            request.session['error'] = "\n".join(errors)
            return redirect('adminregister')

        full_name = f"{first_name.strip()} {last_name.strip()}"
        User.objects.create(
            name=full_name,
            email=email,
            role='registrar',
            registrar_id=registrar_id,
            password_hash=make_password(password),
        )

        request.session['success'] = "Registration Successful!"
        return redirect('adminlogin')

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

            request.session['message'] = f"A password reset link would be sent to {email}."
            request.session['message_type'] = 'success'
        except User.DoesNotExist:
            request.session['message'] = "No account found with that email address."
            request.session['message_type'] = 'error'

        return redirect('forgotpassword')

    message = request.session.pop('message', None)
    message_type = request.session.pop('message_type', None)

    return render(request, 'forgot-password.html', {
        'message': message,
        'message_type': message_type
    })

# Logout
def student_logout(request):

    request.session.flush()

    response = redirect('index')
    
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

def admin_logout(request):
    request.session.flush()

    response = redirect('adminlogin')
    
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

@no_cache
def adminDashboard(request):
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')
    
    full_name = User.objects.get(id=request.session['user_id']).name
    return render(request, 'admin-dashboard.html', {'full_name': full_name})

@login_required
def change_password(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    user_id = request.session.get('user_id')
    role = request.session.get('role')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=403)

    old_password = request.POST.get('old_password', '').strip()
    new_password = request.POST.get('new_password', '').strip()
    confirm_password = request.POST.get('confirm_password', '').strip()

    if not old_password or not new_password or not confirm_password:
        return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)

    if not check_password(old_password, user.password_hash):
        return JsonResponse({'success': False, 'error': 'Old password is incorrect'}, status=400)

    if new_password != confirm_password:
        return JsonResponse({'success': False, 'error': 'Passwords do not match'}, status=400)

    if len(new_password) < 8:
        return JsonResponse({'success': False, 'error': 'New password must be at least 8 characters'}, status=400)
    if not any(c.isupper() for c in new_password):
        return JsonResponse({'success': False, 'error': 'New password must include an uppercase letter'}, status=400)
    if not any(c.isdigit() for c in new_password):
        return JsonResponse({'success': False, 'error': 'New password must include a number'}, status=400)
    if all(c.isalnum() for c in new_password):
        return JsonResponse({'success': False, 'error': 'New password must include a special character'}, status=400)

    user.password_hash = make_password(new_password)
    user.save()
    return JsonResponse({'success': True})
