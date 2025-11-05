import os
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client
from requests.models import Payment


class Command(BaseCommand):
    help = "Uploads all local proof_of_payment files in media/ to Supabase Storage and updates their URLs."

    def handle(self, *args, **kwargs):
        supabase_url = getattr(settings, "SUPABASE_URL", None)
        supabase_key = getattr(settings, "SUPABASE_ANON_KEY", None)
        bucket = getattr(settings, "SUPABASE_BUCKET", "payments")

        if not supabase_url or not supabase_key:
            self.stdout.write(self.style.ERROR("❌ Supabase credentials are missing in settings.py or .env"))
            return

        supabase = create_client(supabase_url, supabase_key)

        payments = Payment.objects.exclude(proof_of_payment__isnull=True).exclude(proof_of_payment__exact="")
        total = payments.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("⚠️ No payment records found with proof_of_payment."))
            return

        self.stdout.write(self.style.SUCCESS(f"📦 Found {total} payment(s) with local proof files."))

        uploaded = 0
        failed = 0

        for payment in payments:
            # Ensure file exists locally
            local_path = getattr(payment.proof_of_payment, "path", None)
            if not local_path or not os.path.exists(local_path):
                self.stdout.write(
                    self.style.WARNING(f"⚠️ File not found for payment {getattr(payment, 'id', 'unknown')}")
                )
                continue

            try:
                filename = os.path.basename(local_path)
                student_id = getattr(payment.request.user, "student_id", "unknown")
                timestamp = int(time.time())
                storage_path = f"{student_id}_{timestamp}_{filename}"

                with open(local_path, "rb") as file:
                    result = supabase.storage.from_(bucket).upload(storage_path, file)

                # Handle errors in upload response
                if hasattr(result, "error") and result.error:
                    raise Exception(result.error.message)

                # Get the public URL
                public_url_response = supabase.storage.from_(bucket).get_public_url(storage_path)
                public_url = (
                    public_url_response
                    if isinstance(public_url_response, str)
                    else getattr(public_url_response, "public_url", None)
                )

                if not public_url:
                    raise Exception("Failed to generate public URL")

                # Update model with Supabase URL
                payment.proof_of_payment = public_url
                payment.save(update_fields=["proof_of_payment"])
                uploaded += 1

                self.stdout.write(self.style.SUCCESS(f"✅ Uploaded {filename} → {public_url}"))

            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"❌ Failed to upload {local_path}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"\nMigration complete! ✅ {uploaded} uploaded, ❌ {failed} failed."))
