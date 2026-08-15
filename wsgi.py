from app.main import app
from fastapi.middleware.wsgi import WSGIMiddleware

# تبدیل FastAPI به WSGI برای PythonAnywhere
application = WSGIMiddleware(app)