from django.conf import settings
from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)