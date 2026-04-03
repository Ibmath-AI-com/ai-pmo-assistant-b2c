from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database (individual vars)
    db_host: str = Field(default="localhost")
    db_port: int = Field(default=5432)
    db_user: str = Field(default="admin")
    db_password: str = Field(default="admin123")
    db_name: str = Field(default="ai_pmo")
    db_max: int = Field(default=10)

    @computed_field
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @computed_field
    @property
    def sync_database_url(self) -> str:
        return f"postgresql+psycopg2://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")

    # RabbitMQ
    rabbitmq_url: str = Field(default="amqp://guest:guest@localhost:5672/")

    # Object Storage (MinIO / S3)
    s3_endpoint: str = Field(default="http://localhost:9000")
    s3_access_key: str = Field(default="minioadmin")
    s3_secret_key: str = Field(default="minioadmin")
    s3_bucket: str = Field(default="ai-pmo-files")

    # Vector Store
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_collection: str = Field(default="ai_pmo_embeddings")

    # LLM Providers
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    internal_llm_url: str = Field(default="http://localhost:8080/v1")

    # Auth / JWT
    jwt_secret_key: str = Field(default="change-this-to-a-secure-random-string")
    jwt_algorithm: str = Field(default="HS256")
    jwt_access_token_expire_minutes: int = Field(default=30)
    jwt_refresh_token_expire_days: int = Field(default=7)

    # App
    app_env: str = Field(default="development")
    tenant_mode: str = Field(default="both")
    log_level: str = Field(default="INFO")


@lru_cache
def get_settings() -> Settings:
    return Settings()
