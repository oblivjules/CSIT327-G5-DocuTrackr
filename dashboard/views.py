from django.shortcuts import render
from authentication.models import User

def student_dashboard(request):
    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        from authentication.models import User  
        user = User.objects.get(id=user_id)
        user_name = user.name

    context = {
        'full_name': user_name
    }

    return render(request, 'student-dashboard.html', context)

def admin_dashboard(request):
    # Check role first
    if request.session.get('role') != 'registrar':
        return redirect('adminlogin')

    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        user = User.objects.get(id=user_id)
        user_name = user.name

    context = {
        'full_name': user_name
    }

    return render(request, 'admin-dashboard.html', context)     