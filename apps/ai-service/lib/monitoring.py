"""Monitoring and error tracking configuration."""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging
import json
import os
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        
        return json.dumps(log_data)

def setup_logging():
    """Configure structured logging."""
    log_format = os.getenv('LOG_FORMAT', 'json').lower()
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create handler
    handler = logging.StreamHandler()
    
    if log_format == 'json':
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
    
    # Configure root logger
    logger = logging.getLogger()
    logger.handlers.clear()
    logger.addHandler(handler)
    logger.setLevel(getattr(logging, log_level))
    
    # Reduce noise from external libraries
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('prisma').setLevel(logging.WARNING)
    
    logger.info(f"Logging configured: format={log_format}, level={log_level}")

def init_sentry():
    """Initialize Sentry error tracking."""
    sentry_dsn = os.getenv('SENTRY_DSN')
    
    if not sentry_dsn:
        logging.info("⚠️ Sentry not configured (SENTRY_DSN missing)")
        return
    
    environment = os.getenv('SENTRY_ENVIRONMENT', 'development')
    traces_sample_rate = float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1'))
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        traces_sample_rate=traces_sample_rate,
        integrations=[
            FastApiIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR
            ),
        ],
        # Send PII data (be careful in production)
        send_default_pii=environment == 'development',
        # Attach stack traces
        attach_stacktrace=True,
        # Release tracking
        release=os.getenv('APP_VERSION', 'unknown'),
    )
    
    logging.info(f"✅ Sentry initialized: env={environment}, sample_rate={traces_sample_rate}")

def capture_exception(error: Exception, context: dict = None):
    """Capture exception with additional context."""
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_context(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)

def log_performance(operation: str, duration_ms: float, metadata: dict = None):
    """Log performance metrics."""
    logger = logging.getLogger(__name__)
    log_data = {
        "operation": operation,
        "duration_ms": round(duration_ms, 2),
        "type": "performance"
    }
    if metadata:
        log_data.update(metadata)
    
    logger.info(json.dumps(log_data))
