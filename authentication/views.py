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
from django.urls import reverse
from django.contrib import messages
from authentication.supabase_client import supabase
import re



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

        return redirect('forgot_password')

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


def forgot_password(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()

        if not email or not email.endswith('@cit.edu'):
            err = 'Only CIT institutional email addresses (@cit.edu) are allowed.'
            if is_ajax:
                return JsonResponse({'success': False, 'errors': [err]}, status=400)
            return render(request, 'forgot-password.html', {'message': err, 'message_type': 'error'})

        try:
            supabase.auth.sign_in_with_otp({
                'email': email,
                'options': {'should_create_user': False}
            })
        except Exception as e:
            # don't leak whether email exists
            print(f"Forgot password supabase error (silenced): {e}")

        success_msg = f'If an account exists with {email}, an OTP has been sent. Please check your inbox.'
        redirect_url = reverse('verify_otp', kwargs={'email': email})
        if is_ajax:
            return JsonResponse({'success': True, 'message': success_msg, 'redirect_url': redirect_url})
        return redirect('verify_otp', email=email)

    return render(request, 'forgot-password.html')


def verify_otp(request, email):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if request.method == 'POST':
        otp = request.POST.get('otp', '').strip()
        if not otp or len(otp) != 6:
            err = 'Please enter a valid 6-digit OTP.'
            if is_ajax:
                return JsonResponse({'success': False, 'errors': [err]}, status=400)
            messages.error(request, err)
            return render(request, 'verify_otp.html', {'email': email})

        try:
            response = supabase.auth.verify_otp({
                'email': email,
                'token': otp,
                'type': 'email'
            })
            # response.session may be None on failure
            if getattr(response, 'session', None):
                # store tokens to session to allow password update
                request.session['supa_access_token'] = response.session.access_token
                request.session['supa_refresh_token'] = response.session.refresh_token
                request.session['reset_email'] = email

                success_msg = 'OTP verified! Please enter your new password.'
                redirect_url = reverse('reset_password')
                if is_ajax:
                    return JsonResponse({'success': True, 'message': success_msg, 'redirect_url': redirect_url})
                messages.success(request, success_msg)
                return redirect('reset_password')
            else:
                err = 'Invalid or expired OTP. Please try again.'
                if is_ajax:
                    return JsonResponse({'success': False, 'errors': [err]}, status=400)
                messages.error(request, err)
        except Exception as e:
            err_text = str(e).lower()
            user_msg = 'An unexpected error occurred. Please try again.'
            if 'token has expired' in err_text:
                user_msg = 'OTP has expired or OTP you entered is incorrect. Please try again.'
            elif 'invalid' in err_text or 'not found' in err_text:
                user_msg = 'The OTP you entered is incorrect. Please try again.'
            else:
                print(f"VERIFY OTP ERROR: {e}")

            if is_ajax:
                return JsonResponse({'success': False, 'errors': [user_msg]}, status=400)
            messages.error(request, user_msg)

    return render(request, 'verify_otp.html', {'email': email})


def reset_password(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    # Cannot access this page unless OTP was verified
    if 'supa_access_token' not in request.session:
        messages.error(request, 'Please verify your OTP first.')
        return redirect('forgot_password')

    if request.method == 'POST':
        p1 = request.POST.get('password1', '').strip()
        p2 = request.POST.get('password2', '').strip()
        errors = []

        # Password validation
        if p1 != p2:
            errors.append('Passwords do not match.')
        if len(p1) < 8:
            errors.append('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', p1):
            errors.append('Password needs an uppercase letter.')
        if not re.search(r'[a-z]', p1):
            errors.append('Password needs a lowercase letter.')
        if not re.search(r'[0-9]', p1):
            errors.append('Password needs a number.')
        if not re.search(r'[@$!%*?&]', p1):
            errors.append('Password needs a special character (@$!%*?&).')

        # If password validation failed
        if errors:
            if is_ajax:
                return JsonResponse({'success': False, 'errors': errors}, status=400)

            for e in errors:
                messages.error(request, e)
            return render(request, 'reset_password.html')

        try:
            # IMPORTANT: Apply restored Supabase session before updating password
            supabase.auth.set_session(
                request.session['supa_access_token'],
                request.session['supa_refresh_token']
            )

            # Update password in Supabase
            supabase.auth.update_user({'password': p1})

            # Cleanup stored OTP/session tokens
            request.session.pop('reset_email', None)
            request.session.pop('supa_access_token', None)
            request.session.pop('supa_refresh_token', None)

            success_msg = 'Your password has been successfully reset. Please sign in.'
            redirect_url = reverse('index')

            if is_ajax:
                messages.success(request, success_msg)
                return JsonResponse({'success': True, 'message': success_msg, 'redirect_url': redirect_url})

            messages.success(request, success_msg)
            return redirect('index')

        except Exception as e:
            err_msg = f'Error: {str(e)}'
            if is_ajax:
                return JsonResponse({'success': False, 'errors': [err_msg]}, status=400)
            messages.error(request, err_msg)

    return render(request, 'reset_password.html')