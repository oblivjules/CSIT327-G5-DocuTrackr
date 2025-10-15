from django.shortcuts import render

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


