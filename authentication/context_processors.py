from django.urls import reverse

from .models import User


def header_info(request):
    """Provide home_url and full_name to templates based on session state.

    - home_url: points to student-dashboard, admin-dashboard or index depending on session role
    - full_name: populated from the custom User model when a user_id is present in session
    """
    role = request.session.get('role')
    user_id = request.session.get('user_id')

    # default home
    try:
        if role == 'student':
            home_url = reverse('student-dashboard')
        elif role == 'registrar':
            home_url = reverse('admin-dashboard')
        else:
            home_url = reverse('index')
    except Exception:
        home_url = '/'

    full_name = ''
    if user_id:
        try:
            user = User.objects.get(id=user_id)
            full_name = user.name
        except Exception:
            full_name = ''

    return {
        'home_url': home_url,
        'full_name': full_name,
    }
