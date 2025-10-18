from django.shortcuts import render, redirect
from authentication.models import User

def create_request(request):
    user_id = request.session.get('user_id')
    user_name = None
    student_id = None

    if user_id:
        try:
            user = User.objects.get(id=user_id)
            user_name = user.name
            student_id = user.student_id
        except User.DoesNotExist:
            request.session['error'] = "User not found."
            return redirect('student-dashboard')

    # Only handle POST for success alert (frontend-only demo)
    if request.method == 'POST':
        # --- FRONTEND ONLY: skip actual DB storage ---
        request.session['success'] = "Your request has been submitted successfully."
        return redirect('create_request')

    # Pass previously entered values to retain them if user reloads page
    return render(request, 'request-form.html', {
        'full_name': user_name,
        'student_id': student_id,
        'success': request.session.pop('success', None)
    })

# Logout
def student_logout(request):
    request.session.flush()
    return redirect('index')