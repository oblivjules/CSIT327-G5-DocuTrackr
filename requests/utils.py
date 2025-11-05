import time
from django.conf import settings
from supabase import create_client

def upload_file_to_supabase(file, student_id, folder="proofs"):
    """
    Upload a file (InMemoryUploadedFile or path) to Supabase Storage and return its public URL.
    """
    supabase_url = getattr(settings, "SUPABASE_URL", None)
    supabase_key = getattr(settings, "SUPABASE_ANON_KEY", None)
    bucket = getattr(settings, "SUPABASE_BUCKET", "proofs")

    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials are missing in settings.py")

    supabase = create_client(supabase_url, supabase_key)

    # Read file bytes
    file_bytes = file.read() if hasattr(file, "read") else open(file, "rb").read()

    # Create unique filename
    filename = f"{student_id}_{int(time.time())}_{file.name if hasattr(file, 'name') else 'upload.png'}"

    # Upload to Supabase
    res = supabase.storage.from_(bucket).upload(filename, file_bytes)

    if res.get("error"):
        raise Exception(res["error"]["message"])

    # Get public URL
    public_url = supabase.storage.from_(bucket).get_public_url(filename)

    return public_url
