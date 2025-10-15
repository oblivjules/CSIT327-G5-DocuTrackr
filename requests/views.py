from django.shortcuts import render

def create_request(request):
    user_id = request.session.get('user_id')
    user_name = None

    if user_id:
        from authentication.models import User  
        user = User.objects.get(id=user_id)
        user_name = user.name

    context = {
        'full_name': user_name
    }

    return render(request, 'request-form.html', context)
