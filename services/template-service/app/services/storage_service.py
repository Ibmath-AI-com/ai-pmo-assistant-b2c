from __future__ import annotations

import os
import uuid

import boto3
from botocore.client import Config

from config.settings import get_settings

_settings = get_settings()

_PREFIX = "generated/"


def _client():
    return boto3.client(
        "s3",
        endpoint_url=_settings.s3_endpoint,
        aws_access_key_id=_settings.s3_access_key,
        aws_secret_access_key=_settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def upload_generated(file_path: str, filename: str) -> str:
    key = f"{_PREFIX}{uuid.uuid4()}/{filename}"
    client = _client()
    client.upload_file(file_path, _settings.s3_bucket, key)
    return key


def get_download_url(storage_url: str, expiry: int = 3600) -> str:
    client = _client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _settings.s3_bucket, "Key": storage_url},
        ExpiresIn=expiry,
    )


def delete_generated(storage_url: str) -> None:
    client = _client()
    client.delete_object(Bucket=_settings.s3_bucket, Key=storage_url)
