import os
from typing import List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PROJECT_NAME: str = "VANVAS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vanvas-the-sorted-club-super-secret-key-himalayan-mist-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Support PostgreSQL with DATABASE_URL, with automatic fallback to SQLite for immediate local dev
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vanvas.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://vanvasai.vercel.app",
        "https://vanvas.vercel.app"
    ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://vanvasai.vercel.app",
            "https://vanvas.vercel.app"
        ]

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.is_production:
            dev_defaults = [
                "vanvas-the-sorted-club-super-secret-key-himalayan-mist-2026",
                "vanvas_secret_jwt_signing_key_production_change_me",
                "secret",
                "change_me"
            ]
            if not self.SECRET_KEY or any(d in self.SECRET_KEY.lower() for d in ["change_me", "super-secret-key-himalayan-mist"]):
                raise ValueError(
                    "In production (ENVIRONMENT=production), a secure, custom SECRET_KEY must be explicitly set via the environment. "
                    "Using default development signing keys is prohibited."
                )

            # Validate CORS origins in production
            if isinstance(self.BACKEND_CORS_ORIGINS, list):
                if "*" in self.BACKEND_CORS_ORIGINS:
                    raise ValueError(
                        "In production (ENVIRONMENT=production), wildcard '*' CORS origin is prohibited when credentials are enabled. "
                        "Explicit frontend domain(s) must be provided in BACKEND_CORS_ORIGINS."
                    )
        return self
    
    # Provider Keys (External integrations)
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")
    PLACES_API_KEY: str = os.getenv("PLACES_API_KEY", "")
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", os.getenv("PLACES_API_KEY", ""))
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    TRANSPORT_API_KEY: str = os.getenv("TRANSPORT_API_KEY", "")
    WEB_SEARCH_API_KEY: str = os.getenv("WEB_SEARCH_API_KEY", os.getenv("TAVILY_API_KEY", os.getenv("SERP_API_KEY", "")))
    WEB_SEARCH_PROVIDER: str = os.getenv("WEB_SEARCH_PROVIDER", "auto")
    # Live Stay Commerce Provider (Amadeus Hotel Offers / Self-Service GDS)
    AMADEUS_CLIENT_ID: str = os.getenv("AMADEUS_CLIENT_ID", os.getenv("HOTEL_PROVIDER_API_KEY", ""))
    AMADEUS_CLIENT_SECRET: str = os.getenv("AMADEUS_CLIENT_SECRET", os.getenv("HOTEL_PROVIDER_SECRET", ""))
    AMADEUS_ENV: str = os.getenv("AMADEUS_ENV", "test")  # "test" or "production"
    AMADEUS_TIMEOUT: float = float(os.getenv("AMADEUS_TIMEOUT", "10.0"))
    # Live Stay Commerce Provider (StayingAPI Accommodation Engine)
    STAYINGAPI_KEY: str = os.getenv("STAYINGAPI_KEY", "")
    STAYINGAPI_TIMEOUT: float = float(os.getenv("STAYINGAPI_TIMEOUT", "10.0"))
    # Image Generation & Creative Art Provider
    IMAGE_PROVIDER: str = os.getenv("IMAGE_PROVIDER", "curated")  # "openai" or "curated"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    IMAGE_OUTPUT_DIR: str = os.getenv("IMAGE_OUTPUT_DIR", "frontend/public/images/destinations")
    IMAGE_FORMAT: str = os.getenv("IMAGE_FORMAT", "webp")
    IMAGE_GENERATION_MODEL: str = os.getenv("IMAGE_GENERATION_MODEL", "gpt-image-2")
    
    # Place Artwork Generator (Gemini image generation abstraction)
    PLACE_ARTWORK_PROVIDER: str = os.getenv("PLACE_ARTWORK_PROVIDER", "disabled")  # "gemini" or "disabled"

    # AI LLM Provider (Free-first Gemini Architecture)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "disabled" or "gemini"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    GEMINI_IMAGE_MODEL: str = os.getenv("GEMINI_IMAGE_MODEL", "imagen-3.0-generate-002")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Email & Verification Provider (Brevo HTTPS Transactional Engine)
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "brevo")  # "brevo", "auto", "disabled"
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", os.getenv("EMAIL_API_KEY", ""))
    EMAIL_API_KEY: str = os.getenv("EMAIL_API_KEY", os.getenv("RESEND_API_KEY", ""))
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "thesortedclub@gmail.com")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "VANVAS")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
    APP_PUBLIC_URL: str = os.getenv("APP_PUBLIC_URL", "https://vanvasai.vercel.app")
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_HOURS", "24"))
    EMAIL_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("EMAIL_RESEND_COOLDOWN_SECONDS", "60"))
    EMAIL_OTP_EXPIRE_MINUTES: int = int(os.getenv("EMAIL_OTP_EXPIRE_MINUTES", "10"))
    EMAIL_OTP_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("EMAIL_OTP_RESEND_COOLDOWN_SECONDS", "60"))
    EMAIL_OTP_MAX_ATTEMPTS: int = int(os.getenv("EMAIL_OTP_MAX_ATTEMPTS", "5"))

    # Recommendation weights
    WEIGHT_INTEREST: float = 0.25
    WEIGHT_BUDGET: float = 0.15
    WEIGHT_LOCATION: float = 0.15
    WEIGHT_RATING: float = 0.10
    WEIGHT_TIME_FIT: float = 0.15
    WEIGHT_GROUP_VOTE: float = 0.10
    WEIGHT_PERSONALIZATION: float = 0.10

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
