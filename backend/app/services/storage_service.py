import os
import io
import logging
import urllib.request
import urllib.parse
import json
import hashlib
import time
from typing import Optional, Any
from pathlib import Path
from datetime import datetime, timezone
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
        content_type: str = "image/webp",
        user_id: Optional[str] = None,
        db: Optional[Any] = None
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

        # Local Persistent Storage with Durable Database Backup
        return cls._upload_local(
            file_bytes=file_bytes,
            storage_key=storage_key,
            content_type=content_type,
            user_id=user_id,
            db=db
        )

    @classmethod
    def _upload_local(
        cls,
        file_bytes: bytes,
        storage_key: str,
        content_type: str = "image/webp",
        user_id: Optional[str] = None,
        db: Optional[Any] = None
    ) -> str:
        """Stores image file in local uploads directory, persists to database, and returns the API URL."""
        # Sanitize storage_key to prevent directory traversal
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
        target_path = upload_dir / clean_key

        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(file_bytes)
            logger.info(f"Avatar saved to local storage cache: {target_path}")
        except Exception as e:
            logger.warning(f"Could not write avatar to local disk: {e}")

        # Always persist to durable database store
        cls._persist_to_database(
            storage_key=clean_key,
            file_bytes=file_bytes,
            content_type=content_type,
            user_id=user_id,
            db=db
        )

        # Return the public API route for serving avatars
        return f"/api/v1/auth/profile/avatar/file/{clean_key}"

    @classmethod
    def _persist_to_database(
        cls,
        storage_key: str,
        file_bytes: bytes,
        content_type: str,
        user_id: Optional[str] = None,
        db: Optional[Any] = None
    ):
        """Safely persists image bytes to database table user_avatar_blobs."""
        try:
            from app.models.models import UserAvatarBlob
            from app.database.session import SessionLocal

            def _upsert(session):
                blob = session.query(UserAvatarBlob).filter(UserAvatarBlob.storage_key == storage_key).first()
                if not blob and user_id:
                    blob = session.query(UserAvatarBlob).filter(UserAvatarBlob.user_id == user_id).first()

                if blob:
                    blob.storage_key = storage_key
                    blob.data = file_bytes
                    blob.content_type = content_type
                    blob.byte_size = len(file_bytes)
                    blob.updated_at = datetime.now(timezone.utc)
                    if user_id:
                        blob.user_id = user_id
                else:
                    new_blob = UserAvatarBlob(
                        user_id=user_id or "system",
                        storage_key=storage_key,
                        data=file_bytes,
                        content_type=content_type,
                        byte_size=len(file_bytes),
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc)
                    )
                    session.add(new_blob)
                session.commit()
                logger.info(f"Avatar durable blob persisted to database for key: {storage_key}")

            if db is not None:
                _upsert(db)
            else:
                with SessionLocal() as session:
                    _upsert(session)
        except Exception as e:
            logger.error(f"Failed to persist avatar blob to database: {e}")

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
    def _delete_cloudinary(cls, storage_key: str) -> bool:
        """Deletes asset from Cloudinary via REST API destroying public_id."""
        cloud_name = settings.CLOUDINARY_CLOUD_NAME
        api_key = settings.CLOUDINARY_API_KEY
        api_secret = settings.CLOUDINARY_API_SECRET
        if not (cloud_name and api_key and api_secret):
            raise StorageServiceException(
                code="PROFILE_STORAGE_NOT_CONFIGURED",
                message="Cloudinary storage credentials are not configured in this environment."
            )

        timestamp = int(time.time())
        public_id = storage_key.replace(".webp", "").replace("/", "_")
        params_to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

        data = urllib.parse.urlencode({
            "public_id": public_id,
            "timestamp": str(timestamp),
            "api_key": api_key,
            "signature": signature
        }).encode("utf-8")

        url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                raw_body = res.read().decode("utf-8")
                try:
                    res_data = json.loads(raw_body)
                except Exception as json_err:
                    logger.error(f"Cloudinary destroy returned non-JSON response: {json_err}")
                    raise StorageServiceException(
                        code="PROFILE_STORAGE_ERROR",
                        message=f"Cloudinary returned invalid JSON response: {json_err}"
                    )
                result = res_data.get("result")
                if result in ("ok", "not found"):
                    logger.info(f"Cloudinary asset destroyed for public_id: {public_id}")
                    return True

                error_info = res_data.get("error", {})
                error_msg = error_info.get("message") if isinstance(error_info, dict) else str(error_info)
                detail = error_msg or f"unexpected result '{result}'"
                logger.error(f"Cloudinary destroy failed: {detail}")
                raise StorageServiceException(
                    code="PROFILE_STORAGE_ERROR",
                    message=f"Cloudinary remote deletion failed: {detail}"
                )
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return True
            logger.error(f"Cloudinary HTTP error {e.code} during asset destruction")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message=f"Cloudinary remote deletion failed: HTTP {e.code}"
            )
        except StorageServiceException:
            raise
        except Exception as e:
            logger.error(f"Cloudinary deletion error: {e}")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message=f"Cloudinary remote deletion failed: {e}"
            )

    @classmethod
    def _delete_s3(cls, storage_key: str) -> bool:
        """Deletes object from S3 / R2 / MinIO."""
        if not (settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY):
            raise StorageServiceException(
                code="PROFILE_STORAGE_NOT_CONFIGURED",
                message="AWS S3 storage credentials are not configured in this environment."
            )
        try:
            import boto3
            from botocore.exceptions import ClientError
        except ImportError:
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message="boto3 SDK is not installed in the environment."
            )

        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        try:
            session = boto3.session.Session()
            s3_client = session.client(
                "s3",
                region_name=settings.S3_REGION_NAME,
                endpoint_url=settings.S3_ENDPOINT_URL or None,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            )
            s3_client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=clean_key
            )
            logger.info(f"Deleted S3 object: {clean_key}")
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code in ("NoSuchKey", "NotFound", "404"):
                logger.info(f"S3 object already missing (idempotent delete): {clean_key}")
                return True
            logger.error(f"S3 ClientError during deletion: {e}")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message=f"S3 remote deletion failed: {code}"
            )
        except StorageServiceException:
            raise
        except Exception as e:
            err_str = str(e).lower()
            if "nosuchkey" in err_str or "notfound" in err_str or "404" in err_str:
                return True
            logger.error(f"S3 deletion error: {e}")
            raise StorageServiceException(
                code="PROFILE_STORAGE_ERROR",
                message=f"S3 remote deletion failed: {e}"
            )

    @classmethod
    def delete_profile_photo(cls, storage_key: Optional[str], db: Optional[Any] = None) -> bool:
        """Deletes avatar from persistent storage, remote providers, and durable database if key exists."""
        if not storage_key:
            return True
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")

        # 1. Remote cloud asset deletion if configured
        provider = cls.get_effective_provider()
        if provider == "cloudinary":
            cls._delete_cloudinary(clean_key)
        elif provider == "s3":
            cls._delete_s3(clean_key)
        elif provider == "disabled":
            # Disabled storage: no cloud asset exists
            pass

        # 2. Local filesystem cache deletion
        try:
            upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
            target_path = upload_dir / clean_key
            if target_path.exists():
                target_path.unlink()
                logger.info(f"Deleted local avatar cache: {target_path}")
        except Exception as e:
            logger.warning(f"Could not delete local avatar file {storage_key}: {e}")

        # 3. Purge from durable database store
        try:
            from app.models.models import UserAvatarBlob
            from app.database.session import SessionLocal

            if db is not None:
                # Request handler owns database transaction - stage delete without committing
                db.query(UserAvatarBlob).filter(
                    (UserAvatarBlob.storage_key == clean_key) |
                    (UserAvatarBlob.storage_key.endswith(clean_key))
                ).delete(synchronize_session=False)
                logger.info(f"Staged avatar blob deletion for key: {clean_key}")
            else:
                with SessionLocal() as session:
                    session.query(UserAvatarBlob).filter(
                        (UserAvatarBlob.storage_key == clean_key) |
                        (UserAvatarBlob.storage_key.endswith(clean_key))
                    ).delete(synchronize_session=False)
                    session.commit()
                    logger.info(f"Purged avatar blob from database for key: {clean_key}")
        except Exception as e:
            logger.error(f"Failed to delete avatar blob from database: {e}")
            raise

        return True

    @classmethod
    def upload_chat_image(
        cls,
        storage_key: str,
        file_bytes: bytes,
        content_type: str = "image/jpeg"
    ) -> str:
        """
        Uploads image attached to Copilot / Ask VANVAS conversation.
        Returns persistent accessible URL.
        """
        provider = cls.get_effective_provider()
        if provider == "cloudinary" and (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
            return cls._upload_cloudinary(file_bytes=file_bytes, storage_key=storage_key)
        if provider == "s3" and (settings.S3_BUCKET_NAME and settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY):
            return cls._upload_s3(file_bytes=file_bytes, storage_key=storage_key, content_type=content_type)
        
        # Local Persistent Storage
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
        target_path = upload_dir / clean_key
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(file_bytes)
        logger.info(f"Chat image saved to local storage: {target_path}")
        return f"/api/v1/copilot/image/{clean_key}"

    @classmethod
    def read_local_file(cls, storage_key: str) -> tuple[Optional[bytes], Optional[str]]:
        """Reads image bytes and mime type for any storage key."""
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
            return target_path.read_bytes(), mime_map.get(ext, "image/jpeg")
        return None, None

    @classmethod
    def read_local_avatar(cls, storage_key: str, db: Optional[Any] = None) -> tuple[Optional[bytes], Optional[str]]:
        """
        Reads avatar bytes and mime type from local storage cache,
        or falls back to durable database storage if ephemeral filesystem was reset.
        """
        clean_key = Path(storage_key).as_posix().lstrip("/").replace("..", "")
        upload_dir = Path(settings.STORAGE_UPLOAD_DIR)
        target_path = upload_dir / clean_key
        mime_map = {
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png"
        }

        # 1. First check local filesystem cache
        if target_path.exists() and target_path.is_file() and target_path.stat().st_size > 0:
            ext = target_path.suffix.lower()
            return target_path.read_bytes(), mime_map.get(ext, "image/webp")

        # 2. Durable database fallback (after restart/redeploy when ephemeral disk was wiped)
        try:
            from app.models.models import UserAvatarBlob
            from app.database.session import SessionLocal

            def _query_blob(session):
                b = session.query(UserAvatarBlob).filter(UserAvatarBlob.storage_key == clean_key).first()
                if not b:
                    b = session.query(UserAvatarBlob).filter(
                        (UserAvatarBlob.storage_key.endswith(clean_key)) |
                        (UserAvatarBlob.storage_key == f"users/{clean_key}")
                    ).first()
                return b

            blob = None
            if db is not None:
                blob = _query_blob(db)
            else:
                with SessionLocal() as session:
                    blob = _query_blob(session)

            if blob and blob.data:
                # Re-populate local filesystem cache for fast subsequent hits
                try:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    target_path.write_bytes(blob.data)
                    logger.info(f"Re-cached avatar on local disk from durable database: {target_path}")
                except Exception as e:
                    logger.warning(f"Could not re-cache avatar on disk: {e}")
                return blob.data, blob.content_type or "image/webp"
        except Exception as e:
            logger.error(f"Error querying avatar blob from database: {e}")

        return None, None

