from django.shortcuts import redirect
from functools import wraps

def login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is logged in by verifying session data
        if not request.session.get('user_id'):
            # User is not logged in, redirect to login page
            return redirect('index')
        # User is logged in, proceed to the view
        return view_func(request, *args, **kwargs)
    return wrapper