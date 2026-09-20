import os
import io
import logging
import urllib.request
import urllib.parse
import json
import hashlib
import time
from typing import Optional
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger("vanvas.storage")

class StorageServiceException(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(f"[{code}] {message}")
        self.code = code
        self.message = message

class StorageService:
    @staticmethod
    def is_configured() -> bool:
        provider = settings.STORAGE_PROVIDER.lower()
        if provider == "disabled":
            return False
        if provider == "cloudinary":
            return bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)
        if provider == "s3":
            return bool(settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY)
        # "auto" or "local"
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            return True
        if settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY:
            return True
        return True  # Fallback to local persistent storage

    @classmethod
    def get_effective_provider(cls) -> str:
        provider = settings.STORAGE_PROVIDER.lower()
        if provider in ("disabled", "cloudinary", "s3", "local"):
            return provider
        # "auto" detection
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            return "cloudinary"
        if settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY:
            return "s3"
        return "local"

    @classmethod
    def upload_profile_photo(
        cls,
        storage_key: str,
        file_bytes: bytes,
        content_type: str = "image/webp"
    ) -> str:
        """
        Uploads processed profile photo bytes to configured storage provider.
        Returns the persistent public URL for the avatar.
        """
        provider = cls.get_effective_provider()

        if provider == "disabled":
            raise StorageServiceException(
                code="PROFILE_STORAGE_DISABLED",
                message="Profile storage provider is disabled."
            )

        if provider == "cloudinary":
            if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
                raise StorageServiceException(
                    code="PROFILE_STORAGE_NOT_CONFIGURED",
                    message="Cloudinary storage credentials are not configured in this environment."
                )
            return cls._upload_cloudinary(file_bytes=file_bytes, storage_key=storage_key)

        if provider == "s3":
            if not (settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY):
                raise StorageServiceException(
                    code="PROFILE_STORAGE_NOT_CONFIGURED",
                    message="AWS S3 storage credentials are not configured in this environment."
                )
            return cls._upload_s3(file_bytes=file_bytes, storage_key=storage_key, content_type=content_type)

        # Local Persistent Storage
        return cls._upload_local(file_bytes=file_bytes, storage_key=storage_key)

    @classmethod
    def _upload_local(cls, file_bytes: bytes, storage_key: str) -> str:
        """Stores image file in local uploads directory and returns the API URL."""
        # Sanitize storage_key to prevent directory traversal
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
        target_path = upload_dir / clean_key

        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(file_bytes)
        logger.info(f"Avatar saved to local storage: {target_path}")

        # Return the public API route for serving avatars
        return f"/api/v1/auth/profile/avatar/file/{clean_key}"

    @classmethod
    def _upload_cloudinary(cls, file_bytes: bytes, storage_key: str) -> str:
        """Uploads to Cloudinary via REST API without requiring heavy external SDK."""
        cloud_name = settings.CLOUDINARY_CLOUD_NAME
        api_key = settings.CLOUDINARY_API_KEY
        api_secret = settings.CLOUDINARY_API_SECRET

        timestamp = int(time.time())
        public_id = storage_key.replace(".webp", "").replace("/", "_")

        # Signature generation: sorted param string + api_secret
        params_to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

        # Build multipart payload
        boundary = "----VanvasBoundary" + hashlib.md5(str(time.time()).encode("utf-8")).hexdigest()
        body = io.BytesIO()

        def add_field(name: str, value: str):
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
            body.write(f"{value}\r\n".encode("utf-8"))

        add_field("api_key", api_key)
        add_field("timestamp", str(timestamp))
        add_field("public_id", public_id)
        add_field("signature", signature)

        body.write(f"--{boundary}\r\n".encode("utf-8"))
        body.write(f'Content-Disposition: form-data; name="file"; filename="{public_id}.webp"\r\n'.encode("utf-8"))
        body.write(b"Content-Type: image/webp\r\n\r\n")
        body.write(file_bytes)
        body.write(b"\r\n")
        body.write(f"--{boundary}--\r\n".encode("utf-8"))

        req_data = body.getvalue()
        url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

        req = urllib.request.Request(
            url,
            data=req_data,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(req_data)),
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                res_data = json.loads(res.read().decode("utf-8"))
                secure_url = res_data.get("secure_url") or res_data.get("url")
                if not secure_url:
                    raise Exception("Cloudinary did not return a secure URL.")
                logger.info(f"Avatar uploaded to Cloudinary: {public_id}")
                return secure_url
        except Exception as e:
            logger.error(f"Cloudinary upload error: {e}")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message="Failed to upload profile photo to cloud storage."
            )

    @classmethod
    def _upload_s3(cls, file_bytes: bytes, storage_key: str, content_type: str) -> str:
        """Uploads to S3 bucket (compatible with AWS S3, Cloudflare R2, MinIO)."""
        try:
            import boto3
            session = boto3.session.Session()
            s3_client = session.client(
                "s3",
                region_name=settings.S3_REGION_NAME,
                endpoint_url=settings.S3_ENDPOINT_URL or None,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            )
            s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=storage_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            if settings.S3_ENDPOINT_URL:
                return f"{settings.S3_ENDPOINT_URL.rstrip('/')}/{settings.S3_BUCKET_NAME}/{storage_key}"
            return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION_NAME}.amazonaws.com/{storage_key}"
        except Exception as e:
            logger.error(f"S3 upload error: {e}")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message="Failed to upload profile photo to S3 storage."
            )

    @classmethod
    def delete_profile_photo(cls, storage_key: Optional[str]) -> bool:
        """Deletes avatar from persistent storage if key exists."""
        if not storage_key:
            return True
        try:
            clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
            upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
            target_path = upload_dir / clean_key
            if target_path.exists():
                target_path.unlink()
                logger.info(f"Deleted local avatar: {target_path}")
            return True
        except Exception as e:
            logger.warning(f"Could not delete avatar file {storage_key}: {e}")
            return False

    @classmethod
    def read_local_avatar(cls, storage_key: str) -> tuple[Optional[bytes], Optional[str]]:
        """Reads avatar bytes and content type from local uploads directory."""
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
        target_path = upload_dir / clean_key
        if target_path.exists() and target_path.is_file():
            ext = target_path.suffix.lower()
            mime_map = {
                ".webp": "image/webp",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png"
            }
            return target_path.read_bytes(), mime_map.get(ext, "image/webp")
        return None, None
