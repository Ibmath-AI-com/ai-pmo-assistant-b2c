import hashlib
import io

from config.settings import get_settings

settings = get_settings()


def _get_client():
    import boto3
    from botocore.client import Config

    kwargs = {
        "aws_access_key_id": settings.s3_access_key,
        "aws_secret_access_key": settings.s3_secret_key,
        "config": Config(signature_version="s3v4"),
        "region_name": settings.s3_region,
    }

    if settings.s3_endpoint:
        kwargs["endpoint_url"] = settings.s3_endpoint

    return boto3.client("s3", **kwargs)


def _ensure_bucket(client, bucket: str) -> None:
    from botocore.exceptions import ClientError

    try:
        client.head_bucket(Bucket=bucket)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", type(e).__name__)
        # 404 is returned if bucket doesn't exist
        if error_code == "404":
            if settings.s3_region == "us-east-1":
                client.create_bucket(Bucket=bucket)
            else:
                client.create_bucket(
                    Bucket=bucket,
                    CreateBucketConfiguration={"LocationConstraint": settings.s3_region},
                )
        else:
            raise


def upload_file(file_bytes: bytes, filename: str, bucket: str | None = None) -> tuple[str, str]:
    """Upload bytes to MinIO. Returns (storage_path, checksum)."""
    bucket = bucket or settings.s3_bucket
    client = _get_client()
    _ensure_bucket(client, bucket)

    checksum = hashlib.sha256(file_bytes).hexdigest()
    storage_path = f"uploads/{checksum[:2]}/{checksum[2:4]}/{checksum}-{filename}"

    client.put_object(
        Bucket=bucket,
        Key=storage_path,
        Body=io.BytesIO(file_bytes),
        ContentLength=len(file_bytes),
    )
    return storage_path, checksum


def get_download_url(storage_path: str, bucket: str | None = None, expires_in: int = 3600) -> str:
    """Generate a presigned download URL (expires in `expires_in` seconds)."""
    bucket = bucket or settings.s3_bucket
    client = _get_client()
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": storage_path},
        ExpiresIn=expires_in,
    )
    return url


def delete_file(storage_path: str, bucket: str | None = None) -> None:
    """Delete an object from MinIO."""
    bucket = bucket or settings.s3_bucket
    client = _get_client()
    client.delete_object(Bucket=bucket, Key=storage_path)
